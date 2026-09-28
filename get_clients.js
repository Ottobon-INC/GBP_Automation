const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabase
    .from('gbp_clients')
    .select('id, company_name, contact_phone, onboarding_details')
    .eq('id', '01ed6ff0-7700-4cf4-8954-a9b9c48b7a12')
    .single();
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Ottobon Data:', JSON.stringify(data, null, 2));
  }
}

run();
