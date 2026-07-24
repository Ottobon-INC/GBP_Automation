import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { refreshGoogleAccessToken, pushFAQToGMB } from '@/lib/gmbService';

// Trigger endpoint to push AI FAQs to GMB Questions & Answers
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
        { error: 'GMB connection profile not found. Scrape competitors first to generate FAQs.' },
        { status: 404 }
      );
    }

    const { google_location_id, refresh_token, ai_optimized_payload } = gbpAccount;

    if (!ai_optimized_payload) {
      return NextResponse.json(
        { error: 'No AI optimization recommendations found for this client. Please run competitor scraper first.' },
        { status: 400 }
      );
    }

    const faqs = ai_optimized_payload.faqs || [];

    if (faqs.length === 0) {
      return NextResponse.json(
        { error: 'No FAQs generated in the AI payload. Please recalculate optimizations first.' },
        { status: 400 }
      );
    }

    // Check if client has connected their GMB listing via OAuth
    const isMock = process.env.MOCK_GMB_API === 'true';
    if (!isMock && (!refresh_token || refresh_token === 'pending' || !google_location_id || google_location_id.startsWith('pending'))) {
      return NextResponse.json(
        { error: 'This client has not connected their Google Business Profile yet. Setup is in progress.' },
        { status: 400 }
      );
    }

    // 2. Refresh OAuth Access Token
    console.log(`Refreshing access tokens for client ${clientId}...`);
    const accessToken = await refreshGoogleAccessToken(refresh_token || 'mock_refresh_token');

    // 3. Push FAQs to GMB Q&A API
    console.log(`Pushing ${faqs.length} FAQs to Google Business Profile for location ${google_location_id}...`);
    for (const faq of faqs) {
      await pushFAQToGMB(
        google_location_id || 'mock_location_id',
        accessToken,
        faq.question,
        faq.answer
      );
    }

    // 4. Update the DB to record that FAQs were pushed
    const updatedPayload = {
      ...ai_optimized_payload,
      faqs_pushed: true
    };

    const { error: updateErr } = await supabaseAdmin
      .from('gbp_accounts')
      .update({
        ai_optimized_payload: updatedPayload,
        last_synced_at: new Date().toISOString()
      })
      .eq('id', gbpAccount.id);

    if (updateErr) {
      console.error('Failed to update faqs_pushed status in database:', updateErr.message);
      throw updateErr;
    }

    return NextResponse.json({
      success: true,
      google_location_id,
      pushed_faqs_count: faqs.length,
      faqs
    });

  } catch (error: any) {
    console.error('Push FAQs API failed:', error.message);
    return NextResponse.json(
      { error: 'FAQs push request failed', details: error.message },
      { status: 500 }
    );
  }
}
