const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const { toPublicProduct } = require("../utils/productView");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listProducts = async (req, res) => {
    try {
        const filter = { active: true };
        const search = String(req.query.search || req.query.q || "").trim();
        const category = String(req.query.category || "").trim();

        if (search) {
            const term = new RegExp(escapeRegex(search), "i");
            filter.$or = [{ name: term }, { category: term }];
        }
        if (category) {
            filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
        }

        const allowedSorts = new Set(["name", "price", "rating", "createdAt"]);
        const requestedSort = String(req.query.sort || "createdAt");
        const sortBy = allowedSorts.has(requestedSort) ? requestedSort : "createdAt";
        const sortOrder = String(req.query.order || "asc").toLowerCase() === "desc" ? -1 : 1;
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
        const skip = Math.max(Number.parseInt(req.query.skip, 10) || 0, 0);

        const products = await Product.find(filter)
            .sort({ [sortBy]: sortOrder, productId: 1 })
            .skip(skip)
            .limit(limit);

        return res.json({
            success: true,
            products: products.map(toPublicProduct),
            limit,
            skip
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.productId, active: true });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const inventory = await Inventory.findOne({ productId: product.productId }).select("availableQuantity -_id");
        const publicProduct = toPublicProduct(product);
        // Merge stock so the frontend can use product.stock directly
        publicProduct.stock = inventory ? inventory.availableQuantity : 0;

        return res.json({
            success: true,
            product: publicProduct
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { listProducts, getProduct };
