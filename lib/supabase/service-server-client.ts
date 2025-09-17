import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseService = createClient(url, serviceKey);
