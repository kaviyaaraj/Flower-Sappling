const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        paymentId: { type: String, required: true, unique: true },
        checkoutId: { type: String, required: true, unique: true },
        userId: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ["PENDING", "SUCCESS", "FAILED"],
            default: "PENDING"
        },
        idempotencyKey: { type: String, required: true, unique: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
