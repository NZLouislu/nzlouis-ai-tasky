/**
 * 诊断 Blog 数据加载问题
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function diagnoseBlogIssue() {
  console.log('🔍 开始诊断 Blog 数据问题...\n');

  // 1. 检查环境变量
  console.log('1️⃣ 检查环境变量:');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 已设置' : '❌ 未设置');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ 已设置' : '❌ 未设置');

  if (!supabaseUrl || !supabaseKey) {
    console.error('\n❌ Supabase 配置缺失，无法继续');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 2. 检查数据库连接
  console.log('\n2️⃣ 检查数据库连接:');
  try {
    const { data, error } = await supabase.from('blog_posts').select('count');
    if (error) {
      console.log('   ❌ 连接失败:', error.message);
      return;
    }
    console.log('   ✅ 连接成功');
  } catch (err) {
    console.log('   ❌ 连接异常:', err.message);
    return;
  }

  // 3. 检查 blog_posts 表
  console.log('\n3️⃣ 检查 blog_posts 表:');
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('   ❌ 查询失败:', error.message);
      return;
    }

    console.log(`   ✅ 找到 ${posts?.length || 0} 条记录`);

    if (!posts || posts.length === 0) {
      console.log('\n⚠️ 数据库中没有任何 blog posts');
      console.log('   建议: 创建一个新的 post 来测试');
      return;
    }

    // 4. 分析数据结构
    console.log('\n4️⃣ 分析数据结构:');
    const userGroups = {};
    posts.forEach(post => {
      if (!userGroups[post.user_id]) {
        userGroups[post.user_id] = [];
      }
      userGroups[post.user_id].push(post);
    });

    console.log(`   找到 ${Object.keys(userGroups).length} 个用户的数据\n`);

    // 5. 显示每个用户的数据
    Object.keys(userGroups).forEach((userId, index) => {
      const userPosts = userGroups[userId];
      console.log(`\n👤 用户 ${index + 1}: ${userId}`);
      console.log('─'.repeat(80));

      const rootPosts = userPosts.filter(p => !p.parent_id);
      const childPosts = userPosts.filter(p => p.parent_id);

      console.log(`\n   📄 根页面: ${rootPosts.length} 个`);
      rootPosts.forEach((post, i) => {
        console.log(`\n   ${i + 1}. ${post.title || '(无标题)'}`);
        console.log(`      ID: ${post.id}`);
        console.log(`      Icon: ${post.icon || '(无)'}`);
        console.log(`      Content: ${post.content ? JSON.stringify(post.content).substring(0, 50) + '...' : '(空)'}`);
        console.log(`      Created: ${new Date(post.created_at).toLocaleString()}`);
        console.log(`      Updated: ${new Date(post.updated_at).toLocaleString()}`);

        // 显示子页面
        const children = childPosts.filter(c => c.parent_id === post.id);
        if (children.length > 0) {
          console.log(`      子页面: ${children.length} 个`);
          children.forEach((child, j) => {
            console.log(`         ${j + 1}. ${child.title || '(无标题)'}`);
            console.log(`            ID: ${child.id}`);
            console.log(`            Updated: ${new Date(child.updated_at).toLocaleString()}`);
          });
        }
      });

      if (childPosts.length > 0) {
        console.log(`\n   📑 子页面: ${childPosts.length} 个`);
      }
    });

    // 6. 检查数据完整性
    console.log('\n\n5️⃣ 检查数据完整性:');
    let hasIssues = false;

    posts.forEach(post => {
      if (!post.title || post.title.trim() === '') {
        console.log(`   ⚠️ Post ${post.id} 没有 title`);
        hasIssues = true;
      }
      if (!post.user_id) {
        console.log(`   ⚠️ Post ${post.id} 没有 user_id`);
        hasIssues = true;
      }
      if (post.parent_id) {
        const parentExists = posts.some(p => p.id === post.parent_id);
        if (!parentExists) {
          console.log(`   ⚠️ Post ${post.id} 的 parent_id ${post.parent_id} 不存在`);
          hasIssues = true;
        }
      }
    });

    if (!hasIssues) {
      console.log('   ✅ 数据完整性检查通过');
    }

  } catch (err) {
    console.log('   ❌ 查询异常:', err.message);
    console.error(err);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ 诊断完成\n');
}

diagnoseBlogIssue();
