import { createClient } from '@supabase/supabase-js';

// URL & Key Supabase Aa Baim
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://klzrpcjaahloeuupfctce.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsenJwY2phYWhsb2V1cGZjdGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzU3NjAsImV4cCI6MjA5MTk1MTc2MH0.AsAFimlu9uAgTI3sOe-EfgaxZWFhZPivLJls6Rg59f8';

if (typeof window !== 'undefined') {
  console.log('📡 [Supabase Client] Initializing with URL:', SUPABASE_URL);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
