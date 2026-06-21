import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uqmeylexihswuopedlgd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxbWV5bGV4aWhzd3VvcGVkbGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5OTI4NzYsImV4cCI6MjA5NzU2ODg3Nn0.DK0srD4IG-iJ1gdW-wBLOkiAsGwfCiRETL68wpkc5oM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
