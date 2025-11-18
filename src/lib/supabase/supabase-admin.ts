/**
 * Supabase Admin Client
 * Uses service_role key to bypass RLS
 * Only for server-side operations
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceKey) {
  console.warn('Missing TASKY_SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export default supabaseAdmin;
