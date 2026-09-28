import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: accounts } = await supabase.from('gbp_accounts').select('*');
  console.log('GBP Accounts in DB:', accounts.map(a => ({ email: a.google_account_id, client_id: a.client_id })));

  const account = accounts.find(a => a.google_account_id === 'intern@medcytech.com');
  if (!account) {
    console.log('Could not find intern@medcytech.com in DB.');
    return;
  }

  // Refresh Token
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const response = await axios.post(tokenUrl, {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: account.refresh_token,
    grant_type: 'refresh_token',
  });
  
  const accessToken = response.data.access_token;
  console.log('Got Access Token. Fetching accounts...');

  try {
    const tokenInfoUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`;
    const tokenInfoRes = await axios.get(tokenInfoUrl);
    console.log('Granted Scopes:', tokenInfoRes.data.scope);

    const accUrl = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
    const accRes = await axios.get(accUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    console.log('Accounts Response:', JSON.stringify(accRes.data, null, 2));

    const googleAccounts = accRes.data.accounts || [];
    for (const acc of googleAccounts) {
        console.log(`\nFetching locations for ${acc.name}...`);
        const locUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name,title,storeCode`;
        try {
            const locRes = await axios.get(locUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
            console.log(`Locations for ${acc.name}:`, JSON.stringify(locRes.data, null, 2));
        } catch (e) {
            console.log(`Error fetching locations for ${acc.name}:`, e.response?.data || e.message);
        }
    }
  } catch (e) {
    console.log('Error fetching accounts:', e.response?.data || e.message);
  }
}

run();
