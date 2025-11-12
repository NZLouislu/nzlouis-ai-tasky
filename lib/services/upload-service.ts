import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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

  let processedFile = file;
  if (file.size > 1024 * 1024) {
    processedFile = await compressImage(file);
  }

  const folder = entityType === 'blog_cover' ? 'blog-covers' : 
                 entityType === 'blog_post' ? 'blog-images' : 'chat-images';
  const timestamp = Date.now();
  const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
  const filePath = `${folder}/${userId}/${entityId}/${timestamp}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('NZLouis Tasky')
    .upload(filePath, processedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('NZLouis Tasky')
    .getPublicUrl(filePath);

  const { data: fileRecord, error: dbError } = await supabase
    .from('storage_files')
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      bucket_name: 'NZLouis Tasky',
      file_path: filePath,
      file_name: file.name,
      file_size: processedFile.size,
      mime_type: file.type,
      entity_type: entityType,
      entity_id: entityId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from('NZLouis Tasky').remove([filePath]);
    throw dbError;
  }

  return {
    publicUrl,
    filePath,
    fileId: fileRecord.id,
  };
}

export async function deleteImage(fileId: string, userId: string): Promise<void> {
  const { data: file } = await supabase
    .from('storage_files')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', userId)
    .single();

  if (!file) throw new Error('File not found');

  await supabase.storage.from(file.bucket_name).remove([file.file_path]);
  await supabase.from('storage_files').delete().eq('id', fileId);
}

export async function deleteEntityImages(entityType: string, entityId: string, userId: string): Promise<void> {
  const { data: files } = await supabase
    .from('storage_files')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('user_id', userId);

  if (files && files.length > 0) {
    const filePaths = files.map(f => f.file_path);
    await supabase.storage.from('NZLouis Tasky').remove(filePaths);
    await supabase.from('storage_files').delete()
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);
  }
}
