import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gjyrdnhdtoczvmpjshpf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeXJkbmhkdG9jenZtcGpzaHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNDE0MjksImV4cCI6MjA5OTgxNzQyOX0.itOUrZYVEUOuYjo3LK1JQ9Waqv3N33yCe3_5zg_FFW8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
