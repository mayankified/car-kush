import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kzslzodwjmkviggjkcjj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6c2x6b2R3am1rdmlnZ2prY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODcyOTIsImV4cCI6MjA4MjI2MzI5Mn0.zQCL5MrvGzwycYq78Kk9Jt2s3DiNVfy0-_bdZeEY1VY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);