import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { client_id, approved_keywords } = await req.json();

    if (!client_id) {
      return NextResponse.json({ error: 'Missing client_id' }, { status: 400 });
    }

    console.log(`Approving SEO plan for client: ${client_id}`);

    // 1. Mark the plan as approved
    const { error: updateErr } = await supabaseAdmin
      .from('gbp_accounts')
      .update({ seo_plan_status: 'approved' })
      .eq('client_id', client_id);

    if (updateErr) throw updateErr;

    // 2. If the admin modified the keywords before approving, save them
    if (approved_keywords && Array.isArray(approved_keywords)) {
      // Update the GBP automations table so it knows the new target keywords
      await supabaseAdmin
        .from('gbp_automations')
        .update({ target_keywords: approved_keywords })
        .eq('client_id', client_id);
    }

    // 3. Automatically trigger the push to Google!
    // Since we are Server-Side, we can just call our own API route internally.
    const baseUrl = new URL(req.url).origin;
    console.log(`Auto-triggering push-metadata for ${client_id}...`);
    
    // We don't await this so it happens asynchronously and the dashboard feels snappy
    fetch(`${baseUrl}/api/automation/push-metadata?client_id=${client_id}`, { method: 'GET' })
      .then(res => res.json())
      .then(data => console.log('Auto-push result:', data))
      .catch(err => console.error('Auto-push failed:', err));

    return NextResponse.json({
      success: true,
      message: 'SEO Plan approved and auto-execution has begun.'
    });

  } catch (error: any) {
    console.error('Approve Plan API failed:', error.message);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
