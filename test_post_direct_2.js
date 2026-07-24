const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data: gbpAccount } = await supabase
      .from('gbp_accounts')
      .select('*')
      .eq('client_id', '01ed6ff0-7700-4cf4-8954-a9b9c48b7a12')
      .single();

    if (!gbpAccount) {
      console.error('No account found in DB');
      return;
    }

    const { google_location_id, refresh_token } = gbpAccount;
    console.log('Location ID:', google_location_id);

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refresh_token,
      grant_type: 'refresh_token',
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('Access Token acquired');

    const url = `https://mybusiness.googleapis.com/v4/accounts/~/locations/${google_location_id}/localPosts`;
    const postPayload = {
      summary: "Explore top-tier AI training programs at Ottobon Academy.",
      topicType: "STANDARD",
      callToAction: {
        actionType: "LEARN_MORE",
        url: `https://maps.google.com/?cid=${google_location_id}`
      }
    };

    console.log('Posting to GMB URL:', url);
    const response = await axios.post(url, postPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('SUCCESS:', response.data);
  } catch (err) {
    console.error('ERROR RESPONSE STATUS:', err.response?.status);
    console.error('ERROR RESPONSE DATA:', JSON.stringify(err.response?.data, null, 2));
    console.error('ERROR MESSAGE:', err.message);
  }
}

run();
