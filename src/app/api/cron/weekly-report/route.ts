import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRankViaSerpApi, getRankViaPuppeteer } from '@/lib/rankService';
import { sendEmail } from '@/lib/emailService';

export async function GET(req: NextRequest) {
  // Validate basic auth/cron secret to prevent abuse
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Note: Commented out for local testing. In production, uncomment the above.
  }

  try {
    console.log('Starting Weekly SEO Report Generation...');

    // 1. Fetch all approved GBP clients
    const { data: accounts, error: accErr } = await supabaseAdmin
      .from('gbp_accounts')
      .select('client_id, seo_plan_status');

    if (accErr) throw accErr;

    const approvedClientIds = accounts
      .filter((a: any) => a.seo_plan_status === 'approved')
      .map((a: any) => a.client_id);

    if (approvedClientIds.length === 0) {
      return NextResponse.json({ success: true, message: 'No approved clients to report on.' });
    }

    const { data: clients, error: clientsErr } = await supabaseAdmin
      .from('gbp_clients')
      .select('*')
      .in('id', approvedClientIds);

    if (clientsErr) throw clientsErr;

    const todayStr = new Date().toISOString().split('T')[0];

    for (const client of clients) {
      console.log(`Processing weekly report for ${client.company_name}...`);

      const keywords = client.target_keywords || [];
      if (keywords.length === 0) continue;

      const currentRankings: Record<string, number | string> = {};

      // 2. Perform rank checks for each keyword
      for (const keyword of keywords) {
        const localQuery = `${keyword} in ${client.service_area}`;
        let localRank: number | null = null;
        try {
          localRank = await getRankViaSerpApi(client.company_name, localQuery);
        } catch (serpErr: any) {
          console.warn(`Rank Check: SerpApi failed for local "${localQuery}". Trying Puppeteer fallback...`);
          try {
            localRank = await getRankViaPuppeteer(client.company_name, localQuery);
          } catch (pupErr: any) {}
        }
        currentRankings[localQuery] = localRank !== null ? localRank : '20+';
      }

      // 3. Compare with previous rankings
      const history = client.onboarding_details?.rank_history || [];
      let previousRankings: Record<string, number | string> = {};
      if (history.length > 0) {
        // Get the most recent rank check that isn't today
        const pastEntries = history.filter((h: any) => h.date !== todayStr);
        if (pastEntries.length > 0) {
          previousRankings = pastEntries[pastEntries.length - 1].rankings || {};
        }
      }

      // 4. Update the rank history in DB
      const updatedDetails = {
        ...client.onboarding_details,
        rank_history: [
          ...history.filter((h: any) => h.date !== todayStr),
          { date: todayStr, rankings: currentRankings }
        ]
      };

      await supabaseAdmin
        .from('gbp_clients')
        .update({ onboarding_details: updatedDetails })
        .eq('id', client.id);

      // 5. Build and send the email
      let rankChangesHtml = '';
      for (const [kw, current] of Object.entries(currentRankings)) {
        const previous = previousRankings[kw] || 'N/A';
        
        let trend = '➡️';
        let color = '#333';
        if (typeof current === 'number' && typeof previous === 'number') {
          if (current < previous) { trend = '📈 (Up)'; color = '#059669'; }
          else if (current > previous) { trend = '📉 (Down)'; color = '#dc2626'; }
        } else if (typeof current === 'number' && previous === '20+') {
          trend = '⭐ (New Entry!)'; color = '#059669';
        }

        rankChangesHtml += `
          <li style="margin-bottom: 8px;">
            <strong>${kw}</strong>: 
            <span style="color: #666;">Previous: ${previous}</span> → 
            <strong style="color: ${color};">Current: ${current}</strong> ${trend}
          </li>
        `;
      }

      const adminEmail = 'intern@medcytech.com';
      const clientEmail = client.contact_email;
      const recipients = clientEmail ? [adminEmail, clientEmail] : [adminEmail];

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #059669;">GBP Weekly Performance Report</h2>
          <p>Hello <strong>${client.company_name}</strong> team,</p>
          <p>Here is your weekly automated SEO and Google Business Profile ranking update.</p>
          
          <h3>📊 Keyword Ranking Movements</h3>
          <ul style="background: #f8fafc; padding: 20px; border-radius: 8px; list-style-type: none;">
            ${rankChangesHtml}
          </ul>

          <h3>🚀 Optimizations Active</h3>
          <p>Our automation engine is actively maintaining your profile, ensuring your business information stays consistent and responding to any new reviews or Q&A.</p>
          
          <p>Best Regards,<br/>Medcy Health Tech SEO Engine</p>
        </div>
      `;

      try {
        await sendEmail({
          to: recipients,
          subject: `Weekly GBP Report - ${client.company_name}`,
          html: emailHtml
        });
      } catch (err: any) {
        console.error(`Failed to send weekly report for ${client.id}:`, err.message);
      }
    }

    return NextResponse.json({ success: true, processed_clients: clients.length });

  } catch (error: any) {
    console.error('Weekly Report API failed:', error.message);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
