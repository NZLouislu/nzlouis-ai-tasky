import { S3Client, ListBucketsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import 'dotenv/config';

async function testR2Connection() {
  console.log('Testing R2 connection...');
  console.log('Account ID:', process.env.R2_ACCOUNT_ID);
  console.log('Endpoint:', process.env.R2_ENDPOINT);
  console.log('Bucket:', process.env.R2_BUCKET_NAME);
  console.log('Access Key ID:', process.env.R2_ACCESS_KEY_ID?.slice(0, 8) + '...');

  const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  try {
    // Test 1: List buckets
    console.log('\n1. Listing buckets...');
    const buckets = await r2.send(new ListBucketsCommand({}));
    console.log('   Buckets:', buckets.Buckets?.map(b => b.Name).join(', ') || '(none)');

    // Test 2: List objects in the specific bucket
    console.log(`\n2. Listing objects in '${process.env.R2_BUCKET_NAME}'...`);
    const objects = await r2.send(new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME!,
      MaxKeys: 5,
    }));
    console.log(`   Objects found: ${objects.KeyCount || 0}`);
    if (objects.Contents?.length) {
      objects.Contents.forEach(obj => console.log(`   - ${obj.Key} (${obj.Size} bytes)`));
    }

    console.log('\n✅ R2 connection successful!');
  } catch (error: any) {
    console.error('\n❌ R2 connection failed:', error.message);
    if (error.Code) console.error('   Error code:', error.Code);
    if (error.$metadata?.httpStatusCode) console.error('   HTTP status:', error.$metadata.httpStatusCode);
  }
}

testR2Connection();
