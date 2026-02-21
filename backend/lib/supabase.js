const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('FATAL: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY must be set.');
    process.exit(1);
}

// Admin client — bypasses RLS, used only for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Creates a Supabase client scoped to the authenticated user's JWT.
 * This client respects RLS policies.
 */
function createUserClient(accessToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
}

module.exports = { supabaseAdmin, createUserClient };
