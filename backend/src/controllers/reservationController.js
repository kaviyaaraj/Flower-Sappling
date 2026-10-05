const { createReservation } = require("../services/reservationService");

const reserveProduct = async (req, res) => {
    try {
        const {
            userId,
            productId,
            quantity,
            idempotencyKey: bodyKey
        } = req.body || {};

        // Frontend sends idempotencyKey as a header; fall back to body if header is absent
        const idempotencyKey = req.headers["idempotency-key"] || bodyKey;

        // Validation
        if (!userId || !productId || !quantity || !idempotencyKey) {
            return res.status(400).json({
                success: false,
                message: "userId, productId, quantity and idempotencyKey are required"
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive integer"
            });
        }

        const result = await createReservation({
            userId,
            productId,
            quantity,
            idempotencyKey
        });

        if (result.existing) {
            return res.status(200).json({
                success: true,
                message: "Duplicate request - returning existing reservation",
                reservationId: result.reservation.reservationId,
                status: result.reservation.status
            });
        }

        return res.status(201).json({
            success: true,
            reservationId: result.reservation.reservationId,
            status: result.reservation.status,
            expiresAt: result.reservation.expiresAt
        });

    } catch (error) {

        if (error.message === "PRODUCT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (error.message === "OUT_OF_STOCK") {
            return res.status(409).json({
                success: false,
                message: "Product is out of stock"
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    reserveProduct
};