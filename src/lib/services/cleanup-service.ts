import { listObjectsWithPrefix, deleteObjectFromR2 } from '@/lib/storage/r2-storage';
import { db } from '@/lib/db/connection';
import { storageFiles, blogPosts, chatSessions } from '@/lib/db/schema/tasky';
import { eq, and, inArray } from 'drizzle-orm';

export interface CleanupResult {
  orphanedFiles: number;
  orphanedRecords: number;
  deletedFiles: number;
  deletedRecords: number;
  errors: string[];
}

export async function findOrphanedFiles(userId: string): Promise<string[]> {
  const files = await db.select().from(storageFiles).where(eq(storageFiles.userId, userId));
  
  if (!files) return [];
  
  const orphaned: string[] = [];
  
  for (const file of files) {
    let exists = false;
    
    if (file.entityType === 'blog_post' || file.entityType === 'blog_cover') {
      const [blogPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, file.entityId));
      exists = !!blogPost;
    } else if (file.entityType === 'chat_message') {
      const [chatSession] = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.id, file.entityId));
      exists = !!chatSession;
    }
    
    if (!exists) {
      orphaned.push(file.filePath);
    }
  }
  
  return orphaned;
}

export async function findOrphanedRecords(userId: string): Promise<string[]> {
  const records = await db.select().from(storageFiles).where(eq(storageFiles.userId, userId));
  
  if (!records) return [];
  
  const orphaned: string[] = [];
  
  for (const file of records) {
    const dirPath = file.filePath.substring(0, file.filePath.lastIndexOf('/'));
    const fileName = file.filePath.substring(file.filePath.lastIndexOf('/') + 1);
    
    try {
      const objects = await listObjectsWithPrefix(`${dirPath}/`);
      const exists = objects.some(obj => 
        obj.substring(obj.lastIndexOf('/') + 1) === fileName
      );
      
      if (!exists) {
        orphaned.push(file.id);
      }
    } catch (error) {
      // If we can't list objects, assume it exists to avoid false positives
      console.warn(`Could not list objects in ${dirPath}:`, error);
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
          await deleteObjectFromR2(filePath);
          result.deletedFiles++;
        } catch (error) {
          result.errors.push(`Failed to delete ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Delete corresponding database records
      for (const filePath of orphanedFiles) {
        try {
          await db.delete(storageFiles).where(
            and(
              eq(storageFiles.filePath, filePath),
              eq(storageFiles.userId, userId)
            )
          );
          result.deletedRecords++;
        } catch (error) {
          result.errors.push(`Error deleting DB record for ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    const orphanedRecords = await findOrphanedRecords(userId);
    result.orphanedRecords = orphanedRecords.length;
    
    if (!dryRun && orphanedRecords.length > 0) {
      try {
        await db.delete(storageFiles).where(
          and(
            inArray(storageFiles.id, orphanedRecords),
            eq(storageFiles.userId, userId)
          )
        );
        result.deletedRecords = orphanedRecords.length;
      } catch (error) {
        result.errors.push(`Failed to delete records: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    result.errors.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return result;
}

export async function deleteFile(
  filePath: string,
  userId: string
): Promise<void> {
  // Delete from R2 storage
  await deleteObjectFromR2(filePath);
  
  // Delete from database
  await db.delete(storageFiles).where(
    and(
      eq(storageFiles.filePath, filePath),
      eq(storageFiles.userId, userId)
    )
  );
}

export async function deleteEntityFiles(
  entityType: string,
  entityId: string,
  userId: string
): Promise<void> {
  // Get all files for this entity
  const files = await db.select().from(storageFiles).where(
    and(
      eq(storageFiles.entityType, entityType),
      eq(storageFiles.entityId, entityId),
      eq(storageFiles.userId, userId)
    )
  );
  
  // Delete from R2 storage
  for (const file of files) {
    try {
      await deleteObjectFromR2(file.filePath);
    } catch (error) {
      console.error(`Failed to delete file ${file.filePath}:`, error);
    }
  }
  
  // Delete database records
  await db.delete(storageFiles).where(
    and(
      eq(storageFiles.entityType, entityType),
      eq(storageFiles.entityId, entityId),
      eq(storageFiles.userId, userId)
    )
  );
}