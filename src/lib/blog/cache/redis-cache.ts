/**
 * Blog AI Redis Cache Manager
 * Implements caching strategy for document structure and writing style
 */

import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';
import { PartialBlock } from '@blocknote/core';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache TTL configuration (in seconds)
const TTL = {
  DOC_STRUCTURE: 300, // 5 minutes (文章内容可能频繁修改)
  WRITING_STYLE: 86400, // 24 hours (写作风格相对稳定)
  SEARCH_RESULTS: 3600, // 1 hour (外部搜索结果)
  SEO_ANALYSIS: 1800, // 30 minutes
};

/**
 * Document structure cache interface
 */
export interface DocumentStructure {
  outline: any[];
  sections: any[];
  stats: any;
}

/**
 * Writing style profile interface
 */
export interface WritingStyle {
  averageSentenceLength: number;
  formalityLevel: number;
  preferredStructure: string;
  commonPhrases: string[];
  technicalTermDensity?: number;
  useOfExamples?: boolean;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  totalDocuments: number;
  totalStyles: number;
  totalItems: number;
  limits: {
    documents: number;
    styles: number;
  };
}

/**
 * Blog AI Redis Cache Manager
 */
export class BlogAIRedisCache {
  private readonly DOC_STRUCTURE_PREFIX = 'blog_ai:doc_structure:';
  private readonly STYLE_PREFIX = 'blog_ai:writing_style:';

  // ========== 文档结构缓存 ==========

  /**
   * 获取缓存的文档结构
   */
  async getDocumentStructure(
    postId: string,
    content: PartialBlock[]
  ): Promise<DocumentStructure | null> {
    const contentHash = this.hashContent(content);
    const key = `${this.DOC_STRUCTURE_PREFIX}${postId}:${contentHash}`;

    try {
      const cached = await redis.get(key);

      if (cached) {
        console.log('✅ Redis 缓存命中: 文档结构', { postId, contentHash });
        return cached as DocumentStructure;
      }

      console.log('❌ Redis 缓存未命中: 文档结构', { postId, contentHash });
      return null;
    } catch (error) {
      console.error('Redis 读取失败:', error);
      return null; // 降级：缓存失败不影响主流程
    }
  }

  /**
   * 保存文档结构到缓存
   */
  async setDocumentStructure(
    postId: string,
    content: PartialBlock[],
    structure: DocumentStructure
  ): Promise<void> {
    const contentHash = this.hashContent(content);
    const key = `${this.DOC_STRUCTURE_PREFIX}${postId}:${contentHash}`;

    try {
      await redis.setex(key, TTL.DOC_STRUCTURE, structure);
      console.log('💾 Redis 缓存已保存: 文档结构', {
        postId,
        contentHash,
        ttl: `${TTL.DOC_STRUCTURE}s`,
      });
    } catch (error) {
      console.error('Redis 写入失败:', error);
      // 不抛出错误，缓存失败不影响主流程
    }
  }

  // ========== 用户写作风格缓存 ==========

  /**
   * 获取缓存的用户写作风格
   */
  async getWritingStyle(userId: string): Promise<WritingStyle | null> {
    const key = `${this.STYLE_PREFIX}${userId}`;

    try {
      const cached = await redis.get(key);

      if (cached) {
        console.log('✅ Redis 缓存命中: 写作风格', { userId });
        return cached as WritingStyle;
      }

      console.log('❌ Redis 缓存未命中: 写作风格', { userId });
      return null;
    } catch (error) {
      console.error('Redis 读取失败:', error);
      return null;
    }
  }

  /**
   * 保存用户写作风格到缓存
   */
  async setWritingStyle(userId: string, style: WritingStyle): Promise<void> {
    const key = `${this.STYLE_PREFIX}${userId}`;

    try {
      await redis.setex(key, TTL.WRITING_STYLE, style);
      console.log('💾 Redis 缓存已保存: 写作风格', {
        userId,
        ttl: `${TTL.WRITING_STYLE}s (24h)`,
      });
    } catch (error) {
      console.error('Redis 写入失败:', error);
    }
  }

  // ========== 工具方法 ==========

  /**
   * 计算内容哈希（用于检测内容是否变化）
   */
  private hashContent(content: PartialBlock[]): string {
    return createHash('md5')
      .update(JSON.stringify(content))
      .digest('hex')
      .slice(0, 8); // 取前8位即可
  }

  /**
   * 清理用户的所有缓存
   */
  async clearUserCache(userId: string): Promise<void> {
    const key = `${this.STYLE_PREFIX}${userId}`;

    try {
      await redis.del(key);
      console.log('🗑️  已清理用户缓存', { userId });
    } catch (error) {
      console.error('Redis 删除失败:', error);
    }
  }

  /**
   * 获取缓存统计信息（用于监控）
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const docKeys = await redis.keys(`${this.DOC_STRUCTURE_PREFIX}*`);
      const styleKeys = await redis.keys(`${this.STYLE_PREFIX}*`);

      return {
        totalDocuments: docKeys.length,
        totalStyles: styleKeys.length,
        totalItems: docKeys.length + styleKeys.length,
        limits: {
          documents: 100,
          styles: 50,
        },
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {
        totalDocuments: 0,
        totalStyles: 0,
        totalItems: 0,
        limits: { documents: 100, styles: 50 },
      };
    }
  }
}

// 导出单例
export const blogAICache = new BlogAIRedisCache();
