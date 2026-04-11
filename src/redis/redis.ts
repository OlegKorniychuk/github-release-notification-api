import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('Redis url is missing');

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});
