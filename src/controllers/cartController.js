const { randomUUID } = require("crypto");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const MAX_QUANTITY = 99;

const validId = (value) => typeof value === "string" && value.trim().length > 0;
const validQuantity = (value) => Number.isInteger(value) && value >= 1 && value <= MAX_QUANTITY;

const cartResponse = (cart) => {
    const items = cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        lineTotal: Number((item.priceSnapshot * item.quantity).toFixed(2))
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

        let cart = await Cart.findOne({ userId: userId.trim() });
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

        const existingItem = cart.items.find((item) => item.productId === product.productId);
        const newQuantity = (existingItem ? existingItem.quantity : 0) + quantity;
        if (newQuantity > MAX_QUANTITY) {
            return res.status(400).json({ success: false, message: `Cart item quantity cannot exceed ${MAX_QUANTITY}` });
        }

        if (existingItem) {
            existingItem.quantity = newQuantity;
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

        return res.status(200).json({ success: true, data: cartResponse(cart) });
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
