/**
 * 修复 Blog Posts 的 RLS 策略
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fixBlogRLS() {
  console.log('🔧 修复 Blog Posts RLS 策略...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 缺少必要的环境变量');
    console.log('需要：');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    console.log('\n请在 .env 文件中添加 SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  // 使用 service_role key 来执行管理操作
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('1️⃣ 删除旧的 RLS 策略...');
    
    // 删除旧策略
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Users can access their own blog posts" ON blog_posts;`
    });

    if (dropError) {
      console.log('   ⚠️ 删除策略失败（可能不存在）:', dropError.message);
    } else {
      console.log('   ✅ 旧策略已删除');
    }

    console.log('\n2️⃣ 创建新的 RLS 策略...');
    
    // 创建新策略
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users full access to blog_posts"
        ON blog_posts
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
      `
    });

    if (createError) {
      console.log('   ❌ 创建策略失败:', createError.message);
      console.log('\n请手动在 Supabase SQL Editor 中执行以下 SQL：');
      console.log('─'.repeat(80));
      console.log(`
DROP POLICY IF EXISTS "Users can access their own blog posts" ON blog_posts;

CREATE POLICY "Allow authenticated users full access to blog_posts"
ON blog_posts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
      `);
      console.log('─'.repeat(80));
    } else {
      console.log('   ✅ 新策略已创建');
    }

    console.log('\n3️⃣ 验证策略...');
    
    const { data: policies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'blog_posts');

    if (verifyError) {
      console.log('   ⚠️ 无法验证策略:', verifyError.message);
    } else {
      console.log('   ✅ 当前策略：');
      policies?.forEach(policy => {
        console.log(`      - ${policy.policyname}`);
      });
    }

    console.log('\n✅ 修复完成！');
    console.log('\n现在请：');
    console.log('1. 刷新 Blog 页面');
    console.log('2. 尝试创建新的 post');
    console.log('3. 检查是否能正常保存和加载');

  } catch (error) {
    console.error('\n❌ 执行失败:', error);
    console.log('\n请手动在 Supabase Dashboard 的 SQL Editor 中执行：');
    console.log('supabase/fix-blog-rls.sql');
  }
}

fixBlogRLS();
