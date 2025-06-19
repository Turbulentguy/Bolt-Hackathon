// src/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dcthpxrgatpyqkzpzavk.supabase.co'   // Replace with your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdGhweHJnYXRweXFrenB6YXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMzcyNDQsImV4cCI6MjA2NTgxMzI0NH0.EcYrMfpKYN8CrjlU1c5O0fp2qDEWSrfY6FQZANSZK50'                  // Replace with your Supabase anon/public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)