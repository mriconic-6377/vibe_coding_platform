import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jteoesouwiuqlnmelkpm.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZW9lc291d2l1cWxubWVsa3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMzMxNDksImV4cCI6MjEwODYwOTE0OX0.ybrC1xdZDG6Z_N2O7urd7VUQQPxKkwe8kAjcsHKl5mM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
