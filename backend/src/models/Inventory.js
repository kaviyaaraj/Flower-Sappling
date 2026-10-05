const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
        inventoryId: {
            type: String,
            required: true,
            unique: true
        },

        productId: {
            type: String,
            required: true,
            unique: true
        },

        availableQuantity: {
            type: Number,
            required: true,
            min: 0
        },

        reservedQuantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        soldQuantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        version: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Inventory", inventorySchema);