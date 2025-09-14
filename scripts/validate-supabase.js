const { createClient } = require('@supabase/supabase-js');

// Replace with your actual values
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

async function validateSupabaseConnection() {
  console.log('Validating Supabase connection...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    
    // Try to execute a simple query
    const { data, error } = await supabase
      .from('blog_posts') // Replace with your actual table name
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Connection failed:', error.message);
      return false;
    }
    
    console.log('Connection successful!');
    console.log('Data retrieved:', data);
    return true;
  } catch (error) {
    console.error('Connection failed:', error.message);
    return false;
  }
}

validateSupabaseConnection();