import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://fkodqpbzyqvczwzkadfy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrb2RxcGJ6eXF2Y3p3emthZGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzgzNTQsImV4cCI6MjA4NjkxNDM1NH0.NtDr9Bpl7MVP5X0M6Lr8WqNvSPrwo8l75HMKl0v3SQE');

async function testAuthFetch() {
    console.log('Logging in to get a real token...');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'admin@gmail.com',
        password: 'password123'
    });

    if (authErr) {
        console.error('Login Failed:', authErr.message);
        return;
    }

    const token = authData.session.access_token;
    console.log('Login success. Fetching tech park applications...');

    try {
        const response = await fetch('http://localhost:5000/api/tech-park/all', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const text = await response.text();
        console.log('Status:', response.status);
        if (response.status !== 200) {
            console.log('Response Error:', text);
        } else {
            const json = JSON.parse(text);
            console.log(`Success! Found ${json.data ? json.data.length : 0} applications.`);
        }
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}
testAuthFetch();
