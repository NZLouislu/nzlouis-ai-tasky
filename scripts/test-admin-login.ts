/**
 * Admin登录测试脚本
 * 用于验证admin认证系统是否正常工作
 */

async function testAdminLogin() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 开始测试Admin登录系统...\n');

  // 测试1: 登录API
  console.log('📝 测试1: Admin登录API');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('   状态:', loginResponse.status);
    console.log('   响应:', loginData);

    if (loginResponse.ok) {
      console.log('   ✅ 登录成功');
      
      // 获取cookie
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('   Cookie:', cookies ? '已设置' : '未设置');
      
      if (cookies) {
        // 测试2: 验证API
        console.log('\n📝 测试2: Admin验证API');
        
        // 提取cookie值
        const cookieMatch = cookies.match(/admin-session=([^;]+)/);
        const adminSessionToken = cookieMatch ? cookieMatch[1] : null;
        
        if (adminSessionToken) {
          const verifyResponse = await fetch(`${baseUrl}/api/admin/verify`, {
            headers: {
              'Cookie': `admin-session=${adminSessionToken}`,
            },
          });
          
          const verifyData = await verifyResponse.json();
          console.log('   状态:', verifyResponse.status);
          console.log('   响应:', verifyData);
          
          if (verifyResponse.ok && verifyData.authenticated) {
            console.log('   ✅ 验证成功');
          } else {
            console.log('   ❌ 验证失败');
          }
        }
      }
    } else {
      console.log('   ❌ 登录失败');
    }
  } catch (error) {
    console.error('   ❌ 错误:', error);
  }

  // 测试3: 错误凭据
  console.log('\n📝 测试3: 错误凭据测试');
  try {
    const wrongLoginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'wrong',
        password: 'wrong',
      }),
    });

    console.log('   状态:', wrongLoginResponse.status);
    
    if (wrongLoginResponse.status === 401) {
      console.log('   ✅ 正确拒绝错误凭据');
    } else {
      console.log('   ❌ 应该返回401状态码');
    }
  } catch (error) {
    console.error('   ❌ 错误:', error);
  }

  // 测试4: 无token验证
  console.log('\n📝 测试4: 无token验证测试');
  try {
    const noTokenResponse = await fetch(`${baseUrl}/api/admin/verify`);
    console.log('   状态:', noTokenResponse.status);
    
    if (noTokenResponse.status === 401) {
      console.log('   ✅ 正确拒绝无token请求');
    } else {
      console.log('   ❌ 应该返回401状态码');
    }
  } catch (error) {
    console.error('   ❌ 错误:', error);
  }

  console.log('\n✅ 测试完成！');
}

// 运行测试
testAdminLogin().catch(console.error);
