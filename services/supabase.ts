import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zobqlbgbwrtstfxennmk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYnFsYmdid3J0c3RmeGVubm1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4OTU0MywiZXhwIjoyMDgzNDY1NTQzfQ.ir3dzwblX7YlrBGSYAbLJaEyuYGbq6GfYeyBD8CDDRM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);