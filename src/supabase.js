import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjscaylpmrmwjojhswhb.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqc2NheWxwbXJtd2pvamhzd2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDQzMDksImV4cCI6MjA5Mjg4MDMwOX0.gj_DzCq5HVq0kvwA3SjUMxdNQtU_O01zVj76n_qxDlI';

export const supabase = createClient(supabaseUrl, supabaseKey);
