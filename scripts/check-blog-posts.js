const { createClient } = require('@supabase/supabase-js');

// Supabase configuration for Tasky (main database)
const supabaseUrl = 'https://nkpgzczvxuhbqrifjuer.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcGd6Y3p2eHVoYnFyaWZqdWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjg3NjIsImV4cCI6MjA3MjY0NDc2Mn0.VdKmeil7rnCPOspOK25HUKce2yPj5ugN3Dho8iMziS0';

// Supabase configuration for Blog (separate database)
const blogSupabaseUrl = 'https://bglxjovbnhyebcihkciy.supabase.co';
const blogSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnbHhqb3Zibmh5ZWJjaWhrY2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNDkyODQsImV4cCI6MjA3MjYyNTI4NH0.uvaIBrYAb9aqJJj040XLUFsDmDqSFH-nEmf47dOh540';

const taskySupabase = createClient(supabaseUrl, supabaseAnonKey);
const blogSupabase = createClient(blogSupabaseUrl, blogSupabaseAnonKey);

async function checkBlogPosts() {
  try {
    console.log('Checking Tasky database (blog_posts table):');
    // Fetch all blog posts from Tasky database
    const { data: taskyPosts, error: taskyError } = await taskySupabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (taskyError) {
      console.error('Error fetching blog posts from Tasky database:', taskyError);
    } else {
      console.log(`Found ${taskyPosts.length} blog posts in Tasky database:`);
      taskyPosts.forEach((post, index) => {
        console.log(`\nPost ${index + 1}:`);
        console.log(`  ID: ${post.id}`);
        console.log(`  User ID: ${post.user_id}`);
        console.log(`  Title: ${post.title}`);
        console.log(`  Parent ID: ${post.parent_id}`);
        console.log(`  Created At: ${post.created_at}`);
        console.log(`  Updated At: ${post.updated_at}`);
        console.log(`  Content Type: ${typeof post.content}`);
        if (post.content) {
          console.log(`  Content Preview: ${JSON.stringify(post.content).substring(0, 100)}...`);
        }
        console.log(`  Icon: ${post.icon}`);
        console.log(`  Cover: ${JSON.stringify(post.cover)}`);
      });
    }

    console.log('\nChecking Blog database (comments table):');
    // Fetch comments from Blog database
    const { data: comments, error: commentsError } = await blogSupabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching comments from Blog database:', commentsError);
    } else {
      console.log(`Found ${comments.length} comments in Blog database:`);
      comments.forEach((comment, index) => {
        console.log(`\nComment ${index + 1}:`);
        console.log(`  ID: ${comment.id}`);
        console.log(`  Post ID: ${comment.post_id}`);
        console.log(`  Name: ${comment.name}`);
        console.log(`  Comment: ${comment.comment.substring(0, 50)}...`);
        console.log(`  Created At: ${comment.created_at}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBlogPosts();