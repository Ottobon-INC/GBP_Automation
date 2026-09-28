import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generatePostCopy } from '@/lib/gemini';

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 1. Fetch all clients with approved GBP accounts
    const { data: approvedAccounts, error: accErr } = await supabaseAdmin
      .from('gbp_accounts')
      .select('client_id')
      .eq('seo_plan_status', 'approved');

    if (accErr || !approvedAccounts || approvedAccounts.length === 0) {
      return NextResponse.json({ message: 'No approved clients found.' });
    }

    const clientIds = approvedAccounts.map(a => a.client_id);
    const { data: clients, error: clientErr } = await supabaseAdmin
      .from('gbp_clients')
      .select('*')
      .in('id', clientIds);

    if (clientErr || !clients) {
      return NextResponse.json({ error: 'Failed to fetch clients.' }, { status: 500 });
    }

    const logs = [];

    for (const client of clients) {
      try {
        console.log(`[Daily Engagement] Processing client: ${client.company_name} (${client.id})`);
        
        // A. Trigger Review Auto-Responder
        try {
          const reviewRes = await fetch(`${baseUrl}/api/automation/reply-reviews?client_id=${client.id}`);
          const reviewData = await reviewRes.json();
          logs.push(`Reviews: ${reviewData.auto_replies_sent || 0} replied.`);
        } catch (err: any) {
          console.error(`Failed to trigger review responder for ${client.company_name}:`, err.message);
        }

        // B. Daily Posting (Alternating Text & Photo)
        const { data: lastPost } = await supabaseAdmin
          .from('gbp_posts')
          .select('call_to_action_type')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const wasLastPostPhoto = lastPost?.call_to_action_type?.startsWith('MEDIA_');
        
        // Alternate Logic: if last was photo (or no posts), do text. Else do photo.
        // Wait, if no posts, text is good. So:
        const postType = wasLastPostPhoto ? 'TEXT' : 'PHOTO';
        
        let newPostId = null;

        if (postType === 'TEXT') {
          // Generate Text Post
          const keywords = client.target_keywords || [];
          const keyword = keywords.length > 0 ? keywords[Math.floor(Math.random() * keywords.length)] : (client.primary_category || 'Our Services');
          const website = client.onboarding_details?.website || baseUrl;
          const businessType = client.onboarding_details?.business_type || 'healthcare';
          
          console.log(`[Daily Engagement] Generating Text Post targeting: ${keyword}`);
          
          const postCopy = await generatePostCopy(
            client.company_name,
            client.primary_category || 'Our Services',
            client.service_area || 'Local Area',
            keywords,
            `Daily Update: ${keyword}`,
            businessType
          );
          
          const { data: insertedPost } = await supabaseAdmin
            .from('gbp_posts')
            .insert({
              client_id: client.id,
              topic: `Daily Update: ${keyword}`,
              post_text: postCopy,
              call_to_action_type: 'LEARN_MORE',
              call_to_action_url: website,
              status: 'scheduled',
              scheduled_at: new Date().toISOString()
            })
            .select('id')
            .single();
            
          newPostId = insertedPost?.id;
        } else {
          // Generate Photo Post
          console.log(`[Daily Engagement] Selecting Photo for Post`);
          const availableImages = [];
          if (client.building_image_url) availableImages.push(client.building_image_url);
          if (client.logo_url) availableImages.push(client.logo_url);
          if (client.additional_images?.interior_url) availableImages.push(client.additional_images.interior_url);
          if (client.additional_images?.staff_url) availableImages.push(client.additional_images.staff_url);
          
          if (availableImages.length > 0) {
            // Cycle through based on day of year to ensure rotation, or just random
            const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
            const mediaType = randomImage === client.logo_url ? 'MEDIA_PROFILE' : 'MEDIA_AT_WORK';
            
            const { data: insertedPost } = await supabaseAdmin
              .from('gbp_posts')
              .insert({
                client_id: client.id,
                topic: `Daily Photo Showcase`,
                post_text: '',
                image_url: randomImage,
                call_to_action_type: mediaType,
                status: 'scheduled',
                scheduled_at: new Date().toISOString()
              })
              .select('id')
              .single();
              
            newPostId = insertedPost?.id;
          } else {
            console.log(`[Daily Engagement] No images found for ${client.company_name}, skipping photo post.`);
            logs.push(`Post skipped (No images)`);
          }
        }

        // C. Trigger Publisher if we created a post
        if (newPostId) {
          try {
            console.log(`[Daily Engagement] Triggering publish-post for ${newPostId}`);
            const publishRes = await fetch(`${baseUrl}/api/automation/publish-post?client_id=${client.id}&post_id=${newPostId}`);
            const publishData = await publishRes.json();
            if (publishData.success) {
              logs.push(`Published ${postType} Post successfully.`);
            } else {
              logs.push(`Publish ${postType} failed: ${publishData.error}`);
            }
          } catch (err: any) {
            console.error(`Failed to trigger publisher for ${client.company_name}:`, err.message);
          }
        }

      } catch (err: any) {
        console.error(`Error processing client ${client.id}:`, err.message);
        logs.push(`Error: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: clients.length,
      logs
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Daily engagement failed', details: err.message }, { status: 500 });
  }
}
