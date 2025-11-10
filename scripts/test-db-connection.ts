/**
 * Database Connection Test Script
 * Tests Prisma connection to Supabase
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  
  try {
    // Test 1: Simple connection
    console.log('\n✅ Test 1: Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connection successful!');

    // Test 2: Query test
    console.log('\n✅ Test 2: Running test query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query successful:', result);

    // Test 3: Check User table
    console.log('\n✅ Test 3: Checking User table...');
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n❌ Connection failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
