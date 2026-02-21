import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fkodqpbzyqvczwzkadfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrb2RxcGJ6eXF2Y3p3emthZGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzgzNTQsImV4cCI6MjA4NjkxNDM1NH0.NtDr9Bpl7MVP5X0M6Lr8WqNvSPrwo8l75HMKl0v3SQE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Logging in...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'ehmedlicelal2@gmail.com',
        password: 'Jalal123'
    });

    if (authError) {
        console.error("Auth Error:", authError);
        return;
    }

    console.log("User logged in:", authData.user.id);

    console.log("Fetching startups...");
    const { data: startups, error: fetchError } = await supabase.from('startups').select('*').eq('created_by', authData.user.id);
    if (fetchError) {
        console.error("Fetch Error:", fetchError);
        return;
    }
    console.log("Current startups:", startups);

    console.log("Creating new startup...");
    const { data: newStartup, error: createError } = await supabase.from('startups').insert({
        name: 'Node Test Startup',
        category: 'SaaS',
        created_by: authData.user.id
    }).select().single();

    if (createError) {
        console.error("Create Error:", createError);
        return;
    }

    console.log("Created Startup:", newStartup);

    console.log("Creating member...");
    const { error: memberError } = await supabase.from('startup_members').insert({
        startup_id: newStartup.id,
        user_id: authData.user.id,
        role: 'Owner'
    });

    if (memberError) {
        console.error("Member Create Error:", memberError);
    } else {
        console.log("Member created successfully.");
    }

    console.log("Fetching startups again...");
    const { data: startupsAfter, error: fetchErrorAfter } = await supabase.from('startups').select('*').eq('created_by', authData.user.id);
    console.log("Startups after:", startupsAfter);
}

run();
