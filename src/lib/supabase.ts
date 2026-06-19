import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukyybxwshluqcksqxdpj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreXlieHdzaGx1cWNrc3F4ZHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODUyMzIsImV4cCI6MjA5MjM2MTIzMn0.bWUK7VTiAU6FvAxRr30zvFd2791kn_JaoypTKlMw8iQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
