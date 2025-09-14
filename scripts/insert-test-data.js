const { createClient } = require('@supabase/supabase-js');

// Use configuration directly (please replace with your actual values)
const SUPABASE_URL = 'https://nkpgzczvxuhbqrifjuer.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcGd6Y3p2eHVoYnFyaWZqdWVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA2ODc2MiwiZXhwIjoyMDcyNjQ0NzYyfQ.4EEs2YbHZEzkkSt3qOSQ9NiqPgwJE-COmPX_wu8ZI9Y';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function insertTestData() {
  console.log('Inserting test data...');
  
  try {
    // Insert test articles
    const testData = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000000', // User ID in UUID format
        title: 'My first blog post',
        content: JSON.stringify([
          {
            type: "paragraph",
            content: "Welcome to your new blog post!",
          },
        ]),
        published: false,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        user_id: '00000000-0000-0000-0000-000000000000', // User ID in UUID format
        title: 'Introduction',
        content: JSON.stringify([]),
        published: false,
        parent_id: '11111111-1111-1111-1111-111111111111',
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        user_id: '00000000-0000-0000-0000-000000000000', // User ID in UUID format
        title: 'Conclusion',
        content: JSON.stringify([]),
        published: false,
        parent_id: '11111111-1111-1111-1111-111111111111',
      }
    ];

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(testData);

    if (error) {
      console.error('Error inserting test data:', error.message);
      return;
    }
    
    console.log('Test data inserted successfully!');
  } catch (error) {
    console.error('Error inserting test data:', error.message);
  }
}

insertTestData();