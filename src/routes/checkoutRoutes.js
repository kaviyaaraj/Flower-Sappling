const express = require("express");
const { startCheckout } = require("../controllers/checkoutController");

const router = express.Router();

router.post("/", startCheckout);

module.exports = router;
