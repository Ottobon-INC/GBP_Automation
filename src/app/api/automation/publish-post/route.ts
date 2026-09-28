import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { refreshGoogleAccessToken, publishPostToGMB, publishMediaToGMB } from '@/lib/gmbService';
import { generatePostCopy } from '@/lib/gemini';

// Trigger endpoint to publish standard post updates or media photo uploads
// Query params: client_id, post_id (optional)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const postId = searchParams.get('post_id');

  if (!clientId) {
    return NextResponse.json({ error: 'Missing client_id parameter' }, { status: 400 });
  }

  try {
    // 1. Fetch connected GBP account details
    const { data: gbpAccount, error: fetchErr } = await supabaseAdmin
      .from('gbp_accounts')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (fetchErr || !gbpAccount) {
      return NextResponse.json(
        { error: 'GMB connection profile not found. Complete client onboarding first.' },
        { status: 404 }
      );
    }

    const { google_location_id, refresh_token, ai_optimized_payload } = gbpAccount;
    const isMock = process.env.MOCK_GMB_API === 'true';

    if (!isMock && (!refresh_token || refresh_token === 'pending' || !google_location_id || google_location_id.startsWith('pending'))) {
      return NextResponse.json(
        { error: 'This client has not connected their Google Business Profile yet. Setup is in progress.' },
        { status: 400 }
      );
    }

    // Refresh Access Token
    console.log(`Refreshing access tokens for client ${clientId}...`);
    const accessToken = await refreshGoogleAccessToken(refresh_token || 'mock_refresh_token');

    // 2. Scenario A: Publishing a specific pre-defined / scheduled post or photo upload
    if (postId) {
      console.log(`Weekly Post Publisher: Querying details for specific post record ${postId}...`);
      const { data: post, error: postErr } = await supabaseAdmin
        .from('gbp_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postErr || !post) {
        return NextResponse.json({ error: `Post record not found: ${postErr?.message}` }, { status: 404 });
      }

      // Check if it's a media photo upload (represented by call_to_action_type starting with MEDIA_)
      if (post.call_to_action_type?.startsWith('MEDIA_')) {
        const category = post.call_to_action_type.replace('MEDIA_', '') as any;
        console.log(`Publishing showcase photo to Google Maps Media gallery (Category: ${category})...`);
        
        const mediaName = await publishMediaToGMB(
          google_location_id || 'mock_location_id',
          accessToken,
          post.image_url,
          category
        );

        // Update post log status
        await supabaseAdmin
          .from('gbp_posts')
          .update({
            google_post_id: mediaName,
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', postId);

        return NextResponse.json({
          success: true,
          media_id: mediaName,
          category: category,
          image_url: post.image_url
        });
      } else {
        // Standard post publishing
        console.log(`Publishing specific post to Google local posts...`);
        const publishResponse = await publishPostToGMB(
          google_location_id || 'mock_location_id',
          accessToken,
          post.post_text,
          post.image_url || undefined,
          post.call_to_action_type
        );

        await supabaseAdmin
          .from('gbp_posts')
          .update({
            google_post_id: publishResponse.name,
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', postId);

        return NextResponse.json({
          success: true,
          post_id: publishResponse.name,
          content: post.post_text
        });
      }
    }

    // 3. Scenario B: Automated weekly posting blueprint wrap-around
    if (!ai_optimized_payload || !ai_optimized_payload.weekly_posting_plan) {
      return NextResponse.json(
        { error: 'No weekly post blueprint scheduling found. Scrape competitor profiles first.' },
        { status: 400 }
      );
    }

    const { data: client, error: clientErr } = await supabaseAdmin
      .from('gbp_clients')
      .select('*, gbp_automations(*)')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ error: 'Client profile not found in database.' }, { status: 404 });
    }

    const { count } = await supabaseAdmin
      .from('gbp_posts')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'published');

    const nextWeekIndex = (count || 0) + 1;
    const weeklyPlan = ai_optimized_payload.weekly_posting_plan;
    const postBlueprint = weeklyPlan.find((p: any) => p.week === nextWeekIndex) || weeklyPlan[0];

    if (!postBlueprint) {
      return NextResponse.json(
        { error: 'Weekly post plan is empty in the optimization payload.' },
        { status: 400 }
      );
    }

    console.log(`Weekly Post Publisher: Generating post copy for client "${client.company_name}" (Week ${nextWeekIndex})...`);
    const businessType = client.onboarding_details?.business_type || 'healthcare';

    // Extract unranked (20+) keywords from rank history to prioritize in post copy
    const rankHistory = client.onboarding_details?.rank_history || [];
    const latestHistory = rankHistory[rankHistory.length - 1];
    const latestRankings = latestHistory?.rankings || {};
    
    const unrankedKeywords: string[] = [];
    Object.entries(latestRankings).forEach(([key, val]) => {
      if (val === '20+' || val === 'Unranked') {
        const rawKeyword = key
          .replace(/\s*\(Local\s*-\s*[^\)]+\)/i, '')
          .replace(/\s*\(District\s*-\s*[^\)]+\)/i, '')
          .trim();
        if (rawKeyword && !unrankedKeywords.includes(rawKeyword)) {
          unrankedKeywords.push(rawKeyword);
        }
      }
    });

    console.log(`Weekly Post Publisher: Identified unranked boost keywords:`, unrankedKeywords);

    const gbpData = Array.isArray(client.gbp_automations) ? client.gbp_automations[0] : client.gbp_automations;
    const primaryCategory = gbpData?.primary_category || client.primary_category || 'Business';
    const targetKeywords = gbpData?.target_keywords || client.target_keywords || [];

    const postCopy = await generatePostCopy(
      client.company_name,
      primaryCategory,
      client.service_area,
      targetKeywords,
      postBlueprint.topic,
      businessType,
      unrankedKeywords
    );

    const ctaType = postBlueprint.cta === 'NONE' ? 'NONE' : 'LEARN_MORE';
    const ctaUrl = `https://maps.google.com/?cid=${google_location_id || 'mock_location_id'}`;
    const mediaUrl = client.logo_url || gbpData?.building_image_url || client.building_image_url || null;

    console.log(`Publishing post to Google local posts for location ${google_location_id}...`);
    const publishResponse = await publishPostToGMB(
      google_location_id || 'mock_location_id',
      accessToken,
      postCopy,
      mediaUrl || undefined,
      ctaType
    );

    const { error: dbInsertErr } = await supabaseAdmin
      .from('gbp_posts')
      .insert([
        {
          client_id: clientId,
          google_post_id: publishResponse.name,
          post_text: postCopy,
          image_url: mediaUrl,
          call_to_action_type: ctaType,
          call_to_action_url: ctaType !== 'NONE' ? ctaUrl : null,
          status: 'published',
          published_at: new Date().toISOString(),
          scheduled_at: new Date().toISOString()
        }
      ]);

    if (dbInsertErr) {
      console.error('Failed to log published post in Supabase:', dbInsertErr.message);
      throw dbInsertErr;
    }

    return NextResponse.json({
      success: true,
      week_published: nextWeekIndex,
      post_id: publishResponse.name,
      content: postCopy,
      cta_type: ctaType,
      media_url: mediaUrl
    });

  } catch (error: any) {
    console.error('Publish weekly post API failed:', error.message);
    return NextResponse.json(
      { error: 'Failed to publish scheduled weekly post', details: error.message },
      { status: 500 }
    );
  }
}
