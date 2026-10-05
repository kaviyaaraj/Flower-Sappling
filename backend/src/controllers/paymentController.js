const { randomUUID } = require("crypto");
const Checkout = require("../models/Checkout");
const Reservation = require("../models/Reservation");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

/**
 * Handles two payment flows:
 *
 * 1. Full checkout flow (from the backend checkout pipeline):
 *    Body: { checkoutId, idempotencyKey, success? }
 *
 * 2. Direct payment flow (from the frontend Payment page):
 *    Body: { orderId, amount, paymentMethod, status, idempotencyKey? }
 *    The frontend sends idempotencyKey as the `Idempotency-Key` header.
 */
const processPayment = async (req, res) => {
    // Resolve idempotencyKey from header OR body
    const idempotencyKey =
        req.headers["idempotency-key"] ||
        req.body?.idempotencyKey ||
        `direct-${randomUUID()}`;

    const {
        checkoutId,
        success = true,
        // Direct-payment fields sent by the frontend
        orderId: clientOrderId,
        amount,
        paymentMethod,
        status: clientStatus,
    } = req.body || {};

    // ── Direct payment flow (no checkoutId) ──────────────────────────────
    if (!checkoutId) {
        if (!amount) {
            return res.status(400).json({
                success: false,
                message: "amount is required for direct payment",
            });
        }

        try {
            // Idempotency: return existing payment if key already used
            let payment = await Payment.findOne({ idempotencyKey });
            if (payment) {
                return res.status(200).json({
                    success: true,
                    message: "Duplicate request - returning existing payment",
                    data: { payment },
                });
            }

            const paymentStatus =
                clientStatus === "SUCCESS" || success ? "SUCCESS" : "FAILED";

            payment = await Payment.create({
                paymentId: `PAY${randomUUID()}`,
                checkoutId: clientOrderId || `DIRECT-${randomUUID()}`,
                userId: req.body?.userId || "guest",
                amount: Number(amount),
                status: paymentStatus,
                idempotencyKey,
                paymentMethod: paymentMethod || "card",
            });

            // Create a lightweight order record for the direct flow
            const order = await Order.create({
                orderId: `ORD${randomUUID()}`,
                userId: req.body?.userId || "guest",
                checkoutId: payment.checkoutId,
                paymentId: payment.paymentId,
                items: req.body?.items || [],
                subtotal: Number(amount),
                discount: 0,
                deliveryFee: 0,
                totalAmount: Number(amount),
                reservationIds: [],
                status: "CREATED",
            });

            return res.status(201).json({
                success: true,
                data: { payment, order },
            });
        } catch (error) {
            if (error.code === 11000) {
                const existing = await Payment.findOne({ idempotencyKey });
                if (existing) {
                    return res.status(200).json({
                        success: true,
                        message: "Duplicate request - returning existing payment",
                        data: { payment: existing },
                    });
                }
            }
            console.error("Direct payment error:", error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // ── Checkout-based payment flow ───────────────────────────────────────
    if (!idempotencyKey) {
        return res.status(400).json({
            success: false,
            message: "checkoutId and idempotencyKey are required",
        });
    }

    try {
        let payment = await Payment.findOne({ idempotencyKey });

        if (payment) {
            return res.status(200).json({
                success: true,
                message: "Duplicate request - returning existing payment",
                data: payment,
            });
        }

        const checkout = await Checkout.findOne({ checkoutId });
        if (!checkout) {
            return res.status(404).json({ success: false, message: "Checkout not found" });
        }

        if (checkout.status !== "PAYMENT_PENDING") {
            return res.status(400).json({
                success: false,
                message: `Checkout is in invalid status: ${checkout.status}`,
            });
        }

        payment = await Payment.create({
            paymentId: `PAY${randomUUID()}`,
            checkoutId: checkout.checkoutId,
            userId: checkout.userId,
            amount: checkout.totalAmount,
            status: success ? "SUCCESS" : "FAILED",
            idempotencyKey,
        });

        if (success) {
            checkout.status = "COMPLETED";
            await checkout.save();

            await Reservation.updateMany(
                { reservationId: { $in: checkout.reservationIds } },
                { $set: { status: "CONFIRMED" } }
            );

            const order = await Order.create({
                orderId: `ORD${randomUUID()}`,
                userId: checkout.userId,
                checkoutId: checkout.checkoutId,
                paymentId: payment.paymentId,
                items: checkout.items,
                subtotal: checkout.subtotal,
                discount: checkout.discount,
                deliveryFee: checkout.deliveryFee,
                totalAmount: checkout.totalAmount,
                reservationIds: checkout.reservationIds,
                status: "CREATED",
            });

            // Empty the cart
            const cart = await Cart.findOne({ cartId: checkout.cartId });
            if (cart) {
                cart.items = [];
                cart.totalAmount = 0;
                await cart.save();
            }

            return res.status(201).json({
                success: true,
                data: { payment, order },
            });
        } else {
            checkout.status = "FAILED";
            await checkout.save();

            await Reservation.updateMany(
                { reservationId: { $in: checkout.reservationIds } },
                { $set: { status: "PAYMENT_FAILED" } }
            );

            return res.status(400).json({
                success: false,
                message: "Payment failed",
                data: { payment },
            });
        }
    } catch (error) {
        if (error.code === 11000) {
            const existingPayment = await Payment.findOne({ idempotencyKey });
            if (existingPayment) {
                return res.status(200).json({
                    success: true,
                    message: "Duplicate request - returning existing payment",
                    data: existingPayment,
                });
            }
        }
        console.error("Payment processing error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { processPayment };
