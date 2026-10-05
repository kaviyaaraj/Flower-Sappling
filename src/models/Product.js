const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true
        },

        description: {
            type: String
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        originalPrice: {
            type: Number,
            min: 0
        },

        discount: {
            type: Number,
            min: 0,
            max: 100
        },

        image: String,

        rating: {
            type: Number,
            min: 0,
            max: 5
        },

        reviewCount: {
            type: Number,
            min: 0
        },

        plantHeight: String,
        potSize: String,
        sunlight: String,
        waterRequirement: String,
        floweringSeason: String,
        suitableFor: [String],
        difficultyLevel: String,

        category: {
            type: String
        },

        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Keep the established `active` field authoritative while exposing the catalog name.
productSchema.virtual("isActive")
    .get(function () {
        return this.active;
    })
    .set(function (value) {
        this.active = value;
    });

module.exports = mongoose.model("Product", productSchema);