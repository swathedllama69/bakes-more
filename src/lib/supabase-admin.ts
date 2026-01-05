import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for admin operations (like fetching settings securely if needed)
// But for now, we can use the public client if RLS allows reading settings
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
