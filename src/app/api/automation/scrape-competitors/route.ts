import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCompetitorsFromSerpApi } from '@/lib/serpapi';
import { scrapeCompetitorsWithPuppeteer } from '@/lib/scraperService';
import { getSEORecommendations } from '@/lib/gemini';
import { getApprovedTrendForNiche } from '@/lib/sheetsService';
import { sendEmail } from '@/lib/emailService';
import { getRankViaSerpApi, getRankViaPuppeteer } from '@/lib/rankService';
import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs';




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
      .select('*, gbp_automations(*)')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return NextResponse.json(
        { error: `Client not found in database: ${clientErr?.message || 'Unknown'}` },
        { status: 404 }
      );
    }

    // Extract primary category from gbp_automations or fallback to client
    const gbpData = Array.isArray(client.gbp_automations) ? client.gbp_automations[0] : client.gbp_automations;
    const primaryCategory = gbpData?.primary_category || client.primary_category || 'Business';
    const safeServiceArea = client.service_area || 'Visakhapatnam';

    // 2. Build the Search Query
    // e.g., "IVF & Fertility Center in Arilova, Visakhapatnam"
    const searchQuery = `${primaryCategory} in ${safeServiceArea}`;
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

    // 5b. Enrich with live Approved Niche Trends (Secret Sauce) from Google Sheet
    try {
      console.log(`Checking Google Sheet for verified secret sauce trends for category: "${client.primary_category}"...`);
      const approvedTrend = await getApprovedTrendForNiche(client.primary_category || client.company_name);
      if (approvedTrend) {
        console.log(`Found verified Secret Sauce data for "${approvedTrend.niche}"! Enriching AI recommendations...`);
        // Merge verified keywords at the very top of recommendations
        const existingKeywords = recommendations.keyword_recommendations || [];
        recommendations.keyword_recommendations = Array.from(new Set([
          ...approvedTrend.trendingKeywords,
          ...existingKeywords
        ])).slice(0, 25);

        // Merge recommended secondary categories
        if (approvedTrend.recommendedCategories.length > 0) {
          const existingCategories = recommendations.recommended_categories?.secondary || [];
          if (!recommendations.recommended_categories) {
            recommendations.recommended_categories = { primary: client.primary_category || '', secondary: [] };
          }
          recommendations.recommended_categories.secondary = Array.from(new Set([
            ...approvedTrend.recommendedCategories,
            ...existingCategories
          ])).slice(0, 5);
        }

        // Merge seasonal FAQs
        if (approvedTrend.faqs.length > 0) {
          const existingFaqs = recommendations.faqs || [];
          const newFaqObjects = approvedTrend.faqs.map(q => ({
            question: q,
            answer: `Please contact our ${client.company_name} consultation desk for detailed information and assistance regarding ${q.toLowerCase().replace(/\?$/, '')}.`
          }));
          recommendations.faqs = [...newFaqObjects, ...existingFaqs].slice(0, 10);
        }
      } else {
        console.log('No approved rows matched in Google Sheet; proceeding with standard AI recommendations.');
      }
    } catch (sheetErr: any) {
      console.warn('Secret Sauce Google Sheet lookup warning:', sheetErr.message);
    }

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
        // 1. Hyper-local query
        const localQuery = `${keyword} in ${safeServiceArea}`;
        const localKey = `${keyword} (Local - ${safeServiceArea})`;
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
        const district = safeServiceArea.split(',').pop()?.trim() || safeServiceArea;
        if (district.toLowerCase() !== safeServiceArea.toLowerCase()) {
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

    // 8. Generate and Send Initial Audit Report
    const adminEmail = 'intern@medcytech.com';
    const clientEmail = client.contact_email;
    const recipients = clientEmail ? [adminEmail, clientEmail] : [adminEmail];
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px 40px; color: white; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .content { padding: 40px; }
          .greeting { font-size: 18px; font-weight: 600; margin-top: 0; color: #0f172a; }
          .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0; }
          .alert-box h3 { color: #b91c1c; margin: 0 0 10px 0; font-size: 16px; }
          .alert-box ul { margin: 0; padding-left: 20px; color: #991b1b; }
          .action-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 25px; border-radius: 12px; margin: 30px 0; }
          .action-box h3 { color: #166534; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center; gap: 8px; }
          .step { margin-bottom: 15px; }
          .step strong { color: #065f46; }
          .footer { background: #f1f5f9; padding: 30px 40px; text-align: center; font-size: 14px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Google Business Profile Audit</h1>
          </div>
          <div class="content">
            <p class="greeting">Hello ${client.company_name} Team,</p>
            <h3>📊 Where You Currently Stand</h3>
            <p>We checked your local rankings against top competitors in <strong>${safeServiceArea}</strong>:</p>
            <p>Your Google Business Profile has been successfully connected to the Medcy SEO Engine. Our AI has just completed a comprehensive audit of your profile against your top local competitors.</p>
            
            <div class="alert-box">
              <h3>⚠️ Technical Gaps Identified</h3>
              <p style="margin-top:0; font-size: 14px; margin-bottom: 10px;">To maximize your visibility, we found several areas where your profile is technically lagging behind local competitors:</p>
              <ul>
                <li><strong>Sub-optimal Category Structure:</strong> Missing critical secondary categories that trigger local search queries.</li>
                <li><strong>Keyword Density:</strong> The profile description lacks high-intent medical SEO keywords.</li>
                <li><strong>Service Indexing:</strong> Popular clinical specialties are not fully mapped to Google's standardized service lists.</li>
              </ul>
            </div>

            <div class="action-box">
              <h3>🚀 Our Optimization Strategy</h3>
              <p style="margin-top:0; font-size: 14px; color: #166534;">We are taking immediate action. Here is exactly what we are deploying to increase your local visibility:</p>
              
              <div class="step">
                <strong>1. Category Realignment:</strong> Shifting your primary category to <i>${recommendations.recommended_categories?.primary || client.primary_category}</i> and injecting high-value secondary tags.
              </div>
              <div class="step">
                <strong>2. SEO Description Overhaul:</strong> Pushing a newly generated, AI-optimized business description rich in targeted keywords like <i>${(recommendations.keyword_recommendations || []).slice(0, 5).join(', ')}</i>.
              </div>
              <div class="step">
                <strong>3. Continuous Ranking Protection:</strong> Our engine is now locked onto your profile and will continuously monitor your local map pack placement.
              </div>
            </div>

            <p><strong>Status:</strong> Our team is currently reviewing these optimizations. Once approved, the changes will be pushed directly to Google automatically. No action is required on your end.</p>
            
            <p style="margin-top: 30px; font-weight: 600;">Best Regards,<br/><span style="color: #059669;">Medcy Health Tech SEO Team</span></p>
          </div>
          <div class="footer">
            Automated SEO Intelligence by Medcy
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: recipients,
        subject: `GBP Initial Audit Report - ${client.company_name}`,
        html: emailHtml
      });
      console.log('Initial audit report emailed successfully.');
    } catch (emailErr: any) {
      console.error('Failed to send audit email:', emailErr.message);
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
