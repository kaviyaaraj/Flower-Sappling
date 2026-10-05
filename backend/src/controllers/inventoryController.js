const inventoryCache = require("../services/inventoryCacheService");

/**
 * GET /api/inventory/:productId
 *
 * Returns the live availableQuantity for a single product.
 * Reads from Redis cache first; falls back to MongoDB on a cache miss.
 */
const getInventory = async (req, res) => {
    const { productId } = req.params;
    if (!productId || typeof productId !== "string" || !productId.trim()) {
        return res.status(400).json({ success: false, message: "productId is required" });
    }

    try {
        const availableQuantity = await inventoryCache.getAvailableQuantity(productId.trim());

        return res.json({
            success: true,
            productId: productId.trim(),
            availableQuantity
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * GET /api/inventory
 * Optional query: ?productIds=p-1,p-2,p-3
 *
 * Batch availability lookup — Redis cache for each id, MongoDB for misses.
 * Used by the Products page on load to overlay live stock.
 */
const getBatchInventory = async (req, res) => {
    try {
        const raw = req.query.productIds || "";
        const productIds = raw
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        const result = productIds.length
            ? await inventoryCache.getBatchAvailableQuantity(productIds)
            : await inventoryCache.getBatchAvailableQuantity([]); // handled below

        // If no productIds given, return all from MongoDB (no cache shortcut)
        if (!productIds.length) {
            const Inventory = require("../models/Inventory");
            const all = await Inventory.find({}).select("productId availableQuantity -_id");
            const allResult = {};
            for (const inv of all) {
                allResult[inv.productId] = inv.availableQuantity;
            }
            return res.json({ success: true, inventory: allResult });
        }

        return res.json({ success: true, inventory: result });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { getInventory, getBatchInventory };
