/**
 * Admin认证系统诊断脚本
 * 全面检查admin认证系统的各个环节
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Admin认证系统诊断\n');
console.log('='.repeat(50));

// 1. 检查环境变量
console.log('\n📋 1. 检查环境变量');
console.log('-'.repeat(50));

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const hasAdminUsername = envContent.includes('ADMIN_USERNAME=');
  const hasAdminPassword = envContent.includes('ADMIN_PASSWORD=');
  
  console.log('✓ .env 文件存在');
  console.log(`${hasAdminUsername ? '✓' : '✗'} ADMIN_USERNAME 已配置`);
  console.log(`${hasAdminPassword ? '✓' : '✗'} ADMIN_PASSWORD 已配置`);
  
  if (hasAdminUsername && hasAdminPassword) {
    const usernameMatch = envContent.match(/ADMIN_USERNAME=(.+)/);
    const passwordMatch = envContent.match(/ADMIN_PASSWORD=(.+)/);
    
    if (usernameMatch && passwordMatch) {
      const username = usernameMatch[1].trim();
      const password = passwordMatch[1].trim();
      
      console.log(`  用户名: ${username}`);
      console.log(`  密码长度: ${password.length} 字符`);
    }
  }
} else {
  console.log('✗ .env 文件不存在');
}

// 2. 检查关键文件
console.log('\n📋 2. 检查关键文件');
console.log('-'.repeat(50));

const criticalFiles = [
  'middleware.ts',
  'lib/admin-auth.ts',
  'app/api/admin/login/route.ts',
  'app/api/admin/verify/route.ts',
  'app/api/admin/logout/route.ts',
  'app/admin/page.tsx',
  'app/admin/login/page.tsx',
];

criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✓' : '✗'} ${file}`);
});

// 3. 检查middleware配置
console.log('\n📋 3. 检查Middleware配置');
console.log('-'.repeat(50));

const middlewarePath = path.join(process.cwd(), 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8');
  
  const hasAdminCheck = middlewareContent.includes("pathname.startsWith('/admin')");
  const hasAdminSession = middlewareContent.includes("admin-session");
  const hasConfig = middlewareContent.includes('export const config');
  const excludesApi = middlewareContent.includes('!api');
  
  console.log(`${hasAdminCheck ? '✓' : '✗'} Admin路径检查`);
  console.log(`${hasAdminSession ? '✓' : '✗'} Admin session cookie检查`);
  console.log(`${hasConfig ? '✓' : '✗'} Matcher配置存在`);
  console.log(`${excludesApi ? '✓' : '✗'} API路由已排除`);
} else {
  console.log('✗ middleware.ts 不存在');
}

// 4. 检查admin-auth工具函数
console.log('\n📋 4. 检查Admin认证工具');
console.log('-'.repeat(50));

const adminAuthPath = path.join(process.cwd(), 'lib/admin-auth.ts');
if (fs.existsSync(adminAuthPath)) {
  const adminAuthContent = fs.readFileSync(adminAuthPath, 'utf-8');
  
  const hasAdminUserId = adminAuthContent.includes('ADMIN_USER_ID');
  const hasGetUserId = adminAuthContent.includes('getUserIdFromRequest');
  const hasIsAdmin = adminAuthContent.includes('isAdminRequest');
  
  console.log(`${hasAdminUserId ? '✓' : '✗'} ADMIN_USER_ID 常量`);
  console.log(`${hasGetUserId ? '✓' : '✗'} getUserIdFromRequest 函数`);
  console.log(`${hasIsAdmin ? '✓' : '✗'} isAdminRequest 函数`);
} else {
  console.log('✗ lib/admin-auth.ts 不存在');
}

// 5. 检查API路由
console.log('\n📋 5. 检查API路由');
console.log('-'.repeat(50));

const apiRoutes = [
  { path: 'app/api/admin/login/route.ts', name: 'Login API' },
  { path: 'app/api/admin/verify/route.ts', name: 'Verify API' },
  { path: 'app/api/admin/logout/route.ts', name: 'Logout API' },
];

apiRoutes.forEach(({ path: routePath, name }) => {
  const fullPath = path.join(process.cwd(), routePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const hasExport = content.includes('export async function');
    console.log(`${hasExport ? '✓' : '✗'} ${name}`);
  } else {
    console.log(`✗ ${name} (文件不存在)`);
  }
});

// 6. 检查数据库SQL
console.log('\n📋 6. 检查数据库设置');
console.log('-'.repeat(50));

const sqlPath = path.join(process.cwd(), 'supabase/add-admin-user.sql');
if (fs.existsSync(sqlPath)) {
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  
  const hasUserProfile = sqlContent.includes('user_profiles');
  const hasAdminUserId = sqlContent.includes('admin-user-id');
  const hasAiSettings = sqlContent.includes('user_ai_settings');
  
  console.log(`${hasUserProfile ? '✓' : '✗'} user_profiles 表插入`);
  console.log(`${hasAdminUserId ? '✓' : '✗'} admin-user-id 使用`);
  console.log(`${hasAiSettings ? '✓' : '✗'} user_ai_settings 表插入`);
  
  console.log('\n⚠️  请确保已在Supabase中执行此SQL文件！');
} else {
  console.log('✗ supabase/add-admin-user.sql 不存在');
}

// 7. 总结
console.log('\n📋 7. 诊断总结');
console.log('-'.repeat(50));

console.log(`
✅ 如果所有检查都通过，系统应该正常工作

🔧 如果有检查失败：
   1. 确保 .env 文件包含 ADMIN_USERNAME 和 ADMIN_PASSWORD
   2. 确保所有关键文件都存在
   3. 在Supabase中执行 supabase/add-admin-user.sql
   4. 重启开发服务器

🧪 测试步骤：
   1. 访问 http://localhost:3000/admin
   2. 应该自动跳转到 /admin/login
   3. 使用 admin/admin123 登录
   4. 应该跳转到 /admin 仪表板

📚 详细文档：
   - docs/admin-auth/修复完成.md
   - docs/admin-auth/TESTING_GUIDE.md
`);

console.log('='.repeat(50));
console.log('✅ 诊断完成\n');
