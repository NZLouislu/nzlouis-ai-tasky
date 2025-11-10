/**
 * Test database connection
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...\n');
    
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    console.log('Test query result:', result);
    
    // Query table count
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`\n📊 Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 Suggestions:');
      console.log('1. Check if the password is correct');
      console.log('2. Try resetting the database password in Supabase Dashboard');
      console.log('3. Make sure there are no special characters that need URL encoding');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
