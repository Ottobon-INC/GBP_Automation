import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { supabaseAdmin } from '@/lib/supabase-admin';

// This route handles the callback after the client approves Google OAuth.
// Google redirects here with a short-lived `code` that we exchange for tokens.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const googleError = searchParams.get('error');

  // Handle user denying permission on Google's consent screen
  if (googleError) {
    return NextResponse.redirect(new URL(`/?error=google_denied&reason=${googleError}`, request.url));
  }

  if (!code || !stateRaw) {
    return NextResponse.json({ error: 'Missing code or state from Google OAuth callback' }, { status: 400 });
  }

  // Decode the state parameter to retrieve our client_id and action
  let clientId: string;
  let action: string;

  try {
    const parsed = JSON.parse(Buffer.from(stateRaw, 'base64').toString());
    clientId = parsed.clientId;
    action = parsed.action ?? 'link';
  } catch {
    return NextResponse.json({ error: 'Invalid state parameter. Possible CSRF attack.' }, { status: 400 });
  }

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId in OAuth state' }, { status: 400 });
  }

  try {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

    // Exchange the authorization code for access and refresh tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      // This can happen if the user has already authorized before and consent was not re-prompted
      return NextResponse.redirect(
        new URL(`/?error=no_refresh_token&hint=revoke_and_try_again`, request.url)
      );
    }

    // Get their Google account email to store as google_account_id
    oauth2Client.setCredentials(tokens);
    const userInfoRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const userInfo = await userInfoRes.json();

    // Check if a GBP account connection record already exists for this client
    const { data: existingGbp, error: fetchGbpErr } = await supabaseAdmin
      .from('gbp_accounts')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle();

    if (fetchGbpErr) {
      console.error('Failed to query existing GBP account:', fetchGbpErr.message);
    }

    let dbError;
    if (existingGbp) {
      // Update existing record with the new Google OAuth tokens (preserving location ID and AI payload)
      const { error } = await supabaseAdmin
        .from('gbp_accounts')
        .update({
          google_account_id: userInfo.email ?? null,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
        })
        .eq('id', existingGbp.id);
      dbError = error;
    } else {
      // Insert new record if this is the first connection
      const { error } = await supabaseAdmin
        .from('gbp_accounts')
        .insert([
          {
            client_id: clientId,
            google_account_id: userInfo.email ?? null,
            google_location_id: `pending_${clientId}`, // Will be updated once GBP listing is fetched/created
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: tokens.expiry_date
              ? new Date(tokens.expiry_date).toISOString()
              : null,
            profile_optimized: false,
          }
        ]);
      dbError = error;
    }

    if (dbError) {
      console.error('Failed to save GBP account tokens:', dbError.message);
      return NextResponse.redirect(
        new URL(`/?error=db_save_failed&message=${encodeURIComponent(dbError.message)}`, request.url)
      );
    }

    // Route based on action:
    // 'link' = client already has GBP → go to dashboard
    // 'create' = our team creates GBP for them → go to success tracker
    // In both cases, onboarding is now complete! Redirect client to the success page
    return NextResponse.redirect(
      new URL(`/onboarding/success?client_id=${clientId}`, request.url)
    );

  } catch (error: any) {
    console.error('OAuth callback error:', error.message);
    return NextResponse.redirect(
      new URL(`/?error=oauth_failed&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
