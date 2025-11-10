// Test Blog Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const blogUrl = process.env.BLOG_SUPABASE_URL;
const blogKey = process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Blog Supabase connection...');
console.log('URL:', blogUrl ? 'Present' : 'Missing');
console.log('Key:', blogKey ? 'Present (length: ' + blogKey.length + ')' : 'Missing');

if (!blogUrl || !blogKey) {
    console.error('❌ Blog Supabase configuration is missing!');
    process.exit(1);
}

const blogClient = createClient(blogUrl, blogKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

async function testConnection() {
    try {
        console.log('\nTesting connection to:', blogUrl);

        // Test 1: Check if we can query the posts table
        const { data, error } = await blogClient
            .from('posts')
            .select('id, title')
            .limit(5);

        if (error) {
            console.error('❌ Error querying blog_posts:', error.message);
            console.error('Details:', error);
            return false;
        }

        console.log('✅ Successfully connected to Blog database!');
        console.log(`Found ${data?.length || 0} blog posts`);
        if (data && data.length > 0) {
            console.log('Sample posts:');
            data.forEach(post => {
                console.log(`  - ${post.title} (${post.id})`);
            });
        }

        return true;
    } catch (err) {
        console.error('❌ Connection test failed:', err.message);
        console.error('Stack:', err.stack);
        return false;
    }
}

testConnection().then(success => {
    process.exit(success ? 0 : 1);
});
