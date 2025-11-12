/**
 * 检查 blog_posts 表中的 title 数据
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkBlogTitles() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('📊 Fetching blog posts...\n');

    // 获取所有 blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, user_id, title, parent_id, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching posts:', error);
      return;
    }

    if (!posts || posts.length === 0) {
      console.log('⚠️ No blog posts found');
      return;
    }

    console.log(`✅ Found ${posts.length} blog posts:\n`);

    // 按用户分组
    const postsByUser = {};
    posts.forEach(post => {
      if (!postsByUser[post.user_id]) {
        postsByUser[post.user_id] = [];
      }
      postsByUser[post.user_id].push(post);
    });

    // 显示每个用户的 posts
    Object.keys(postsByUser).forEach(userId => {
      console.log(`\n👤 User: ${userId}`);
      console.log('─'.repeat(80));

      const userPosts = postsByUser[userId];
      const rootPosts = userPosts.filter(p => !p.parent_id);
      const childPosts = userPosts.filter(p => p.parent_id);

      console.log(`\n📄 Root Posts (${rootPosts.length}):`);
      rootPosts.forEach(post => {
        console.log(`  • ${post.title || '(Untitled)'}`);
        console.log(`    ID: ${post.id}`);
        console.log(`    Created: ${new Date(post.created_at).toLocaleString()}`);
        console.log(`    Updated: ${new Date(post.updated_at).toLocaleString()}`);

        // 显示子页面
        const children = childPosts.filter(c => c.parent_id === post.id);
        if (children.length > 0) {
          console.log(`    Children (${children.length}):`);
          children.forEach(child => {
            console.log(`      ↳ ${child.title || '(Untitled)'}`);
            console.log(`        ID: ${child.id}`);
            console.log(`        Updated: ${new Date(child.updated_at).toLocaleString()}`);
          });
        }
        console.log('');
      });

      // 显示孤立的子页面（parent_id 不存在）
      const orphanedChildren = childPosts.filter(c => 
        !rootPosts.some(p => p.id === c.parent_id) &&
        !childPosts.some(p => p.id === c.parent_id)
      );
      if (orphanedChildren.length > 0) {
        console.log(`\n⚠️ Orphaned Child Posts (${orphanedChildren.length}):`);
        orphanedChildren.forEach(post => {
          console.log(`  • ${post.title || '(Untitled)'}`);
          console.log(`    ID: ${post.id}`);
          console.log(`    Parent ID: ${post.parent_id}`);
          console.log(`    Updated: ${new Date(post.updated_at).toLocaleString()}`);
          console.log('');
        });
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Check complete');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkBlogTitles();
