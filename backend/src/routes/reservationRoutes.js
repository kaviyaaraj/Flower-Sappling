const express = require("express");

const {
    reserveProduct
} = require("../controllers/reservationController");

const router = express.Router();

router.post("/", reserveProduct);

module.exports = router;