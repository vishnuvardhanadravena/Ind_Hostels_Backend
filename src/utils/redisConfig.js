// const Redis = require('ioredis');
// require('dotenv').config();

// // Redis connection configuration
// const redis = new Redis({
//   host: process.env.REDIS_HOST, // Redis server host
//   port: process.env.REDIS_PORT,        // Redis port
//   // password: process.env.REDIS_PASSWORD, // Secure password from redis.conf
//   retryStrategy: (times) => {
//     // Reconnect after increasing delay, up to 2 seconds
//     return Math.min(times * 50, 2000);
//   },
//   maxRetriesPerRequest: 5, // Limit retries per request
//   enableOfflineQueue: true, // Queue commands while offline
//   connectTimeout: 10000, // 10 seconds timeout
// });

// // Handle connection events
// redis.on('connect', () => {
//   console.log('Connected to Redis');
// });

// redis.on('error', (err) => {
//   // console.error('Redis error:', err);
// });

// module.exports = redis;