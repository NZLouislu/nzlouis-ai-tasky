import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface CleanupResult {
  orphanedFiles: number;
  orphanedRecords: number;
  deletedFiles: number;
  deletedRecords: number;
  errors: string[];
}

export async function findOrphanedFiles(userId: string): Promise<string[]> {
  const { data: files } = await supabase
    .from('storage_files')
    .select('file_path, entity_type, entity_id')
    .eq('user_id', userId);

  if (!files) return [];

  const orphaned: string[] = [];

  for (const file of files) {
    let exists = false;

    if (file.entity_type === 'blog_post' || file.entity_type === 'blog_cover') {
      const { data } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('id', file.entity_id)
        .single();
      exists = !!data;
    } else if (file.entity_type === 'chat_message') {
      const { data } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('id', file.entity_id)
        .single();
      exists = !!data;
    }

    if (!exists) {
      orphaned.push(file.file_path);
    }
  }

  return orphaned;
}

export async function findOrphanedRecords(userId: string): Promise<string[]> {
  const { data: records } = await supabase
    .from('storage_files')
    .select('id, file_path, bucket_name')
    .eq('user_id', userId);

  if (!records) return [];

  const orphaned: string[] = [];

  for (const record of records) {
    const { data } = await supabase.storage
      .from(record.bucket_name)
      .list(record.file_path.split('/').slice(0, -1).join('/'));

    const fileName = record.file_path.split('/').pop();
    const exists = data?.some(f => f.name === fileName);

    if (!exists) {
      orphaned.push(record.id);
    }
  }

  return orphaned;
}

export async function cleanupOrphanedFiles(
  userId: string,
  dryRun = true
): Promise<CleanupResult> {
  const result: CleanupResult = {
    orphanedFiles: 0,
    orphanedRecords: 0,
    deletedFiles: 0,
    deletedRecords: 0,
    errors: [],
  };

  try {
    const orphanedFiles = await findOrphanedFiles(userId);
    result.orphanedFiles = orphanedFiles.length;

    if (!dryRun && orphanedFiles.length > 0) {
      for (const filePath of orphanedFiles) {
        try {
          const { error } = await supabase.storage
            .from('NZLouis Tasky')
            .remove([filePath]);

          if (error) {
            result.errors.push(`Failed to delete ${filePath}: ${error.message}`);
          } else {
            result.deletedFiles++;
          }

          await supabase
            .from('storage_files')
            .delete()
            .eq('file_path', filePath)
            .eq('user_id', userId);
        } catch (error) {
          result.errors.push(
            `Error processing ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    const orphanedRecords = await findOrphanedRecords(userId);
    result.orphanedRecords = orphanedRecords.length;

    if (!dryRun && orphanedRecords.length > 0) {
      const { error } = await supabase
        .from('storage_files')
        .delete()
        .in('id', orphanedRecords)
        .eq('user_id', userId);

      if (error) {
        result.errors.push(`Failed to delete records: ${error.message}`);
      } else {
        result.deletedRecords = orphanedRecords.length;
      }
    }
  } catch (error) {
    result.errors.push(
      `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

export async function deletePostWithImages(
  postId: string,
  userId: string
): Promise<void> {
  const { data: files } = await supabase
    .from('storage_files')
    .select('file_path')
    .eq('entity_type', 'blog_post')
    .eq('entity_id', postId)
    .eq('user_id', userId);

  if (files && files.length > 0) {
    const filePaths = files.map(f => f.file_path);
    await supabase.storage.from('NZLouis Tasky').remove(filePaths);
  }

  await supabase
    .from('storage_files')
    .delete()
    .eq('entity_type', 'blog_post')
    .eq('entity_id', postId);

  await supabase.from('blog_posts').delete().eq('id', postId);
}

export async function deleteSessionWithImages(
  sessionId: string,
  userId: string
): Promise<void> {
  const { data: files } = await supabase
    .from('storage_files')
    .select('file_path')
    .eq('entity_type', 'chat_message')
    .eq('entity_id', sessionId)
    .eq('user_id', userId);

  if (files && files.length > 0) {
    const filePaths = files.map(f => f.file_path);
    await supabase.storage.from('NZLouis Tasky').remove(filePaths);
  }

  await supabase
    .from('storage_files')
    .delete()
    .eq('entity_type', 'chat_message')
    .eq('entity_id', sessionId);

  await supabase.from('chat_sessions').delete().eq('id', sessionId);
}
