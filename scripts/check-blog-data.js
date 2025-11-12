#!/usr/bin/env node

/**
 * Blog 数据诊断脚本
 * 检查数据库中的 blog_posts 数据
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n🔍 Blog 数据诊断工具\n', 'blue');

  // 1. 检查环境变量
  log('[1] 检查环境变量', 'cyan');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    log('❌ 缺少 Supabase 配置', 'red');
    process.exit(1);
  }

  log(`✅ Supabase URL: ${supabaseUrl}`, 'green');

  // 2. 连接数据库
  log('\n[2] 连接数据库', 'cyan');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  log('✅ 数据库连接成功', 'green');

  // 3. 检查 blog_posts 表
  log('\n[3] 检查 blog_posts 表', 'cyan');
  
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    log(`❌ 查询失败: ${error.message}`, 'red');
    log(`   Code: ${error.code}`, 'red');
    log(`   Details: ${error.details}`, 'red');
    process.exit(1);
  }

  log(`✅ 找到 ${posts?.length || 0} 篇文章`, 'green');

  // 4. 显示文章列表
  if (posts && posts.length > 0) {
    log('\n[4] 文章列表', 'cyan');
    
    posts.forEach((post, index) => {
      log(`\n文章 ${index + 1}:`, 'yellow');
      log(`  ID: ${post.id}`);
      log(`  标题: ${post.title}`);
      log(`  用户 ID: ${post.user_id}`);
      log(`  内容长度: ${post.content ? JSON.stringify(post.content).length : 0} 字符`);
      log(`  图标: ${post.icon || '无'}`);
      log(`  父文章: ${post.parent_id || '无'}`);
      log(`  创建时间: ${post.created_at}`);
      log(`  更新时间: ${post.updated_at}`);
    });
  } else {
    log('\n⚠️ 数据库中没有文章', 'yellow');
  }

  // 5. 按用户分组
  log('\n[5] 按用户分组', 'cyan');
  
  if (posts && posts.length > 0) {
    const userGroups = posts.reduce((acc, post) => {
      const userId = post.user_id;
      if (!acc[userId]) {
        acc[userId] = [];
      }
      acc[userId].push(post);
      return acc;
    }, {});

    Object.entries(userGroups).forEach(([userId, userPosts]) => {
      log(`\n用户: ${userId}`, 'yellow');
      log(`  文章数量: ${userPosts.length}`);
      userPosts.forEach(post => {
        log(`    - ${post.title} (${post.id})`);
      });
    });
  }

  // 6. 检查 user_profiles 表
  log('\n[6] 检查 user_profiles 表', 'cyan');
  
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, email, name')
    .order('created_at', { ascending: false });

  if (usersError) {
    log(`⚠️ 无法查询用户: ${usersError.message}`, 'yellow');
  } else {
    log(`✅ 找到 ${users?.length || 0} 个用户`, 'green');
    
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        log(`\n用户 ${index + 1}:`, 'yellow');
        log(`  ID: ${user.id}`);
        log(`  邮箱: ${user.email || '无'}`);
        log(`  名字: ${user.name || '无'}`);
        
        // 查找该用户的文章
        const userPostCount = posts?.filter(p => p.user_id === user.id).length || 0;
        log(`  文章数量: ${userPostCount}`);
      });
    }
  }

  // 7. 总结
  log('\n' + '='.repeat(60), 'blue');
  log('📊 诊断总结', 'blue');
  log('='.repeat(60), 'blue');
  log(`\n总文章数: ${posts?.length || 0}`);
  log(`总用户数: ${users?.length || 0}`);
  
  if (posts && posts.length === 0) {
    log('\n⚠️ 数据库中没有文章数据！', 'yellow');
    log('\n可能的原因:', 'yellow');
    log('1. 文章没有正确保存到数据库');
    log('2. 用户 ID 不匹配');
    log('3. 数据库权限问题');
    log('\n建议:', 'yellow');
    log('1. 检查浏览器控制台的保存日志');
    log('2. 确认用户已登录');
    log('3. 检查 user_profiles 表是否有用户记录');
  } else {
    log('\n✅ 数据库中有文章数据', 'green');
  }

  log('');
}

main().catch((error) => {
  log('\n❌ 脚本执行失败:', 'red');
  console.error(error);
  process.exit(1);
});
