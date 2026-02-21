const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    console.log('Fetching applications...');
    const { data, error } = await supabaseAdmin
        .from('tech_park_applications')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('SUPABASE ERROR:', error);
    } else {
        console.log('SUCCESS. Found applications:', data ? data.length : 0);
    }
}
test();
