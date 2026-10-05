const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
    {
        reservationId: {
            type: String,
            required: true,
            unique: true
        },

        userId: {
            type: String,
            required: true
        },

        productId: {
            type: String,
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: [
                "RESERVED",
                "PAYMENT_PENDING",
                "CONFIRMED",
                "RELEASED",
                "EXPIRED",
                "PAYMENT_FAILED"
            ],
            default: "RESERVED"
        },

        idempotencyKey: {
            type: String,
            required: true,
            unique: true
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Reservation", reservationSchema);