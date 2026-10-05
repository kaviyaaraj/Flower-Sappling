const { createCheckout } = require("../services/checkoutService");

const checkoutResponse = (checkout) => ({
    checkoutId: checkout.checkoutId,
    userId: checkout.userId,
    cartId: checkout.cartId,
    items: checkout.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        unitDiscount: item.unitDiscount,
        lineSubtotal: item.lineSubtotal,
        lineDiscount: item.lineDiscount
    })),
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    deliveryFee: checkout.deliveryFee,
    totalAmount: checkout.totalAmount,
    reservationIds: checkout.reservationIds,
    status: checkout.status,
    createdAt: checkout.createdAt,
    updatedAt: checkout.updatedAt
});

const startCheckout = async (req, res) => {
    const { userId, cartId, idempotencyKey } = req.body || {};
    if (![userId, cartId, idempotencyKey].every((value) => typeof value === "string" && value.trim())) {
        return res.status(400).json({ success: false, message: "userId, cartId and idempotencyKey are required" });
    }

    try {
        const result = await createCheckout({
            userId: userId.trim(),
            cartId: cartId.trim(),
            idempotencyKey: idempotencyKey.trim()
        });
        if (result.checkout.status === "FAILED") {
            return res.status(409).json({
                success: false,
                message: "Checkout reservation failed",
                data: checkoutResponse(result.checkout)
            });
        }
        const statusCode = result.existing ? 200 : 201;
        return res.status(statusCode).json({
            success: true,
            data: checkoutResponse(result.checkout),
            ...(result.existing ? { message: "Duplicate request - returning existing checkout" } : {})
        });
    } catch (error) {
        if (error.message === "CART_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }
        if (error.message === "PRODUCT_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Active product not found" });
        }
        if (error.message === "CART_EMPTY") {
            return res.status(400).json({ success: false, message: "Cart must contain at least one item" });
        }
        if (error.message === "DUPLICATE_CART_PRODUCT") {
            return res.status(400).json({ success: false, message: "Cart contains duplicate product lines" });
        }
        if (error.message === "INVALID_CART_QUANTITY" || error.message === "INVALID_CART_PRICE") {
            return res.status(400).json({ success: false, message: "Cart contains invalid item data" });
        }
        if (error.message === "OUT_OF_STOCK") {
            return res.status(409).json({ success: false, message: "Product is out of stock" });
        }

        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { startCheckout };
