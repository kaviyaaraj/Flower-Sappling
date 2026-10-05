const express = require("express");
const { getInventory, getBatchInventory } = require("../controllers/inventoryController");

const router = express.Router();

// GET /api/inventory?productIds=p-1,p-2   — batch availability lookup
router.get("/", getBatchInventory);

// GET /api/inventory/:productId           — single product availability
router.get("/:productId", getInventory);

module.exports = router;
