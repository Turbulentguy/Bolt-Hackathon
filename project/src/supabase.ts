// src/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fkyjupbrrbdjjlulhejn.supabase.co'   // Replace with your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZreWp1cGJycmJkampsdWxoZWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NjU3OTIsImV4cCI6MjA2NjI0MTc5Mn0.mZ9WTd36bzk9XXAleEBRI9MwFqXqKjlAWdqMz3bSM9Y'                  // Replace with your Supabase anon/public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)