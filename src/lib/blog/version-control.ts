import { PartialBlock } from '@blocknote/core';
import { db } from '@/lib/db/connection';
import { articleVersions } from '@/lib/db/schema/tasky';
import { blogPosts } from '@/lib/db/schema/tasky';
import { eq, desc, inArray } from 'drizzle-orm';

export interface ArticleVersion {
  id: string;
  postId: string;
  content: PartialBlock[];
  metadata: {
    trigger: 'ai' | 'auto' | 'manual';
    description?: string;
    title?: string;
  };
  createdAt: string;
  createdBy: string;
}

export class VersionControl {
  async saveVersion(
    postId: string,
    content: PartialBlock[],
    userId: string,
    trigger: 'ai' | 'auto' | 'manual',
    description?: string
  ): Promise<ArticleVersion | null> {
    try {
      const [data] = await db
        .insert(articleVersions)
        .values({
          postId: postId,
          content,
          metadata: { trigger, description },
          createdBy: userId,
        })
        .returning();

      if (!data) return null;

      return {
        id: data.id,
        postId: data.postId,
        content: data.content as PartialBlock[],
        metadata: data.metadata as { trigger: 'ai' | 'auto' | 'manual'; description?: string; title?: string },
        createdAt: data.createdAt ? data.createdAt.toISOString() : new Date().toISOString(),
        createdBy: data.createdBy || '',
      };
    } catch (error) {
      console.error('Failed to save version:', error);
      return null;
    }
  }

  async getVersionHistory(postId: string, limit = 50): Promise<ArticleVersion[]> {
    try {
      const data = await db
        .select()
        .from(articleVersions)
        .where(eq(articleVersions.postId, postId))
        .orderBy(desc(articleVersions.createdAt))
        .limit(limit);

      return (data || []).map((v) => ({
        id: v.id,
        postId: v.postId,
        content: v.content as PartialBlock[],
        metadata: v.metadata as { trigger: 'ai' | 'auto' | 'manual'; description?: string; title?: string },
        createdAt: v.createdAt ? v.createdAt.toISOString() : '',
        createdBy: v.createdBy || '',
      }));
    } catch (error) {
      console.error('Failed to get version history:', error);
      return [];
    }
  }

  async getVersion(versionId: string): Promise<ArticleVersion | null> {
    try {
      const [data] = await db
        .select()
        .from(articleVersions)
        .where(eq(articleVersions.id, versionId))
        .limit(1);

      if (!data) return null;

      return {
        id: data.id,
        postId: data.postId,
        content: data.content as PartialBlock[],
        metadata: data.metadata as { trigger: 'ai' | 'auto' | 'manual'; description?: string; title?: string },
        createdAt: data.createdAt ? data.createdAt.toISOString() : '',
        createdBy: data.createdBy || '',
      };
    } catch (error) {
      console.error('Failed to get version:', error);
      return null;
    }
  }

  async rollbackToVersion(versionId: string): Promise<boolean> {
    try {
      const version = await this.getVersion(versionId);
      if (!version) return false;

      await db
        .update(blogPosts)
        .set({ content: version.content })
        .where(eq(blogPosts.id, version.postId));

      return true;
    } catch (error) {
      console.error('Failed to rollback:', error);
      return false;
    }
  }

  async deleteOldVersions(postId: string, keepLast = 50): Promise<number> {
    try {
      const versions = await this.getVersionHistory(postId, 1000);

      if (versions.length <= keepLast) return 0;

      const toDelete = versions.slice(keepLast).map((v) => v.id);

      await db
        .delete(articleVersions)
        .where(inArray(articleVersions.id, toDelete));

      return toDelete.length;
    } catch (error) {
      console.error('Failed to delete old versions:', error);
      return 0;
    }
  }

  async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<{
    version1: ArticleVersion | null;
    version2: ArticleVersion | null;
    timeDiff: number;
  }> {
    const [v1, v2] = await Promise.all([
      this.getVersion(versionId1),
      this.getVersion(versionId2),
    ]);

    const timeDiff = v1 && v2
      ? new Date(v2.createdAt).getTime() - new Date(v1.createdAt).getTime()
      : 0;

    return {
      version1: v1,
      version2: v2,
      timeDiff,
    };
  }
}
