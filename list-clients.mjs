import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function list() {
  const { data: clients } = await supabase.from('clients').select('id, business_name');
  console.log('CLIENTS:', clients);
  const { data: gbp } = await supabase.from('gbp_accounts').select('id, client_id, google_location_id');
  console.log('GBP ACCOUNTS:', gbp);
}
list();
