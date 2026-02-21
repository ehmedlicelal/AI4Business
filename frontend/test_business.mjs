import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBusinessCreation() {
    const email = 'ehmedlicelal2@gmail.com';
    const password = 'Jalal123';

    console.log('Logging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) {
        console.error('Login Failed', authError);
        return;
    }

    const user = authData.user;
    const businessName = 'Test Node Business';
    console.log('Logged in as', user.id);

    try {
        console.log('Inserting into businesses table...');
        const { data: bData, error: bError } = await supabase
            .from('businesses')
            .insert([{ name: businessName, created_by: user.id, status: 'Pending' }])
            .select()
            .single();

        if (bError) {
            console.error('Business Insert Failed:', bError);
            throw bError;
        }
        console.log('Business Created:', bData);

        console.log('Inserting into admin_notifications...');
        const { error: notifyError } = await supabase
            .from('admin_notifications')
            .insert([{
                user_id: user.id,
                type: 'Business Creation',
                message: `User ${user.email} requested to create a business: ${businessName}`,
                status: 'Unread'
            }]);

        if (notifyError) {
            console.error('Notification Insert Failed:', notifyError);
            throw notifyError;
        }
        console.log('Notification Created');

        console.log('Success!');
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

testBusinessCreation();
