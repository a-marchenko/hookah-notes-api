import Redis from 'ioredis';

export const redis = process.env.REDIS_HOST ? new Redis({ port: 6379, host: process.env.REDIS_HOST }) : new Redis();
