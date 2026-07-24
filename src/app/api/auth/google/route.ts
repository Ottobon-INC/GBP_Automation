import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

// This route redirects the client to Google's OAuth consent screen.
// Query params:
//   client_id - the UUID of the client record in our Supabase database
//   action    - 'link' (client has existing GBP) or 'create' (new GBP needed)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const action = searchParams.get('action') ?? 'link';

  if (!clientId) {
    return NextResponse.json({ error: 'Missing client_id parameter' }, { status: 400 });
  }

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

  // Request the minimal scopes needed to manage a Google Business Profile
  const scopes = [
    'https://www.googleapis.com/auth/business.manage',  // Read/write GBP data
    'https://www.googleapis.com/auth/userinfo.email',   // Get their Google email
  ];

  // Encode client_id and action in the state parameter so we can retrieve them in the callback
  const state = Buffer.from(JSON.stringify({ clientId, action })).toString('base64');

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',   // Request a refresh token for long-lived access
    prompt: 'consent',        // Force consent screen so we always get refresh_token
    scope: scopes,
    state,
  });

  return NextResponse.redirect(authUrl);
}
