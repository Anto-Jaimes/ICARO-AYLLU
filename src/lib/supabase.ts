import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://kykovntngvtvhabcpvih.supabase.co';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Y0o-4nefOyE_p5LiTwGDFQ_NsZo4jpH';

export const supabase: SupabaseClient = createClient(url, publishableKey);
