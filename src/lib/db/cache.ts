import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const cache = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

const DEFAULT_TTL = 300; // 5 minutes

export async function getCachedOrFetch<T>(
  key: string,
  fetch: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  if (!cache) return fetch();

  const cached = await cache.get<T>(key);
  if (cached !== null) return cached;

  const data = await fetch();
  await cache.setex(key, ttl, data);
  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (!cache) return;
  const keys = await cache.keys(pattern);
  if (keys.length > 0) await cache.del(...keys);
}

export async function invalidateCacheKey(key: string): Promise<void> {
  if (!cache) return;
  await cache.del(key);
}
