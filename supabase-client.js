const SUPABASE_URL = 'https://eooctktflejrvtfywrnz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rwgceAGcjAnhmuGL7ZDijg_YOus4Jgg';

// Initialize the Supabase client and export it as `db` globally
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
