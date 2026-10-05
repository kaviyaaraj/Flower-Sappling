/**
 * inventoryCacheService — thin wrapper around Redis for inventory counts.
 *
 * Key schema:  inventory:stock:<productId>
 * TTL:         30 seconds (short enough to stay fresh, long enough to help under load)
 *
 * Why Redis here?
 * ───────────────
 * Under concurrent Add-to-Cart requests the backend would otherwise fire one
 * MongoDB read per request.  With Redis:
 *
 *   Request A ──┐
 *   Request B ──┤──▶ Redis cache hit ──▶ respond immediately
 *   Request C ──┘        (no MongoDB)
 *
 * Inventory cache is invalidated (deleted) whenever:
 *   • A reservation succeeds  (Checkout step decrements availableQuantity in MongoDB)
 *   • The /api/inventory endpoint is called with a cache-busting flag
 *
 * The cart controller still performs a MongoDB read if the key is absent,
 * so correctness is guaranteed even with an empty or expired cache.
 */
const redis = require("../config/redis");
const Inventory = require("../models/Inventory");

const CACHE_TTL = 30; // seconds
const key = (productId) => `inventory:stock:${productId}`;

/**
 * Get availableQuantity for a product.
 * Checks Redis first; falls back to MongoDB and populates the cache on a miss.
 *
 * @param {string} productId
 * @returns {Promise<number>} availableQuantity (0 if no inventory record exists)
 */
const getAvailableQuantity = async (productId) => {
    // 1. Try Redis
    const cached = await redis.get(key(productId));
    if (cached !== null) {
        return Number(cached);
    }

    // 2. Cache miss — read from MongoDB
    const inventory = await Inventory.findOne({ productId });
    const qty = inventory ? inventory.availableQuantity : 0;

    // 3. Populate cache
    await redis.set(key(productId), qty, CACHE_TTL);

    return qty;
};

/**
 * Update the cache after a successful cart or inventory change.
 * Call this whenever you know the new value (avoids an extra DB round-trip).
 *
 * @param {string} productId
 * @param {number} newQuantity
 */
const setAvailableQuantity = async (productId, newQuantity) => {
    await redis.set(key(productId), newQuantity, CACHE_TTL);
};

/**
 * Invalidate the cache entry for a product.
 * Call this after a reservation (which decrements availableQuantity in MongoDB)
 * so the next read fetches the fresh value from the DB.
 *
 * @param {string} productId
 */
const invalidate = async (productId) => {
    await redis.del(key(productId));
};

/**
 * Batch-get availableQuantity for multiple products.
 * Each miss is fetched from MongoDB and cached individually.
 *
 * @param {string[]} productIds
 * @returns {Promise<{ [productId]: number }>}
 */
const getBatchAvailableQuantity = async (productIds) => {
    const result = {};
    await Promise.all(
        productIds.map(async (productId) => {
            result[productId] = await getAvailableQuantity(productId);
        })
    );
    return result;
};

module.exports = {
    getAvailableQuantity,
    setAvailableQuantity,
    invalidate,
    getBatchAvailableQuantity
};
