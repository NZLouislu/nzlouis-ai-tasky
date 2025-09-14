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

async function checkBlogPosts() {
  console.log('Checking blog posts in database...');
  
  try {
    // Query all blog posts
    const { data, error, count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error querying blog posts:', error.message);
      return;
    }
    
    console.log(`Found ${count} blog posts:`);
    data.forEach(post => {
      console.log(`- ID: ${post.id}, Title: ${post.title}, User ID: ${post.user_id}`);
    });
    
    // Check specific post
    const { data: specificPost, error: specificError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', '11111111-1111-1111-1111-111111111111');
    
    if (specificError) {
      console.error('Error querying specific post:', specificError.message);
      return;
    }
    
    console.log('Specific post:', specificPost);
  } catch (error) {
    console.error('Error checking blog posts:', error.message);
  }
}

checkBlogPosts();