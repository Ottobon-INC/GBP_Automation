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

    const { google_location_id, refresh_token } = gbpAccount;

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refresh_token,
      grant_type: 'refresh_token',
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('Access Token acquired.');

    const postPayload = {
      summary: "Explore top-tier AI training programs at Ottobon Academy. Learn more about our classes.",
      topicType: "STANDARD",
      callToAction: {
        actionType: "LEARN_MORE",
        url: "https://maps.google.com/?cid=6766178791492736002"
      }
    };

    // Test URL 1: Modern Local Post API (no account ID in path)
    const url1 = `https://mybusinesslocalpost.googleapis.com/v1/locations/${google_location_id}/localPosts`;
    console.log('\n--- TESTING URL 1: ', url1);
    try {
      const response1 = await axios.post(url1, postPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('URL 1 SUCCESS:', response1.data);
    } catch (err) {
      console.error('URL 1 FAILED. Status:', err.response?.status, 'Data:', err.response?.data);
    }

    // Test URL 2: Classic v4 with explicit Location Group ID
    const url2 = `https://mybusiness.googleapis.com/v4/accounts/106801970455480716360/locations/${google_location_id}/localPosts`;
    console.log('\n--- TESTING URL 2: ', url2);
    try {
      const response2 = await axios.post(url2, postPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('URL 2 SUCCESS:', response2.data);
    } catch (err) {
      console.error('URL 2 FAILED. Status:', err.response?.status, 'Data:', err.response?.data);
    }
  } catch (err) {
    console.error('OUTER ERROR:', err.message);
  }
}

run();
