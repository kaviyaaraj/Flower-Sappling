/**
 * Redis client — graceful degradation.
 *
 * If Redis is not configured or unreachable the client silently becomes a
 * no-op so every other module can call cache helpers without checking
 * whether Redis is available. The app falls back to MongoDB for every
 * read that would otherwise hit the cache.
 *
 * Set REDIS_URL in .env to enable caching:
 *   REDIS_URL=redis://127.0.0.1:6379
 */
const Redis = require("ioredis");

let redisClient = null;
let isConnected = false;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
    try {
        redisClient = new Redis(REDIS_URL, {
            // Do not hammer the server on startup if it is unavailable
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => (times <= 3 ? Math.min(times * 200, 1000) : null),
            lazyConnect: true,
            enableOfflineQueue: false
        });

        redisClient.on("connect", () => {
            isConnected = true;
            console.log("Redis connected:", REDIS_URL);
        });

        redisClient.on("error", (err) => {
            if (isConnected) {
                console.warn("Redis error (falling back to MongoDB):", err.message);
            }
            isConnected = false;
        });

        redisClient.on("close", () => {
            isConnected = false;
        });

        // Attempt the initial connection without blocking startup
        redisClient.connect().catch(() => {
            console.warn("Redis unavailable — running without cache (MongoDB only).");
        });
    } catch (err) {
        console.warn("Redis init failed — running without cache:", err.message);
        redisClient = null;
    }
} else {
    console.log("REDIS_URL not set — running without cache (MongoDB only).");
}

/** True only when a Redis connection is live. */
const isReady = () => isConnected && redisClient !== null;

/**
 * GET a cached string value.
 * Returns null on any error or when Redis is unavailable.
 */
const get = async (key) => {
    if (!isReady()) return null;
    try {
        return await redisClient.get(key);
    } catch {
        return null;
    }
};

/**
 * SET a string value with an optional TTL in seconds.
 * Silently ignores errors when Redis is unavailable.
 */
const set = async (key, value, ttlSeconds = 60) => {
    if (!isReady()) return;
    try {
        await redisClient.set(key, String(value), "EX", ttlSeconds);
    } catch {
        // silent
    }
};

/**
 * DELETE a key (used for cache invalidation).
 * Silently ignores errors when Redis is unavailable.
 */
const del = async (key) => {
    if (!isReady()) return;
    try {
        await redisClient.del(key);
    } catch {
        // silent
    }
};

module.exports = { get, set, del, isReady };
