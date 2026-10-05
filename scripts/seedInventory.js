const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Product = require("../src/models/Product");
const Inventory = require("../src/models/Inventory");

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected");

        const product = await Product.findOneAndUpdate(
            { productId: "P1001" },
            {
                $setOnInsert: {
                    productId: "P1001",
                    name: "Flash Sale Product",
                    description: "SALESTORM limited stock product",
                    price: 999,
                    category: "Electronics",
                    active: true
                }
            },
            { new: true, upsert: true, runValidators: true }
        );

        await Inventory.findOneAndUpdate(
            { productId: product.productId },
            {
                $setOnInsert: {
                    inventoryId: "I1001",
                    productId: product.productId,
                    availableQuantity: 100,
                    reservedQuantity: 0,
                    soldQuantity: 0,
                    version: 0
                }
            },
            { new: true, upsert: true, runValidators: true }
        );

        console.log("Product created:", product.productId);
        console.log("Inventory created with 100 units");

    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

seed();