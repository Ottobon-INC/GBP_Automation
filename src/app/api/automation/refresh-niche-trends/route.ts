import { NextRequest, NextResponse } from 'next/server';
import { generateNicheTrendsForMonth } from '@/lib/gemini';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const SPREADSHEET_ID = '1UcoZ5Am5n_zVmscQQX--GJqE5csXF4r7qs87ZvuQHvo';
const KEY_FILE_PATH = path.join(process.cwd(), '.service-account-key.json');

const FOCUS_NICHES = [
  { categoryType: 'Healthcare', niche: 'Gynecologist & Maternity Clinic' },
  { categoryType: 'Healthcare', niche: 'IVF & Fertility Center' },
  { categoryType: 'Healthcare', niche: 'Dermatologist & Skin Clinic' },
  { categoryType: 'Healthcare', niche: 'Dental Clinic' },
  { categoryType: 'Education', niche: 'School' },
  { categoryType: 'Education', niche: 'Junior College' },
  { categoryType: 'Education', niche: 'Degree College' },
  { categoryType: 'Education', niche: 'Engineering College' },
];

export async function GET(request: NextRequest) {
  console.log('Starting Monthly AI Niche Trends Research for 8 Focus Threads...');

  if (!fs.existsSync(KEY_FILE_PATH)) {
    return NextResponse.json({
      error: 'Service account key file (.service-account-key.json) not found in root directory.'
    }, { status: 500 });
  }

  const results: any[] = [];
  const rowsToInsert: string[][] = [
    [
      'Category Type',
      'Niche / Department',
      'AI Recommended Keywords',
      'Recommended Google Categories',
      'Seasonal FAQs',
      'Status'
    ]
  ];

  for (const item of FOCUS_NICHES) {
    console.log(`Running AI research thread for: "${item.niche}" (${item.categoryType})...`);
    const trend = await generateNicheTrendsForMonth(item.niche, item.categoryType);

    results.push({
      niche: item.niche,
      categoryType: item.categoryType,
      keywordsCount: trend.trendingKeywords.length,
      categoriesCount: trend.recommendedCategories.length
    });

    rowsToInsert.push([
      item.categoryType,
      item.niche,
      trend.trendingKeywords.join(', '),
      trend.recommendedCategories.join(', '),
      trend.faqs.join(' | '),
      '⏳ Pending Review'
    ]);
  }

  // Write to Google Sheet
  try {
    console.log('Authenticating with Google Sheets API...');
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const firstSheetTitle = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';

    console.log(`Clearing and populating updated monthly trends in tab "${firstSheetTitle}"...`);
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${firstSheetTitle}!A1:Z100`
    });

    const updateRes = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${firstSheetTitle}!A1:F${rowsToInsert.length}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rowsToInsert
      }
    });

    console.log('SUCCESS! Monthly Niche Trends updated in Google Sheet!');
    return NextResponse.json({
      success: true,
      message: 'Monthly AI Niche Trends research completed for 8 focus threads and written to Google Sheet.',
      updatedCells: updateRes.data.updatedCells,
      threadsResearched: results
    });
  } catch (err: any) {
    console.error('Google Sheets API error during monthly refresh:', err.message);
    return NextResponse.json({
      error: `Failed to update Google Sheet: ${err.message}`,
      threadsResearched: results
    }, { status: 500 });
  }
}
