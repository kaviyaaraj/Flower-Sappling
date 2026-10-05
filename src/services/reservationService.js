const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Product = require("../models/Product");
const { reserveInventory } = require("./inventoryService");
const inventoryCache = require("./inventoryCacheService");

const createReservation = async ({
    userId,
    productId,
    quantity,
    idempotencyKey
}) => {

    // 1. Check if this request was already processed
    const existingReservation = await Reservation.findOne({
        idempotencyKey
    });

    if (existingReservation) {
        return {
            existing: true,
            reservation: existingReservation
        };
    }

    // 2. Check product
    const product = await Product.findOne({
        productId,
        active: true
    });

    if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
    }

    // 3. Start MongoDB transaction
    const session = await mongoose.startSession();

    try {
        let reservation;

        await session.withTransaction(async () => {

            // Reserve inventory atomically
            const inventory = await reserveInventory(
                productId,
                quantity,
                session
            );

            if (!inventory) {
                throw new Error("OUT_OF_STOCK");
            }

            // Create reservation
            const reservationId =
                "R" + Date.now() + Math.floor(Math.random() * 10000);

            const expiresAt = new Date(
                Date.now() + 5 * 60 * 1000
            );

            const created = await Reservation.create(
                [
                    {
                        reservationId,
                        userId,
                        productId,
                        quantity,
                        status: "RESERVED",
                        idempotencyKey,
                        expiresAt
                    }
                ],
                {
                    session
                }
            );

            reservation = created[0];
        });

        // Invalidate Redis cache for this product — the transaction just
        // decremented availableQuantity in MongoDB via reserveInventory.
        // The next inventory read will fetch the fresh value from the DB.
        await inventoryCache.invalidate(productId);

        return {
            existing: false,
            reservation
        };

    } finally {
        await session.endSession();
    }
};

module.exports = {
    createReservation
};