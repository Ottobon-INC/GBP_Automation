import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs';

const SERPAPI_KEY = process.env.SERPAPI_KEY;

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
];

function getChromePath(): string | undefined {
  for (const path of CHROME_PATHS) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  return undefined;
}

// Scrape search rank using SerpApi
async function getRankViaSerpApi(clientName: string, query: string): Promise<number | null> {
  if (!SERPAPI_KEY) throw new Error('Missing SERPAPI_KEY');
  
  const response = await axios.get('https://serpapi.com/search.json', {
    params: {
      engine: 'google_maps',
      q: query,
      api_key: SERPAPI_KEY,
    },
  });

  const listings = response.data.local_results || [];
  const normalizedClientName = clientName.toLowerCase().replace(/\s+/g, '');

  for (let i = 0; i < listings.length; i++) {
    const listingName = (listings[i].title || '').toLowerCase().replace(/\s+/g, '');
    if (listingName.includes(normalizedClientName) || normalizedClientName.includes(listingName)) {
      return i + 1; // Rank is 1-indexed
    }
  }

  return null; // Not found in first page of maps results
}

// Scrape search rank using local Puppeteer
async function getRankViaPuppeteer(clientName: string, query: string): Promise<number | null> {
  const executablePath = getChromePath();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    try {
      await page.waitForSelector('a[href*="/maps/place/"]', { timeout: 8000 });
    } catch {
      return null;
    }

    const listingNames = await page.$$eval('a[href*="/maps/place/"]', (elements) => {
      return elements.map((el) => el.getAttribute('aria-label') || '');
    });

    const normalizedClientName = clientName.toLowerCase().replace(/\s+/g, '');
    for (let i = 0; i < listingNames.length; i++) {
      const name = listingNames[i].toLowerCase().replace(/\s+/g, '');
      if (name.includes(normalizedClientName) || normalizedClientName.includes(name)) {
        return i + 1;
      }
    }

    return null;
  } finally {
    await browser.close();
  }
}

// Cron handler: loops through all clients and updates target keyword ranking history
export async function GET(request: NextRequest) {
  // Simple auth check via header/query token to prevent arbitrary runs in production
  const { searchParams } = new URL(request.url);
  const authSecret = searchParams.get('secret');

  // Skip strict verification in local development to make testing easier
  if (process.env.NODE_ENV === 'production' && authSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized CRON execution' }, { status: 401 });
  }

  try {
    // 1. Get all clients
    const { data: clients, error: fetchErr } = await supabaseAdmin
      .from('gbp_clients')
      .select('id, company_name, target_keywords, service_area, onboarding_details, gbp_automations(target_keywords)');

    if (fetchErr || !clients) {
      throw new Error(`Failed to query clients list: ${fetchErr?.message}`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const results: any[] = [];

    for (const client of clients) {
      const serviceArea = client.service_area || '';
      
      // Fetch matching gbp_account to get AI-suggested keywords
      const { data: gbpAccount } = await supabaseAdmin
        .from('gbp_accounts')
        .select('ai_optimized_payload')
        .eq('client_id', client.id)
        .maybeSingle();

      const gbpData = Array.isArray(client.gbp_automations) ? client.gbp_automations[0] : client.gbp_automations;
      const clientKeywords = gbpData?.target_keywords || client.target_keywords || [];
      const aiKeywords = gbpAccount?.ai_optimized_payload?.keyword_recommendations || [];
      
      const allKeywords = Array.from(new Set([
        ...clientKeywords.map((k: string) => k.trim()),
        ...aiKeywords.map((k: string) => k.trim())
      ])).filter(Boolean);

      if (allKeywords.length === 0 || !serviceArea) {
        console.log(`Skipping rank check for "${client.company_name}" (No keywords or service area).`);
        continue;
      }

      const currentRankings: Record<string, number | string> = {};

      for (const keyword of allKeywords) {
        // 1. Specific Local query
        const localQuery = `${keyword} in ${serviceArea}`;
        const localKey = `${keyword} (Local - ${serviceArea})`;
        let localRank: number | null = null;

        try {
          localRank = await getRankViaSerpApi(client.company_name, localQuery);
        } catch (serpErr: any) {
          console.warn(`Daily Rank Tracker: SerpApi failed for "${client.company_name}" / "${localQuery}". Falling back to Puppeteer...`, serpErr.message);
          try {
            localRank = await getRankViaPuppeteer(client.company_name, localQuery);
          } catch (pupErr: any) {
            console.error(`Daily Rank Tracker: Puppeteer fallback also failed for local:`, pupErr.message);
          }
        }
        currentRankings[localKey] = localRank !== null ? localRank : '20+';

        // 2. Broader District/City query (if different)
        const district = serviceArea.split(',').pop()?.trim() || serviceArea;
        if (district.toLowerCase() !== serviceArea.toLowerCase()) {
          const districtQuery = `${keyword} in ${district}`;
          const districtKey = `${keyword} (District - ${district})`;
          let districtRank: number | null = null;

          try {
            districtRank = await getRankViaSerpApi(client.company_name, districtQuery);
          } catch (serpErr: any) {
            console.warn(`Daily Rank Tracker: SerpApi failed for "${client.company_name}" / "${districtQuery}". Falling back to Puppeteer...`, serpErr.message);
            try {
              districtRank = await getRankViaPuppeteer(client.company_name, districtQuery);
            } catch (pupErr: any) {
              console.error(`Daily Rank Tracker: Puppeteer fallback also failed for district:`, pupErr.message);
            }
          }
          currentRankings[districtKey] = districtRank !== null ? districtRank : '20+';
        }
      }

      // Update client onboarding_details.rank_history
      const details = client.onboarding_details || {};
      const history = details.rank_history || [];

      // Append today's rank entry
      const newHistoryEntry = {
        date: todayStr,
        rankings: currentRankings
      };

      // Filter out duplicate date entries if triggered twice in the same day, then append
      const updatedHistory = history.filter((h: any) => h.date !== todayStr);
      updatedHistory.push(newHistoryEntry);

      // Keep only the last 30 entries (rolling 30 days) to optimize DB space
      const cappedHistory = updatedHistory.slice(-30);

      const updatedDetails = {
        ...details,
        rank_history: cappedHistory
      };

      // Write back to database
      const { error: updateErr } = await supabaseAdmin
        .from('gbp_clients')
        .update({ onboarding_details: updatedDetails })
        .eq('id', client.id);

      if (updateErr) {
        console.error(`Failed to update ranking history for "${client.company_name}":`, updateErr.message);
      }

      results.push({
        client_id: client.id,
        company_name: client.company_name,
        rankings_updated: currentRankings
      });
    }

    return NextResponse.json({
      success: true,
      processed_clients: results.length,
      data: results
    });

  } catch (err: any) {
    console.error('Daily Rank Tracker CRON failed:', err.message);
    return NextResponse.json({ error: 'Cron execution failed', details: err.message }, { status: 500 });
  }
}
