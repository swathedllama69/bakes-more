import { createBrowserClient } from '@supabase/ssr';

// These pull from the .env.local file you just created
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This is the 'bridge' instance using SSR-compatible client
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);