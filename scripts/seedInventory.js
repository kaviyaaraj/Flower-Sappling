/**
 * Seed script: populates Products and Inventory collections with the 20 flower
 * saplings that match the frontend mock data.
 *
 * Usage:  npm run seed:inventory
 */
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const Product = require("../src/models/Product");
const Inventory = require("../src/models/Inventory");

dotenv.config();

// Mirror of frontend/src/data/mockData.js – productId uses the same "p-N" format
// the frontend uses as product.id so reservations, cart and orders all align.
const flowerSaplings = [
    { productId: "p-1",  name: "Royal Rose Sapling",        category: "Rose",          price: 399,  originalPrice: 599,  discount: 33, rating: 4.9, reviewCount: 324, stock: 7,  image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=80", description: "Fragrant rose sapling with deep pink blooms and a long flowering season for balconies and gardens.", plantHeight: "30-45cm", sunlight: "Full sun", waterRequirement: "Moderate", floweringSeason: "Spring-Summer", difficultyLevel: "Easy" },
    { productId: "p-2",  name: "Jasmine Delight",           category: "Jasmine",       price: 299,  originalPrice: 499,  discount: 40, rating: 4.8, reviewCount: 182, stock: 12, image: "https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=900&q=80", description: "Delicate jasmine buds that fill the air with a sweet fragrance and thrive in warm sunny spots.", plantHeight: "20-35cm", sunlight: "Full sun", waterRequirement: "Low", floweringSeason: "Summer", difficultyLevel: "Easy" },
    { productId: "p-3",  name: "Sunburst Sunflower",        category: "Sunflower",     price: 349,  originalPrice: 549,  discount: 36, rating: 4.7, reviewCount: 142, stock: 3,  image: "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?auto=format&fit=crop&w=900&q=80", description: "Bright and cheerful sunflower saplings that bring warmth and energy to open gardens and patios.", plantHeight: "60-90cm", sunlight: "Full sun", waterRequirement: "Moderate", floweringSeason: "Summer", difficultyLevel: "Easy" },
    { productId: "p-4",  name: "Bougainvillea Bloom",       category: "Bougainvillea", price: 449,  originalPrice: 699,  discount: 36, rating: 4.6, reviewCount: 94,  stock: 0,  image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80", description: "Low-maintenance bougainvillea for vibrant wall coverage and colorful seasonal flowering.", plantHeight: "50-80cm", sunlight: "Full sun", waterRequirement: "Low", floweringSeason: "Year-round", difficultyLevel: "Moderate" },
    { productId: "p-5",  name: "Orchid Glow",               category: "Orchid",        price: 599,  originalPrice: 899,  discount: 33, rating: 4.9, reviewCount: 286, stock: 9,  image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=80", description: "Elegant orchid saplings with exotic blooms and a refined look for indoor gardening and gifting.", plantHeight: "25-40cm", sunlight: "Indirect", waterRequirement: "Low", floweringSeason: "Winter-Spring", difficultyLevel: "Moderate" },
    { productId: "p-6",  name: "Marigold Magic",            category: "Marigold",      price: 249,  originalPrice: 399,  discount: 38, rating: 4.5, reviewCount: 520, stock: 18, image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80", description: "Bright marigold saplings designed for cheerful balcony gardens and festive flower arrangements.", plantHeight: "20-30cm", sunlight: "Full sun", waterRequirement: "Low", floweringSeason: "Year-round", difficultyLevel: "Easy" },
    { productId: "p-7",  name: "Lavender Bloom",            category: "Lavender",      price: 499,  originalPrice: 699,  discount: 29, rating: 4.9, reviewCount: 203, stock: 5,  image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=80", description: "Soft lavender blooms with a calming fragrance, perfect for peaceful patios and garden corners.", plantHeight: "30-50cm", sunlight: "Full sun", waterRequirement: "Low", floweringSeason: "Summer", difficultyLevel: "Easy" },
    { productId: "p-8",  name: "Lily Spring",               category: "Lily",          price: 399,  originalPrice: 599,  discount: 33, rating: 4.4, reviewCount: 87,  stock: 24, image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80", description: "Elegant lily saplings with graceful blooms and easy-care foliage for home gardening.", plantHeight: "40-60cm", sunlight: "Partial shade", waterRequirement: "Moderate", floweringSeason: "Spring", difficultyLevel: "Easy" },
    { productId: "p-9",  name: "Peach Garden Rose",         category: "Rose",          price: 429,  originalPrice: 649,  discount: 34, rating: 4.8, reviewCount: 156, stock: 14, image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80", description: "A soft peach rose variety with repeat blooms, ideal for sunny patios and garden borders.", plantHeight: "35-50cm", sunlight: "Full sun", waterRequirement: "Moderate", floweringSeason: "Spring-Summer", difficultyLevel: "Easy" },
    { productId: "p-10", name: "Red Hibiscus Plant",        category: "Hibiscus",      price: 329,  originalPrice: 479,  discount: 31, rating: 4.7, reviewCount: 218, stock: 21, image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80", description: "Tropical hibiscus with vivid red flowers that brings a lush, colorful look to warm outdoor spaces.", plantHeight: "45-70cm", sunlight: "Full sun", waterRequirement: "Moderate", floweringSeason: "Summer", difficultyLevel: "Easy" },
    { productId: "p-11", name: "White Gardenia",            category: "Gardenia",      price: 449,  originalPrice: 649,  discount: 31, rating: 4.8, reviewCount: 117, stock: 8,  image: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=900&q=80", description: "Glossy green leaves and fragrant white flowers make this gardenia a lovely patio addition.", plantHeight: "30-50cm", sunlight: "Partial shade", waterRequirement: "Moderate", floweringSeason: "Summer", difficultyLevel: "Moderate" },
    { productId: "p-12", name: "Dahlia Festival Mix",       category: "Dahlia",        price: 379,  originalPrice: 549,  discount: 31, rating: 4.6, reviewCount: 93,  stock: 17, image: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=900&q=80", description: "A colorful dahlia mix selected for generous blooms in containers, borders, and sunny gardens.", plantHeight: "40-60cm", sunlight: "Full sun", waterRequirement: "Moderate", floweringSeason: "Summer-Autumn", difficultyLevel: "Moderate" },
    { productId: "p-13", name: "Pink Chrysanthemum",        category: "Chrysanthemum", price: 279,  originalPrice: 429,  discount: 35, rating: 4.5, reviewCount: 141, stock: 26, image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80", description: "Compact pink chrysanthemums bring clusters of cheerful color to balcony pots and flower beds.", plantHeight: "25-40cm", sunlight: "Full sun", waterRequirement: "Moderate", floweringSeason: "Autumn", difficultyLevel: "Easy" },
    { productId: "p-14", name: "Ixora Coral Flame",         category: "Ixora",         price: 349,  originalPrice: 499,  discount: 30, rating: 4.6, reviewCount: 76,  stock: 11, image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80", description: "A sun-loving flowering shrub with bright coral clusters and attractive evergreen foliage.", plantHeight: "30-50cm", sunlight: "Full sun", waterRequirement: "Moderate", floweringSeason: "Year-round", difficultyLevel: "Easy" },
    { productId: "p-15", name: "Blue Hydrangea",            category: "Hydrangea",     price: 699,  originalPrice: 899,  discount: 22, rating: 4.9, reviewCount: 188, stock: 6,  image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=900&q=80", description: "Big, soft-blue hydrangea flower heads make a beautiful statement in shaded garden corners.", plantHeight: "45-70cm", sunlight: "Partial shade", waterRequirement: "High", floweringSeason: "Spring-Summer", difficultyLevel: "Moderate" },
    { productId: "p-16", name: "Periwinkle Groundcover",    category: "Periwinkle",    price: 199,  originalPrice: 299,  discount: 33, rating: 4.4, reviewCount: 204, stock: 32, image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80", description: "A hardy, low-growing flowering plant for edging, hanging baskets, and sunny garden spaces.", plantHeight: "10-20cm", sunlight: "Full sun", waterRequirement: "Low", floweringSeason: "Year-round", difficultyLevel: "Easy" },
    { productId: "p-17", name: "Star Jasmine Climber",      category: "Jasmine",       price: 379,  originalPrice: 549,  discount: 31, rating: 4.7, reviewCount: 129, stock: 13, image: "https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=900&q=80", description: "A graceful jasmine climber with star-shaped blooms for trellises, railings, and sunny walls.", plantHeight: "50-100cm", sunlight: "Full sun", waterRequirement: "Low", floweringSeason: "Spring", difficultyLevel: "Easy" },
    { productId: "p-18", name: "Golden Marigold Pair",      category: "Marigold",      price: 299,  originalPrice: 399,  discount: 25, rating: 4.6, reviewCount: 267, stock: 28, image: "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?auto=format&fit=crop&w=900&q=80", description: "Two golden marigold saplings for instant color in patio planters, borders, and sunny balconies.", plantHeight: "20-30cm", sunlight: "Full sun", waterRequirement: "Low", floweringSeason: "Year-round", difficultyLevel: "Easy" },
    { productId: "p-19", name: "White Peace Lily",          category: "Lily",          price: 549,  originalPrice: 749,  discount: 27, rating: 4.8, reviewCount: 315, stock: 10, image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80", description: "Elegant white spathes and deep green leaves bring a calm, polished look to bright indoor spaces.", plantHeight: "30-50cm", sunlight: "Indirect", waterRequirement: "Moderate", floweringSeason: "Spring", difficultyLevel: "Easy" },
    { productId: "p-20", name: "Mixed Balcony Bloom Box",   category: "Mixed Flowers", price: 899,  originalPrice: 1199, discount: 25, rating: 4.9, reviewCount: 102, stock: 4,  image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80", description: "A curated set of flowering saplings selected to bring a colorful, layered look to balcony gardens.", plantHeight: "Various", sunlight: "Full sun", waterRequirement: "Moderate", floweringSeason: "Year-round", difficultyLevel: "Easy" },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected");

        for (const sapling of flowerSaplings) {
            const { stock, ...productFields } = sapling;

            // Upsert product
            const product = await Product.findOneAndUpdate(
                { productId: sapling.productId },
                { $set: productFields },
                { new: true, upsert: true, runValidators: true }
            );

            // Upsert inventory (only set quantity on insert to avoid overwriting live stock)
            await Inventory.findOneAndUpdate(
                { productId: product.productId },
                {
                    $setOnInsert: {
                        inventoryId: `INV-${randomUUID()}`,
                        productId: product.productId,
                        availableQuantity: stock,
                        reservedQuantity: 0,
                        soldQuantity: 0,
                        version: 0,
                    },
                },
                { new: true, upsert: true, runValidators: true }
            );

            console.log(`✓ ${product.productId}  ${product.name}  (stock: ${stock})`);
        }

        console.log(`\nSeeded ${flowerSaplings.length} flower saplings successfully.`);
    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

seed();