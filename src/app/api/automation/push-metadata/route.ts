import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { refreshGoogleAccessToken, pushMetadataToGMB, pushServiceListToGMB } from '@/lib/gmbService';

// Trigger endpoint to push Gemini recommendations to the client's GMB profile
// Query param: client_id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');

  if (!clientId) {
    return NextResponse.json({ error: 'Missing client_id parameter' }, { status: 400 });
  }

  try {
    // 1. Fetch connected GBP account details and AI recommendation payload
    const { data: gbpAccount, error: fetchErr } = await supabaseAdmin
      .from('gbp_accounts')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (fetchErr || !gbpAccount) {
      return NextResponse.json(
        { error: 'GMB connection profile not found. Scrape competitors first to generate optimization data.' },
        { status: 404 }
      );
    }

    const { google_location_id, refresh_token, ai_optimized_payload } = gbpAccount;

    if (!ai_optimized_payload) {
      return NextResponse.json(
        { error: 'No AI optimization recommendations found for this client. Please run scraper optimization first.' },
        { status: 400 }
      );
    }

    const primaryCategory = ai_optimized_payload.recommended_categories?.primary;
    const secondaryCategories = ai_optimized_payload.recommended_categories?.secondary || [];
    const description = ai_optimized_payload.suggested_profile_description;

    if (!primaryCategory || !description) {
      return NextResponse.json(
        { error: 'AI recommendations payload is missing category or description text.' },
        { status: 400 }
      );
    }

    // 2. Fetch Client Info (for phone and website)
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('gbp_clients')
      .select('*, gbp_automations(*)')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ error: 'Client profile not found in database.' }, { status: 404 });
    }

    // Check if client has connected their GMB listing via OAuth
    const isMock = process.env.MOCK_GMB_API === 'true';
    if (!isMock && (!refresh_token || refresh_token === 'pending' || !google_location_id || google_location_id.startsWith('pending'))) {
      return NextResponse.json(
        { error: 'This client has not connected their Google Business Profile yet. Setup is in progress.' },
        { status: 400 }
      );
    }

    // 3. Refresh OAuth Access Token
    console.log(`Refreshing access tokens for client ${clientId}...`);
    const accessToken = await refreshGoogleAccessToken(refresh_token || 'mock_refresh_token');

    // 4. Push optimizations to Google Business API
    console.log(`Pushing SEO categories and descriptions to location ${google_location_id}...`);
    const gbpData = Array.isArray(client.gbp_automations) ? client.gbp_automations[0] : client.gbp_automations;
    const websiteUri = gbpData?.website_url || client.onboarding_details?.website || 'https://www.example.com';
    const primaryPhone = client.contact_phone || undefined;

    await pushMetadataToGMB(
      google_location_id || 'mock_location_id',
      accessToken,
      primaryCategory,
      secondaryCategories,
      description,
      primaryPhone,
      websiteUri
    );

    // 5. Push services/specialties list to GMB
    const specialties = client.popular_specialties || [];
    if (specialties.length > 0) {
      console.log(`Pushing serviceList of ${specialties.length} services to GMB...`);
      await pushServiceListToGMB(
        google_location_id || 'mock_location_id',
        accessToken,
        specialties,
        primaryCategory
      );
    }

    // 4. Update optimization status checklist in the database
    const { error: updateErr } = await supabaseAdmin
      .from('gbp_accounts')
      .update({
        profile_optimized: true,
        last_synced_at: new Date().toISOString()
      })
      .eq('id', gbpAccount.id);

    if (updateErr) {
      console.error('Failed to update profile_optimized status in database:', updateErr.message);
      throw updateErr;
    }

    return NextResponse.json({
      success: true,
      google_location_id,
      pushed_metadata: {
        primaryCategory,
        secondaryCategories,
        description
      }
    });

  } catch (error: any) {
    console.error('Push metadata API failed:', error.message);
    return NextResponse.json(
      { error: 'Metadata push request failed', details: error.message },
      { status: 500 }
    );
  }
}
