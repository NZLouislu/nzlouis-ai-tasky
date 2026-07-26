import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Bucket name
const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

/**
 * Upload a file to R2 storage
 * @param fileBuffer - Buffer containing the file data
 * @param key - The key (path) where the file should be stored
 * @param contentType - MIME type of the file
 * @returns Object containing the key and public URL
 */
export async function uploadFileToR2(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<{ key: string; url: string }> {
  try {
    // Upload the file
    await r2Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: '3600', // 1 hour cache
    }));

    // Get the public URL (using our custom domain)
    const url = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;

    return { key, url };
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error(`Failed to upload file to R2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get an object from R2 storage
 * @param key - The key (path) of the file to retrieve
 * @returns The file data as a Buffer
 */
export async function getFileFromR2(key: string): Promise<Buffer> {
  try {
    const response = await r2Client.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));

    // Convert the stream to buffer
    const chunks = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('R2 get file error:', error);
    throw new Error(`Failed to get file from R2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete an object from R2 storage
 * @param key - The key (path) of the file to delete
 */
export async function deleteObjectFromR2(key: string): Promise<void> {
  try {
    await r2Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));
  } catch (error) {
    console.error('R2 delete object error:', error);
    throw new Error(`Failed to delete file from R2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * List objects in R2 storage with a given prefix
 * @param prefix - The prefix to filter objects by
 * @returns Array of object keys
 */
export async function listObjectsWithPrefix(prefix: string): Promise<string[]> {
  try {
    const response = await r2Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    }));

    return response.Contents?.map(item => item.Key!) || [];
  } catch (error) {
    console.error('R2 list objects error:', error);
    throw new Error(`Failed to list objects from R2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a signed URL for temporary access to a private file
 * @param key - The key (path) of the file
 * @param expiresIn - Expiry time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL string
 */
export async function getSignedUrlForR2(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('R2 signed URL error:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}