const express = require("express");
const { listOrders, createOrder } = require("../controllers/orderController");

const router = express.Router();

// GET /api/orders?userId=<userId>   — fetch orders for a user
router.get("/", listOrders);

// POST /api/orders                  — create an order directly (frontend post-payment flow)
router.post("/", createOrder);

module.exports = router;
