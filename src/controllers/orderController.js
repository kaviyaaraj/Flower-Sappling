const { randomUUID } = require("crypto");
const Order = require("../models/Order");

/**
 * GET /api/orders?userId=<userId>
 * Returns all orders for the given userId.
 * Frontend calls: getOrders(userId) → api.get('/orders', { params: { userId } })
 */
const listOrders = async (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string" || !userId.trim()) {
        return res.status(400).json({ success: false, message: "userId query param is required" });
    }

    try {
        const orders = await Order.find({ userId: userId.trim() }).sort({ createdAt: -1 });
        return res.json({
            success: true,
            orders: orders.map((order) => ({
                id: order.orderId,
                orderId: order.orderId,
                date: order.createdAt,
                items: order.items,
                amount: order.totalAmount,
                subtotal: order.subtotal,
                discount: order.discount,
                deliveryFee: order.deliveryFee,
                paymentStatus: order.status === "CREATED" ? "PAID" : order.status,
                status: order.status,
            })),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * POST /api/orders
 * Creates a standalone order (used by the frontend after payment confirmation).
 * Body: { userId, items, subtotal, discount, deliveryFee, totalAmount, paymentId?, checkoutId? }
 */
const createOrder = async (req, res) => {
    const {
        userId,
        items = [],
        subtotal = 0,
        discount = 0,
        deliveryFee = 0,
        totalAmount = 0,
        paymentId,
        checkoutId,
        reservationIds = [],
    } = req.body || {};

    if (!userId || typeof userId !== "string" || !userId.trim()) {
        return res.status(400).json({ success: false, message: "userId is required" });
    }

    // Resolve idempotencyKey from header or generate one
    const idempotencyKey =
        req.headers["idempotency-key"] ||
        req.body?.idempotencyKey ||
        `order-${randomUUID()}`;

    try {
        // Idempotency: return existing order if key already used
        const existing = await Order.findOne({ "metadata.idempotencyKey": idempotencyKey });
        if (existing) {
            return res.status(200).json({
                success: true,
                message: "Duplicate request - returning existing order",
                data: existing,
            });
        }

        const order = await Order.create({
            orderId: `ORD${randomUUID()}`,
            userId: userId.trim(),
            checkoutId: checkoutId || `DIRECT-${randomUUID()}`,
            paymentId: paymentId || `PAY-${randomUUID()}`,
            items: items.map((item) => ({
                productId: item.productId || item.id || "unknown",
                quantity: item.quantity || 1,
                priceSnapshot: item.priceSnapshot || item.price || 0,
                unitDiscount: item.unitDiscount || 0,
                lineSubtotal: item.lineSubtotal || (item.price || 0) * (item.quantity || 1),
                lineDiscount: item.lineDiscount || 0,
            })),
            subtotal: Number(subtotal),
            discount: Number(discount),
            deliveryFee: Number(deliveryFee),
            totalAmount: Number(totalAmount),
            reservationIds,
            status: "CREATED",
        });

        return res.status(201).json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { listOrders, createOrder };
