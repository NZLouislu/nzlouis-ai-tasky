import { PartialBlock } from '@blocknote/core';
import { supabase } from '@/lib/supabase/supabase-client';

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
    if (!supabase) {
      console.error('Supabase client not initialized');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('article_versions')
        .insert({
          post_id: postId,
          content,
          metadata: { trigger, description },
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        postId: data.post_id,
        content: data.content,
        metadata: data.metadata,
        createdAt: data.created_at,
        createdBy: data.created_by,
      };
    } catch (error) {
      console.error('Failed to save version:', error);
      return null;
    }
  }

  async getVersionHistory(postId: string, limit = 50): Promise<ArticleVersion[]> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('article_versions')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((v: any) => ({
        id: v.id,
        postId: v.post_id,
        content: v.content,
        metadata: v.metadata,
        createdAt: v.created_at,
        createdBy: v.created_by,
      }));
    } catch (error) {
      console.error('Failed to get version history:', error);
      return [];
    }
  }

  async getVersion(versionId: string): Promise<ArticleVersion | null> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('article_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        postId: data.post_id,
        content: data.content,
        metadata: data.metadata,
        createdAt: data.created_at,
        createdBy: data.created_by,
      };
    } catch (error) {
      console.error('Failed to get version:', error);
      return null;
    }
  }

  async rollbackToVersion(versionId: string): Promise<boolean> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    try {
      const version = await this.getVersion(versionId);
      if (!version) return false;

      const { error } = await supabase
        .from('blog_posts')
        .update({ content: version.content })
        .eq('id', version.postId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to rollback:', error);
      return false;
    }
  }

  async deleteOldVersions(postId: string, keepLast = 50): Promise<number> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return 0;
    }

    try {
      const versions = await this.getVersionHistory(postId, 1000);
      
      if (versions.length <= keepLast) return 0;

      const toDelete = versions.slice(keepLast).map((v) => v.id);

      const { error } = await supabase
        .from('article_versions')
        .delete()
        .in('id', toDelete);

      if (error) throw error;

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
