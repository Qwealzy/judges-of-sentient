import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


type SupabaseClientSingleton = ReturnType<typeof createClient> | null;

let client: SupabaseClientSingleton = null;

export function getSupabaseClient() {
  if (client) {
    return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  client = createClient(url, key, {
    auth: {
      persistSession: false
    }
  });

  return client;
}
