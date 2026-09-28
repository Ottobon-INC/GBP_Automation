import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { client_id, location_id } = await request.json();

    if (!client_id) {
      return NextResponse.json({ error: 'Missing client_id' }, { status: 400 });
    }

    if (!location_id) {
      return NextResponse.json({ error: 'Missing location_id' }, { status: 400 });
    }

    const activeLocationId = location_id;

    // Check if gbp_accounts record exists
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('gbp_accounts')
      .select('id')
      .eq('client_id', client_id)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error checking gbp_accounts:', fetchErr.message);
    }

    if (existing) {
      const { error: updateErr } = await supabaseAdmin
        .from('gbp_accounts')
        .update({
          google_location_id: activeLocationId,
          profile_optimized: true
        })
        .eq('id', existing.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else {
      const { error: insertErr } = await supabaseAdmin
        .from('gbp_accounts')
        .insert([
          {
            client_id,
            google_location_id: activeLocationId,
            profile_optimized: true
          }
        ]);

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    // Update client onboarding details status if present
    const { data: client } = await supabaseAdmin
      .from('gbp_clients')
      .select('onboarding_details')
      .eq('id', client_id)
      .single();

    if (client && client.onboarding_details) {
      const updatedDetails = {
        ...client.onboarding_details,
        has_gbp: true,
        completed_step: 'gbp_linked'
      };
      await supabaseAdmin
        .from('gbp_clients')
        .update({ onboarding_details: updatedDetails })
        .eq('id', client_id);

      // --- NEW: Update gbp_automations status ---
      await supabaseAdmin
        .from('gbp_automations')
        .update({ status: 'active' })
        .eq('client_id', client_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Google Business Profile connected and activated successfully!',
      location_id: activeLocationId
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
