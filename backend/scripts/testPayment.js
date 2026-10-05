const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Product = require("../src/models/Product");
const Inventory = require("../src/models/Inventory");
const Cart = require("../src/models/Cart");
const Checkout = require("../src/models/Checkout");
const Reservation = require("../src/models/Reservation");
const Payment = require("../src/models/Payment");
const Order = require("../src/models/Order");

dotenv.config();

const apiUrl = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
const suffix = randomUUID().replace(/-/g, "");
const userId = `API_PAYMENT_${suffix}`;
const productId = `T${suffix.slice(0, 20)}`;

const assertStatus = (response, expected) => assert.equal(response.status, expected, `${response.method} ${response.url} expected ${expected}, received ${response.status}: ${JSON.stringify(response.body)}`);

async function request(path, method = "GET", body) {
    const response = await fetch(`${apiUrl}${path}`, {
        method,
        headers: body === undefined ? {} : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const json = await response.json();
    return { status: response.status, body: json, method, url: path };
}

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    await Product.create({
        productId,
        name: `API Test Plant Payment`,
        price: 100,
        originalPrice: 125,
        discount: 20,
        active: true
    });
    await Inventory.create({
        inventoryId: `IT${suffix.slice(0, 18)}`,
        productId,
        availableQuantity: 10,
        reservedQuantity: 0,
        soldQuantity: 0,
        version: 0
    });

    try {
        // Step 1: Add to cart
        assertStatus(await request("/api/cart", "POST", { userId, productId, quantity: 2 }), 200);
        const cartRead = await request(`/api/cart/${userId}`);
        const cartId = cartRead.body.data.cartId;

        // Step 2: Checkout
        const checkoutBody = { userId, cartId, idempotencyKey: `checkout-${suffix}` };
        const checkoutResp = await request("/api/checkout", "POST", checkoutBody);
        assertStatus(checkoutResp, 201);
        const checkoutId = checkoutResp.body.data.checkoutId;

        // Step 3: Failed Payment Test
        const failedPaymentResp = await request("/api/payments", "POST", {
            checkoutId,
            idempotencyKey: `payfail-${suffix}`,
            success: false
        });
        assertStatus(failedPaymentResp, 400);
        assert.equal(failedPaymentResp.body.success, false);

        // Verify checkout status is FAILED
        let checkoutDoc = await Checkout.findOne({ checkoutId });
        assert.equal(checkoutDoc.status, "FAILED");

        // We need a new checkout because the old one failed
        const newCheckoutResp = await request("/api/checkout", "POST", { userId, cartId, idempotencyKey: `checkout2-${suffix}` });
        assertStatus(newCheckoutResp, 201);
        const newCheckoutId = newCheckoutResp.body.data.checkoutId;

        // Step 4: Successful Payment Test
        const successPaymentResp = await request("/api/payments", "POST", {
            checkoutId: newCheckoutId,
            idempotencyKey: `paysuccess-${suffix}`,
            success: true
        });
        assertStatus(successPaymentResp, 201);
        assert.equal(successPaymentResp.body.success, true);
        assert(successPaymentResp.body.data.payment);
        assert(successPaymentResp.body.data.order);

        // Step 5: Database Verifications
        const paymentDoc = await Payment.findOne({ checkoutId: newCheckoutId });
        assert.ok(paymentDoc);
        assert.equal(paymentDoc.status, "SUCCESS");

        const orderDoc = await Order.findOne({ checkoutId: newCheckoutId });
        assert.ok(orderDoc);
        assert.equal(orderDoc.status, "CREATED");

        checkoutDoc = await Checkout.findOne({ checkoutId: newCheckoutId });
        assert.equal(checkoutDoc.status, "COMPLETED");

        const reservations = await Reservation.find({ reservationId: { $in: checkoutDoc.reservationIds } });
        for (const res of reservations) {
            assert.equal(res.status, "CONFIRMED");
        }

        console.log("Payment and Order flows tested successfully.");
    } finally {
        await Checkout.deleteMany({ userId });
        await Cart.deleteMany({ userId });
        await Reservation.deleteMany({ userId });
        await Product.deleteMany({ productId });
        await Inventory.deleteMany({ productId });
        await Payment.deleteMany({ userId });
        await Order.deleteMany({ userId });
        await mongoose.disconnect();
    }
}

run().catch(console.error);
