import { createClient } from '@supabase/supabase-js';

// This client uses the service_role key — for server-side use ONLY.
// It bypasses Row Level Security and can write to any table.
// NEVER import this file in any client component or page.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('⚠️ Missing Supabase admin environment variables. Check SUPABASE_SERVICE_ROLE_KEY in Vercel/local env.');
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceRoleKey || 'placeholder', 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
