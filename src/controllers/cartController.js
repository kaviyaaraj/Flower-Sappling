const { randomUUID } = require("crypto");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const inventoryCache = require("../services/inventoryCacheService");

const MAX_QUANTITY = 99;

const validId = (value) => typeof value === "string" && value.trim().length > 0;
const validQuantity = (value) => Number.isInteger(value) && value >= 1 && value <= MAX_QUANTITY;

const cartResponse = (cart, inventoryMap = {}) => {
    const items = cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        lineTotal: Number((item.priceSnapshot * item.quantity).toFixed(2)),
        // Live stock from inventory — present only when caller supplies the map
        ...(inventoryMap[item.productId] !== undefined
            ? { availableQuantity: inventoryMap[item.productId] }
            : {})
    }));
    const subtotal = Number(items.reduce((total, item) => total + item.lineTotal, 0).toFixed(2));

    return {
        cartId: cart.cartId,
        userId: cart.userId,
        items,
        subtotal,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
    };
};

const findActiveProduct = async (productId) => {
    const product = await Product.findOne({ productId, active: true });
    return product;
};

const addToCart = async (req, res) => {
    const { userId, productId, quantity } = req.body || {};
    if (!validId(userId) || !validId(productId) || quantity === undefined) {
        return res.status(400).json({ success: false, message: "userId, productId and quantity are required" });
    }
    if (!validQuantity(quantity)) {
        return res.status(400).json({ success: false, message: `Quantity must be an integer between 1 and ${MAX_QUANTITY}` });
    }

    try {
        const product = await findActiveProduct(productId.trim());
        if (!product) {
            return res.status(404).json({ success: false, message: "Active product not found" });
        }

        // ── Inventory check (Redis → MongoDB fallback) ──────────────────────────
        // Cart never decrements availableQuantity (Reservation at Checkout does).
        // We CHECK that cartQty + newQty ≤ availableQty to prevent overselling.
        // Redis caches the count for 30 s — under load this avoids a MongoDB
        // round-trip on every concurrent Add-to-Cart request.
        const availableQuantity = await inventoryCache.getAvailableQuantity(productId.trim());

        // How many units this user already has in their cart for this product
        const existingCart = await Cart.findOne({ userId: userId.trim() });
        const existingItem = existingCart
            ? existingCart.items.find((item) => item.productId === productId.trim())
            : null;
        const alreadyInCart = existingItem ? existingItem.quantity : 0;

        // Total would-be cart quantity for this product
        const totalWanted = alreadyInCart + quantity;

        if (totalWanted > availableQuantity) {
            return res.status(409).json({
                success: false,
                message: availableQuantity === 0
                    ? "This product is out of stock"
                    : `Only ${availableQuantity} unit(s) available. You already have ${alreadyInCart} in your cart.`,
                availableQuantity
            });
        }
        // ── End inventory check ─────────────────────────────────────────────────

        let cart = existingCart;
        if (!cart) {
            try {
                cart = await Cart.create({
                    cartId: `C${randomUUID()}`,
                    userId: userId.trim(),
                    items: []
                });
            } catch (error) {
                if (error.code !== 11000) throw error;
                cart = await Cart.findOne({ userId: userId.trim() });
            }
        }

        const cartItem = cart.items.find((item) => item.productId === product.productId);
        const newQuantity = (cartItem ? cartItem.quantity : 0) + quantity;
        if (newQuantity > MAX_QUANTITY) {
            return res.status(400).json({ success: false, message: `Cart item quantity cannot exceed ${MAX_QUANTITY}` });
        }

        if (cartItem) {
            cartItem.quantity = newQuantity;
        } else {
            cart.items.push({
                productId: product.productId,
                quantity,
                priceSnapshot: product.price,
                originalPriceSnapshot: product.originalPrice,
                discountSnapshot: product.discount
            });
        }
        await cart.save();

        // ── Stock display fix ────────────────────────────────────────────────────
        // Send back "remaining after this cart add" so the frontend shows the
        // correct decremented number immediately (e.g. stock=3, add 1 → shows 2 left).
        // availableQuantity is the DB value; subtracting newQuantity gives what the
        // user can still add before hitting the limit.
        const remainingAfterCart = Math.max(0, availableQuantity - newQuantity);

        // Update Redis so subsequent reads within the TTL window are consistent
        await inventoryCache.setAvailableQuantity(product.productId, remainingAfterCart);

        const inventoryMap = { [product.productId]: remainingAfterCart };

        return res.status(200).json({
            success: true,
            data: cartResponse(cart, inventoryMap)
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getCart = async (req, res) => {
    const { userId } = req.params;
    if (!validId(userId)) {
        return res.status(400).json({ success: false, message: "userId is required" });
    }
    try {
        const cart = await Cart.findOne({ userId: userId.trim() });
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });
        return res.json({ success: true, data: cartResponse(cart) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateCartItem = async (req, res) => {
    const { userId, productId } = req.params;
    const { quantity } = req.body || {};
    if (!validId(userId) || !validId(productId) || quantity === undefined) {
        return res.status(400).json({ success: false, message: "userId, productId and quantity are required" });
    }
    if (!validQuantity(quantity)) {
        return res.status(400).json({ success: false, message: `Quantity must be an integer between 1 and ${MAX_QUANTITY}` });
    }

    try {
        const product = await findActiveProduct(productId.trim());
        if (!product) return res.status(404).json({ success: false, message: "Active product not found" });
        const cart = await Cart.findOne({ userId: userId.trim() });
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });
        const item = cart.items.find((entry) => entry.productId === productId.trim());
        if (!item) return res.status(404).json({ success: false, message: "Cart item not found" });

        item.quantity = quantity;
        await cart.save();
        return res.json({ success: true, data: cartResponse(cart) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const removeCartItem = async (req, res) => {
    const { userId, productId } = req.params;
    if (!validId(userId) || !validId(productId)) {
        return res.status(400).json({ success: false, message: "userId and productId are required" });
    }
    try {
        const cart = await Cart.findOne({ userId: userId.trim() });
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });
        const itemIndex = cart.items.findIndex((entry) => entry.productId === productId.trim());
        if (itemIndex === -1) return res.status(404).json({ success: false, message: "Cart item not found" });
        cart.items.splice(itemIndex, 1);
        await cart.save();
        return res.json({ success: true, data: cartResponse(cart) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const clearCart = async (req, res) => {
    const { userId } = req.params;
    if (!validId(userId)) return res.status(400).json({ success: false, message: "userId is required" });
    try {
        const cart = await Cart.findOne({ userId: userId.trim() });
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });
        cart.items = [];
        await cart.save();
        return res.json({ success: true, data: cartResponse(cart) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { addToCart, getCart, updateCartItem, removeCartItem, clearCart };
