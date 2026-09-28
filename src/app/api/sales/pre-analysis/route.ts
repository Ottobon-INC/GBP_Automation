import { NextRequest, NextResponse } from 'next/server';
import { scrapeCompetitorsWithPuppeteer, scrapePreAnalysisData } from '@/lib/scraperService';
import { generateSalesStory } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { businessName, location, businessType, targetKeywords } = await request.json();

    if (!businessName || !location) {
      return NextResponse.json({ error: 'Missing businessName or location' }, { status: 400 });
    }

    let primaryKeyword = '';

    if (targetKeywords && targetKeywords.length > 0) {
      primaryKeyword = targetKeywords[0];
    } else {
      console.log(`No keyword provided. Fetching profile directly for ${businessName} to find category...`);
      const directSearch = await scrapeCompetitorsWithPuppeteer(`${businessName} ${location}`, 1);
      if (!directSearch || directSearch.length === 0) {
        return NextResponse.json({ error: 'Could not locate the target business on Google Maps.' }, { status: 404 });
      }
      const category = directSearch[0].categories_found?.[0] || businessType;
      primaryKeyword = `best ${category}`;
    }
    
    const genericQuery = `${primaryKeyword} in ${location}`;
    console.log(`Deep scraping pre-analysis for generic query: ${genericQuery}`);
    
    const { exactRank, targetBusiness, competitors } = await scrapePreAnalysisData(businessName, genericQuery, location);
    
    if (!targetBusiness) {
      return NextResponse.json({ error: 'Could not locate the target business on Google Maps to analyze it.' }, { status: 404 });
    }
    if (!competitors || competitors.length === 0) {
      return NextResponse.json({ error: 'Found the business, but no competitors to compare against.' }, { status: 400 });
    }

    // 3. Generate Sales Story via Gemini
    console.log(`Generating sales story for ${businessName} (Rank: ${exactRank})...`);
    const salesStory = await generateSalesStory(
      businessName,
      businessType,
      targetKeywords && targetKeywords.length > 0 ? targetKeywords : [primaryKeyword],
      exactRank,
      targetBusiness,
      competitors
    );

    // 4. Return the comprehensive report payload
    return NextResponse.json({
      targetBusiness,
      exactRank,
      competitors,
      salesStory
    });

  } catch (err: any) {
    console.error('Pre-analysis error:', err.message);
    return NextResponse.json({ error: err.message || 'An error occurred during analysis.' }, { status: 500 });
  }
}
