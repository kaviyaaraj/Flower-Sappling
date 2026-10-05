const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1, max: 99 },
        priceSnapshot: { type: Number, required: true, min: 0 },
        originalPriceSnapshot: { type: Number, min: 0 },
        discountSnapshot: { type: Number, min: 0, max: 100 }
    },
    { _id: false }
);

const cartSchema = new mongoose.Schema(
    {
        cartId: { type: String, required: true, unique: true },
        userId: { type: String, required: true, unique: true },
        items: { type: [cartItemSchema], default: [] }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
