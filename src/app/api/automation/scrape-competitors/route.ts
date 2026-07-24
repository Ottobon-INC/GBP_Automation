import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCompetitorsFromSerpApi } from '@/lib/serpapi';
import { scrapeCompetitorsWithPuppeteer } from '@/lib/scraperService';
import { getSEORecommendations } from '@/lib/gemini';
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

// Helper to look up rank via SerpApi Google Maps search results
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
      return i + 1;
    }
  }
  return null;
}

// Helper to look up rank via local Puppeteer Google Maps search results
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


// Trigger endpoint to perform competitor scraping and AI analysis
// Query param: client_id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const forceRefresh = searchParams.get('force_refresh') === 'true';

  if (!clientId) {
    return NextResponse.json({ error: 'Missing client_id parameter' }, { status: 400 });
  }

  try {
    // 1. Fetch Client Profile from Supabase
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return NextResponse.json(
        { error: `Client not found in database: ${clientErr?.message || 'Unknown'}` },
        { status: 404 }
      );
    }

    // 2. Build the Search Query
    // e.g., "IVF & Fertility Center in Arilova, Visakhapatnam"
    const searchQuery = `${client.primary_category} in ${client.service_area}`;
    console.log(`Starting competitor analysis for client "${client.company_name}" using query: "${searchQuery}"`);

    let competitors: any[] = [];
    let scraperSource = 'SerpApi';
    let isCached = false;

    // Check if we already have scraped competitors for this client
    if (!forceRefresh) {
      const { data: cachedCompetitors } = await supabaseAdmin
        .from('competitor_scrapes')
        .select('*')
        .eq('client_id', clientId);

      if (cachedCompetitors && cachedCompetitors.length > 0) {
        console.log(`Competitor Scrape Caching: Found ${cachedCompetitors.length} cached competitors in DB. Reusing to save SerpApi tokens.`);
        competitors = cachedCompetitors.map((c: any) => ({
          competitor_name: c.competitor_name,
          maps_place_id: c.maps_place_id,
          categories_found: c.categories_found,
          reviews_scraped: c.reviews_scraped
        }));
        scraperSource = 'Cache';
        isCached = true;
      }
    }

    if (!isCached) {
      // 3. Execution Plan with Try-Catch Fallback
      try {
        console.log('Scraper Attempt: Try SerpApi (Plan A)...');
        competitors = await getCompetitorsFromSerpApi(searchQuery);
      } catch (serpError: any) {
        console.warn('SerpApi failed or limit exceeded. Falling back to local Puppeteer (Plan B)...');
        console.warn(`SerpApi Error detail: ${serpError.message}`);
        
        try {
          scraperSource = 'Local Puppeteer';
          competitors = await scrapeCompetitorsWithPuppeteer(searchQuery);
        } catch (pupError: any) {
          console.error('Puppeteer scraper also failed:', pupError.message);
          return NextResponse.json(
            { 
              error: 'Scraper Pipeline Failure', 
              details: `Both SerpApi and Puppeteer attempts failed. SerpApi: ${serpError.message}. Puppeteer: ${pupError.message}` 
            },
            { status: 500 }
          );
        }
      }

      // Filter out client's own listing so they don't appear as a competitor to themselves
      const normalizedClientName = client.company_name.toLowerCase().replace(/\s+/g, '');
      competitors = (competitors || []).filter((c) => {
        if (!c.competitor_name) return false;
        const normalizedCompName = c.competitor_name.toLowerCase().replace(/\s+/g, '');
        return !normalizedCompName.includes(normalizedClientName) && !normalizedClientName.includes(normalizedCompName);
      });

      if (!competitors || competitors.length === 0) {
        return NextResponse.json({ error: 'Scraper returned zero competitor listings (after excluding client itself).' }, { status: 500 });
      }

      // 4. Save Scrape Data to Supabase (`public.competitor_scrapes`)
      // Delete older scrapes for this client first to avoid cluttering
      await supabaseAdmin
        .from('competitor_scrapes')
        .delete()
        .eq('client_id', clientId);

      const competitorInserts = competitors.map((c) => ({
        client_id: clientId,
        competitor_name: c.competitor_name,
        maps_place_id: c.maps_place_id || 'pending',
        categories_found: c.categories_found,
        reviews_scraped: c.reviews_scraped
      }));

      const { error: insertErr } = await supabaseAdmin
        .from('competitor_scrapes')
        .insert(competitorInserts);

      if (insertErr) {
        console.error('Failed to write competitor scrape data:', insertErr.message);
      }
    }

    // 5. Execute Gemini Analysis to optimize listing
    console.log('Sending competitor details to Gemini AI for SEO suggestions...');
    const geminiCompetitorBlock = competitors.map((c) => ({
      name: c.competitor_name,
      categories: c.categories_found,
      reviews: c.reviews_scraped
    }));

    const businessType = client.onboarding_details?.business_type || 'healthcare';

    const recommendations = await getSEORecommendations(
      client.company_name,
      client.primary_category,
      client.service_area,
      client.target_keywords || [],
      geminiCompetitorBlock,
      businessType
    );

    // 6. Save recommendations back to client's `public.gbp_accounts` record
    const { data: gbpAccount, error: fetchAccErr } = await supabaseAdmin
      .from('gbp_accounts')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle();

    if (fetchAccErr) {
      console.error('Failed to check GBP account record existence:', fetchAccErr.message);
    }

    if (gbpAccount) {
      // Update existing record
      const { error: updateErr } = await supabaseAdmin
        .from('gbp_accounts')
        .update({
          ai_optimized_payload: recommendations,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', gbpAccount.id);

      if (updateErr) throw updateErr;
    } else {
      // Create a placeholder record to store optimization payload
      const { error: insertAccErr } = await supabaseAdmin
        .from('gbp_accounts')
        .insert([
          {
            client_id: clientId,
            google_location_id: `pending_${clientId}`,
            refresh_token: 'pending', // Placeholder until OAuth is linked
            ai_optimized_payload: recommendations,
            profile_optimized: false,
            last_synced_at: new Date().toISOString()
          }
        ]);

      if (insertAccErr) throw insertAccErr;
    }

    // 7. Initial rank check for client's target keywords
    console.log(`Performing maps rank check for client "${client.company_name}"...`);
    let initialRankings: Record<string, number | string> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    let ranksFromCache = false;

    if (!forceRefresh) {
      const existingHistory = client.onboarding_details?.rank_history || [];
      const todayEntry = existingHistory.find((h: any) => h.date === todayStr);
      if (todayEntry && todayEntry.rankings && Object.keys(todayEntry.rankings).length > 0) {
        console.log('Rank Checker Caching: Found cached rankings for today. Reusing them to save SerpApi tokens.');
        initialRankings = todayEntry.rankings;
        ranksFromCache = true;
      }
    }

    const clientKeywords = client.target_keywords || [];
    const aiKeywords = recommendations.keyword_recommendations || [];
    const allKeywords = Array.from(new Set([
      ...clientKeywords.map((k: string) => k.trim()),
      ...aiKeywords.map((k: string) => k.trim())
    ])).filter(Boolean);

    if (!ranksFromCache) {
      for (const keyword of allKeywords) {
        // 1. Specific Local query
        const localQuery = `${keyword} in ${client.service_area}`;
        const localKey = `${keyword} (Local - ${client.service_area})`;
        let localRank: number | null = null;
        try {
          localRank = await getRankViaSerpApi(client.company_name, localQuery);
        } catch (serpErr: any) {
          console.warn(`Rank Check: SerpApi failed for local "${localQuery}". Trying Puppeteer fallback...`);
          try {
            localRank = await getRankViaPuppeteer(client.company_name, localQuery);
          } catch (pupErr: any) {
            console.error(`Rank Check: Puppeteer fallback failed for local "${localQuery}":`, pupErr.message);
          }
        }
        initialRankings[localKey] = localRank !== null ? localRank : '20+';

        // 2. Broader District/City query (if different)
        const district = client.service_area.split(',').pop()?.trim() || client.service_area;
        if (district.toLowerCase() !== client.service_area.toLowerCase()) {
          const districtQuery = `${keyword} in ${district}`;
          const districtKey = `${keyword} (District - ${district})`;
          let districtRank: number | null = null;
          try {
            districtRank = await getRankViaSerpApi(client.company_name, districtQuery);
          } catch (serpErr: any) {
            console.warn(`Rank Check: SerpApi failed for district "${districtQuery}". Trying Puppeteer fallback...`);
            try {
              districtRank = await getRankViaPuppeteer(client.company_name, districtQuery);
            } catch (pupErr: any) {
              console.error(`Rank Check: Puppeteer fallback failed for district "${districtQuery}":`, pupErr.message);
            }
          }
          initialRankings[districtKey] = districtRank !== null ? districtRank : '20+';
        }
      }
    }

    const details = client.onboarding_details || {};
    const existingHistory = details.rank_history || [];
    const todayEntryExists = existingHistory.some((h: any) => h.date === todayStr);

    if (!todayEntryExists || !ranksFromCache) {
      const filteredHistory = existingHistory.filter((h: any) => h.date !== todayStr);
      const updatedDetails = {
        ...details,
        rank_history: [
          ...filteredHistory,
          {
            date: todayStr,
            rankings: initialRankings
          }
        ]
      };

      const { error: clientUpdateErr } = await supabaseAdmin
        .from('clients')
        .update({ onboarding_details: updatedDetails })
        .eq('id', clientId);

      if (clientUpdateErr) {
        console.error(`Rank Check: Failed to update client's rank_history:`, clientUpdateErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      scraper_source: scraperSource,
      competitors_scraped: competitors.length,
      initial_rankings: initialRankings,
      recommendations
    });

  } catch (error: any) {
    console.error('Scraper API failed:', error.message);
    return NextResponse.json(
      { error: 'Internal Server Error during scraper execution', details: error.message },
      { status: 500 }
    );
  }
}
