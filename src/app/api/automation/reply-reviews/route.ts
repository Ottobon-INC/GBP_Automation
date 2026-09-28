import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { refreshGoogleAccessToken, fetchGMBReviews, pushGMBReviewReply } from '@/lib/gmbService';
import { generateReviewReply } from '@/lib/gemini';

// Trigger endpoint to fetch reviews, draft AI replies, and publish them to Google
// Query param: client_id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');

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

    const { google_location_id, refresh_token } = gbpAccount;

    // 2. Fetch Client Info
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('gbp_clients')
      .select('company_name, onboarding_details')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ error: 'Client profile not found in database.' }, { status: 404 });
    }

    const isMock = process.env.MOCK_GMB_API === 'true';
    if (!isMock && (!refresh_token || refresh_token === 'pending' || !google_location_id || google_location_id.startsWith('pending'))) {
      return NextResponse.json(
        { error: 'This client has not connected their Google Business Profile yet. Setup is in progress.' },
        { status: 400 }
      );
    }

    // 3. Refresh Access Token
    console.log(`Refreshing access tokens for client ${clientId}...`);
    const accessToken = await refreshGoogleAccessToken(refresh_token || 'mock_refresh_token');

    // 4. Fetch latest Google Reviews
    console.log(`Fetching latest reviews from Google for location ${google_location_id}...`);
    const googleReviews = await fetchGMBReviews(google_location_id || 'mock_location_id', accessToken);

    const processedReviews = [];

    for (const r of googleReviews) {
      // 5. Sync review to public.reviews database (check if already exists)
      const { data: existingReview } = await supabaseAdmin
        .from('gbp_reviews')
        .select('*')
        .eq('client_id', clientId)
        .eq('google_review_id', r.reviewId)
        .maybeSingle();

      let dbReview = existingReview;

      if (!existingReview) {
        // Insert new review row
        const { data: insertedReview, error: insertErr } = await supabaseAdmin
          .from('gbp_reviews')
          .insert([
            {
              client_id: clientId,
              reviewer_name: r.reviewerName,
              star_rating: r.starRating,
              comment: r.comment,
              google_review_id: r.reviewId,
              review_created_at: r.createTime || new Date().toISOString(),
              ai_draft_reply: null,
              posted_reply: null,
              status: 'pending_approval'
            }
          ])
          .select()
          .single();

        if (insertErr) {
          console.error(`Failed to insert review ${r.reviewId}:`, insertErr.message);
        } else {
          dbReview = insertedReview;
        }
      }

      // 6. Draft and push reply if not already replied
      if (dbReview && !dbReview.posted_reply) {
        console.log(`Review Auto-Responder: Drafting AI reply for review from "${r.reviewerName}" (${r.starRating} Stars)...`);
        
        const businessType = client.onboarding_details?.business_type || 'healthcare';

        // Generate review reply copy
        const aiReply = await generateReviewReply(
          client.company_name,
          r.reviewerName,
          r.comment,
          r.starRating,
          businessType
        );

        // Push reply to GMB API helper
        await pushGMBReviewReply(
          google_location_id || 'mock_location_id',
          r.reviewId,
          accessToken,
          aiReply
        );

        // Update reply fields in Supabase
        const { error: updateErr } = await supabaseAdmin
          .from('gbp_reviews')
          .update({
            ai_draft_reply: aiReply,
            posted_reply: aiReply,
            status: 'replied',
            replied_at: new Date().toISOString()
          })
          .eq('id', dbReview.id);

        if (updateErr) {
          console.error(`Failed to update reply status in reviews table for ${dbReview.id}:`, updateErr.message);
        }

        processedReviews.push({
          review_id: r.reviewId,
          reviewer: r.reviewerName,
          comment: r.comment,
          ai_reply: aiReply
        });
      }
    }

    return NextResponse.json({
      success: true,
      reviews_fetched: googleReviews.length,
      auto_replies_sent: processedReviews.length,
      replies: processedReviews
    });

  } catch (error: any) {
    console.error('Review Auto-Responder API failed:', error.message);
    return NextResponse.json(
      { error: 'Failed to process Google reviews and draft replies', details: error.message },
      { status: 500 }
    );
  }
}
