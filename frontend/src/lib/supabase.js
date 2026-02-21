import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Prevent multiple GoTrue Auth instances during Vite HMR to fix LockManager timeouts
const client = globalThis.__supabaseClient ?? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        lock: (name, acquireTimeout, fn) => fn(), // FORCE DISABLE NAVIGATOR LOCKS
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

if (import.meta.env.DEV) {
    globalThis.__supabaseClient = client;
}

export const supabase = client;
