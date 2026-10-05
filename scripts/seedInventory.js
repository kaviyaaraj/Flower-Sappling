const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Product = require("../src/models/Product");
const Inventory = require("../src/models/Inventory");

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected");

        await Product.deleteMany({});
        await Inventory.deleteMany({});

        const product = await Product.create({
            productId: "P1001",
            name: "Flash Sale Product",
            description: "SALESTORM limited stock product",
            price: 999,
            category: "Electronics",
            active: true
        });

        await Inventory.create({
            inventoryId: "I1001",
            productId: product.productId,
            availableQuantity: 100,
            reservedQuantity: 0,
            soldQuantity: 0,
            version: 0
        });

        console.log("Product created:", product.productId);
        console.log("Inventory created with 100 units");

        await mongoose.connection.close();

    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
};

seed();