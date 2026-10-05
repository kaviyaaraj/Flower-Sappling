const express = require("express");
const {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require("../controllers/cartController");

const router = express.Router();

router.post("/", addToCart);
router.get("/:userId", getCart);
router.put("/:userId/items/:productId", updateCartItem);
router.delete("/:userId/items/:productId", removeCartItem);
router.delete("/:userId", clearCart);

module.exports = router;
