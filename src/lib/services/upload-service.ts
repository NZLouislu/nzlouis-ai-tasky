import { v4 as uuidv4 } from 'uuid';
import { uploadFileToR2, deleteObjectFromR2, listObjectsWithPrefix } from '@/lib/storage/r2-storage';

export interface UploadOptions {
  file: File;
  entityType: 'blog_post' | 'chat_message' | 'blog_cover';
  entityId: string;
  userId: string;
}

export interface UploadResult {
  publicUrl: string;
  filePath: string;
  fileId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Image compression function (keep the same as before)
async function compressImage(file: File): Promise<File> {
  if (file.size <= 1024 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: file.type }));
            } else {
              reject(new Error('Compression failed'));
            }
          },
          file.type,
          0.85
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(options: UploadOptions): Promise<UploadResult> {
  const { file, entityType, entityId, userId } = options;

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only image files are allowed');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must not exceed 10MB');
  }

  if (file.size > 1024 * 1024) {
    await compressImage(file);
  }

  const folder = entityType === 'blog_cover' ? 'blog-covers' : 
                entityType === 'blog_post' ? 'blog-images' : 'chat-images';
  const timestamp = Date.now();
  const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
  const filePath = `${folder}/${userId}/${entityId}/${timestamp}-${fileName}`;

  // Convert File to Buffer using FileReader (compatible with jsdom)
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result !== 'string') {
        resolve(Buffer.from(reader.result));
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsArrayBuffer(file);
  });

  // Upload to R2
  const { key, url } = await uploadFileToR2(buffer, filePath, file.type);

  // Generate a file ID (we'll use UUID for now)
  const fileId = uuidv4();

  return {
    publicUrl: url,
    filePath: key,
    fileId: fileId,
  };
}

export async function deleteFile(filePath: string, _userId: string): Promise<void> {
  try {
    // Delete from R2 storage
    await deleteObjectFromR2(filePath);
    
    // TODO: Delete from database (storage_files table)
    // This would require importing and using the database client
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

export async function deleteEntityImages(entityType: string, entityId: string, userId: string): Promise<void> {
  try {
    const prefix = `${entityType}/${userId}/${entityId}/`;
    const files = await listObjectsWithPrefix(prefix);
    
    // Delete each file from R2 storage
    for (const fileKey of files) {
      try {
        await deleteObjectFromR2(fileKey);
      } catch (error) {
        console.error(`Failed to delete file ${fileKey}:`, error);
      }
    }
    
    // TODO: Delete from database (storage_files table)
  } catch (error) {
    console.error('Error deleting entity images:', error);
    throw error;
  }
}