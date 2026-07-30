import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generatePostCopy } from '@/lib/gemini';

// GET endpoint to return data for all clients to feed the Tampermonkey Userscript
export async function GET(request: NextRequest) {
  // Add CORS headers to allow local Tampermonkey requests from https://business.google.com
  const headers = new Headers({
    'Access-Control-Allow-Origin': 'https://business.google.com',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true'
  });

  try {
    // 1. Fetch all clients
    const { data: clients, error: clientsErr } = await supabaseAdmin
      .from('clients')
      .select('*, gbp_automations(*)')
      .order('created_at', { ascending: false });

    if (clientsErr || !clients) {
      throw new Error(`Failed to fetch clients: ${clientsErr?.message}`);
    }

    const payloadList = [];

    for (const client of clients) {
      // 2. Fetch connection payload
      const { data: gbpAccount } = await supabaseAdmin
        .from('gbp_accounts')
        .select('*')
        .eq('client_id', client.id)
        .maybeSingle();

      const { data: reviews } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('client_id', client.id);

      const businessType = client.onboarding_details?.business_type || 'healthcare';
      let nextPostCopy = 'No topic blueprint found. Recalculate optimization first.';

      if (gbpAccount?.ai_optimized_payload) {
        const payload = gbpAccount.ai_optimized_payload;
        
        // Count already published posts
        const { count } = await supabaseAdmin
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('status', 'published');

        const nextWeekIndex = (count || 0) + 1;
        const weeklyPlan = payload.weekly_posting_plan || [];
        const blueprint = weeklyPlan.find((p: any) => p.week === nextWeekIndex) || weeklyPlan[0];

        const gbpData = Array.isArray(client.gbp_automations) ? client.gbp_automations[0] : client.gbp_automations;
        const primaryCategory = gbpData?.primary_category || client.primary_category || 'Business';
        const targetKeywords = gbpData?.target_keywords || client.target_keywords || [];

        if (blueprint) {
          nextPostCopy = await generatePostCopy(
            client.company_name,
            primaryCategory,
            client.service_area,
            targetKeywords,
            blueprint.topic,
            businessType
          );
        }
      }

      payloadList.push({
        id: client.id,
        companyName: client.company_name,
        businessType,
        logoUrl: client.logo_url,
        buildingImageUrl: client.building_image_url,
        optimizedPayload: gbpAccount?.ai_optimized_payload || null,
        nextPostCopy,
        reviews: reviews || []
      });
    }

    return NextResponse.json({ clients: payloadList }, { headers });
  } catch (error: any) {
    console.error('Pending actions API error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}

// Handle OPTIONS preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://business.google.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}
