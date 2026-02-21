const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    console.log('--- Checking Startups ---');
    const { data: startups, error: sError } = await supabase
        .from('startups')
        .select('id, name, created_by, industry');

    if (sError) console.error('Startup Error:', sError);
    else {
        console.log('--- Startups List ---');
        startups.forEach(s => {
            console.log(`- ${s.name} (Creator: ${s.created_by}, Industry: ${JSON.stringify(s.industry)})`);
        });
    }

    const creatorCounts = {};
    if (startups) {
        startups.forEach(s => {
            creatorCounts[s.created_by] = (creatorCounts[s.created_by] || 0) + 1;
        });
    }
    console.log('Startups per creator:', creatorCounts);

    console.log('\n--- Checking Swipes ---');
    const { data: swipes, error: swError } = await supabase
        .from('startup_swipes')
        .select('*');

    if (swError) console.error('Swipe Error:', swError);
    else console.log(`Total Swipes: ${swipes.length}`);

    const userSwipeCounts = {};
    swipes.forEach(s => {
        userSwipeCounts[s.investor_id] = (userSwipeCounts[s.investor_id] || 0) + 1;
    });
    console.log('Swipes per user:', userSwipeCounts);
}

checkData();
