const mongoose = require("mongoose");

const checkoutItemSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        priceSnapshot: { type: Number, required: true, min: 0 },
        unitDiscount: { type: Number, required: true, min: 0 },
        lineSubtotal: { type: Number, required: true, min: 0 },
        lineDiscount: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const checkoutSchema = new mongoose.Schema(
    {
        checkoutId: { type: String, required: true, unique: true },
        userId: { type: String, required: true },
        cartId: { type: String, required: true },
        items: { type: [checkoutItemSchema], required: true },
        subtotal: { type: Number, required: true, min: 0 },
        discount: { type: Number, required: true, min: 0 },
        deliveryFee: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        reservationIds: { type: [String], default: [] },
        status: {
            type: String,
            enum: ["CREATED", "RESERVATION_PENDING", "RESERVED", "PAYMENT_PENDING", "FAILED", "EXPIRED", "COMPLETED"],
            default: "CREATED"
        },
        idempotencyKey: { type: String, required: true }
    },
    { timestamps: true }
);

checkoutSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model("Checkout", checkoutSchema);
