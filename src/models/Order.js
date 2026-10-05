const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
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

const orderSchema = new mongoose.Schema(
    {
        orderId: { type: String, required: true, unique: true },
        userId: { type: String, required: true },
        checkoutId: { type: String, required: true },
        paymentId: { type: String, required: true },
        items: { type: [orderItemSchema], required: true },
        subtotal: { type: Number, required: true, min: 0 },
        discount: { type: Number, required: true, min: 0 },
        deliveryFee: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        reservationIds: { type: [String], default: [] },
        status: {
            type: String,
            enum: ["CREATED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
            default: "CREATED"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
