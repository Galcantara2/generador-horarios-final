import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://depfyjlqdgadoxbtfqzi.supabase.co"; 
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcGZ5amxxZGdhZG94YnRmcXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzU2MjEsImV4cCI6MjA2MTAxMTYyMX0.AJM5HX7yNMjvHbLHWCj4IhfVwX-zQLRtn32EcVCPsxU"; // 🔁 cámbiala por tu anon key

export const supabase = createClient(supabaseUrl, supabaseKey);
