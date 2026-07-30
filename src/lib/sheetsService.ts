import axios from 'axios';
import { generateNicheTrendsForMonth } from './gemini';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export interface NicheTrendData {
  categoryType: string;      // e.g., 'Healthcare' | 'Education'
  niche: string;             // e.g., 'IVF & Fertility Center', 'Engineering College'
  trendingKeywords: string[];// list of high-ranking keywords
  recommendedCategories: string[]; // Google Business primary & secondary categories
  faqs: string[];            // seasonal patient/student FAQs
  status: string;            // 'Approved' | 'Pending Review' | 'Rejected'
}

// The direct public CSV export link of the user's Google Sheet
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1UcoZ5Am5n_zVmscQQX--GJqE5csXF4r7qs87ZvuQHvo/gviz/tq?tqx=out:csv';

/**
 * Parses raw CSV text into structured NicheTrendData objects
 */
function parseCsvToNicheData(csvText: string): NicheTrendData[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  // Handle multiline CSV cells enclosed in quotes
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = '';
      if (char === '\r' && csvText[i + 1] === '\n') i++; // Skip \n in \r\n
      continue;
    }
    currentLine += char;
  }
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  if (lines.length <= 1) return []; // Only header row or empty

  const results: NicheTrendData[] = [];
  // Skip row 0 (headers)
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    if (row.length < 5) continue; // Skip incomplete rows

    const categoryType = cleanCell(row[0]);
    const niche = cleanCell(row[1]);
    const keywordsRaw = cleanCell(row[2]);
    const categoriesRaw = cleanCell(row[3]);
    const faqsRaw = cleanCell(row[4]);
    const status = row[5] ? cleanCell(row[5]) : 'Pending Review';

    if (!niche) continue;

    results.push({
      categoryType,
      niche,
      trendingKeywords: keywordsRaw.split(/[,;\n]/).map(k => k.trim()).filter(Boolean),
      recommendedCategories: categoriesRaw.split(/[,;\n]/).map(c => c.trim()).filter(Boolean),
      faqs: faqsRaw.split(/\||\n/).map(f => f.trim()).filter(Boolean),
      status
    });
  }

  return results;
}

function parseCsvRow(rowStr: string): string[] {
  const cells: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    if (char === '"') {
      if (inQuotes && rowStr[i + 1] === '"') {
        currentCell += '"'; // Escaped quote
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(currentCell);
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  cells.push(currentCell);
  return cells;
}

function cleanCell(val: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
}

/**
 * Fetches the live Niche Trends from the Google Sheet CSV export
 */
export async function fetchNicheTrendsFromSheet(): Promise<NicheTrendData[]> {
  try {
    const response = await axios.get(SHEET_CSV_URL, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const csvText = response.data;
    return parseCsvToNicheData(csvText);
  } catch (error: any) {
    console.error('Failed to fetch Niche Trends from Google Sheet:', error.message);
    return [];
  }
}

/**
 * Finds the Approved SEO trend data for a specific niche or category
 */
export async function getApprovedTrendForNiche(nicheName: string): Promise<NicheTrendData | null> {
  const allTrends = await fetchNicheTrendsFromSheet();
  const normalizedSearch = nicheName.toLowerCase().trim();

  // 1. Exact or partial match on approved niche
  const match = allTrends.find(t => 
    t.status.toLowerCase().includes('approved') &&
    (t.niche.toLowerCase().includes(normalizedSearch) || normalizedSearch.includes(t.niche.toLowerCase()))
  );

  if (match) return match;

  // 2. Check if there is a Rejected row for this niche -> Auto trigger Re-research Loop!
  const rejectedMatchIndex = allTrends.findIndex(t =>
    t.status.toLowerCase().includes('reject') &&
    (t.niche.toLowerCase().includes(normalizedSearch) || normalizedSearch.includes(t.niche.toLowerCase()))
  );

  if (rejectedMatchIndex !== -1) {
    const rejectedTrend = allTrends[rejectedMatchIndex];
    console.log(`⚠️ Niche "${rejectedTrend.niche}" was marked as REJECTED by human verifier! Starting automatic AI Re-Research loop from scratch...`);
    const reResearched = await triggerReResearchForRejected(rejectedTrend, rejectedMatchIndex + 2); // +2 because 1-based index and header row
    return reResearched;
  }

  // 3. Fallback: Any approved row matching category word
  const fallback = allTrends.find(t =>
    t.status.toLowerCase().includes('approved') &&
    (normalizedSearch.includes('college') || normalizedSearch.includes('school') || normalizedSearch.includes('institute') ?
      t.categoryType.toLowerCase() === 'education' :
      t.categoryType.toLowerCase() === 'healthcare')
  );

  return fallback || null;
}

/**
 * When a niche trend is marked as Rejected, automatically re-runs AI research from start and updates the Sheet
 */
async function triggerReResearchForRejected(trend: NicheTrendData, rowNum: number): Promise<NicheTrendData> {
  console.log(`Running fresh Gemini AI research thread for rejected niche: "${trend.niche}"...`);
  const freshTrend = await generateNicheTrendsForMonth(trend.niche, trend.categoryType);
  
  const updatedStatus = '⏳ Pending Review (Re-researched)';
  const newRowValues = [
    trend.categoryType,
    trend.niche,
    freshTrend.trendingKeywords.join(', '),
    freshTrend.recommendedCategories.join(', '),
    freshTrend.faqs.join(' | '),
    updatedStatus
  ];

  const keyFilePath = path.join(process.cwd(), '.service-account-key.json');
  const spreadsheetId = '1UcoZ5Am5n_zVmscQQX--GJqE5csXF4r7qs87ZvuQHvo';

  if (fs.existsSync(keyFilePath)) {
    try {
      console.log(`Updating Google Sheet row ${rowNum} with newly researched trends...`);
      const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      const sheets = google.sheets({ version: 'v4', auth });
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const firstSheetTitle = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${firstSheetTitle}!A${rowNum}:F${rowNum}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [newRowValues]
        }
      });
      console.log(`SUCCESS! Row ${rowNum} updated in Google Sheet with new status: "${updatedStatus}".`);
    } catch (err: any) {
      console.warn('Could not update Google Sheet during re-research:', err.message);
    }
  }

  return {
    categoryType: trend.categoryType,
    niche: trend.niche,
    trendingKeywords: freshTrend.trendingKeywords,
    recommendedCategories: freshTrend.recommendedCategories,
    faqs: freshTrend.faqs,
    status: updatedStatus
  };
}

