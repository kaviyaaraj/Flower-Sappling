const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Product = require("../src/models/Product");
const Inventory = require("../src/models/Inventory");
const Cart = require("../src/models/Cart");
const Checkout = require("../src/models/Checkout");
const Reservation = require("../src/models/Reservation");

dotenv.config();

const apiUrl = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
const suffix = randomUUID().replace(/-/g, "");
const userIds = [`API_CART_${suffix}`, `API_CHECKOUT_${suffix}`, `API_INVALID_${suffix}`, `API_STOCK_${suffix}`, `API_RESERVATION_${suffix}`];
const productIds = [`T${suffix.slice(0, 20)}`, `U${suffix.slice(0, 20)}`, `I${suffix.slice(0, 20)}`, `R${suffix.slice(0, 20)}`];
const reservationKeys = [`api-test-${suffix}-1`, `api-test-${suffix}-2`, `api-test-${suffix}-3`];
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

async function createFixtures() {
    await Product.insertMany(productIds.map((productId, index) => ({
        productId,
        name: `API Test Plant ${index}`,
        description: "Temporary API integration test fixture",
        category: "API Test",
        price: 100,
        originalPrice: 125,
        discount: 20,
        active: true
    })));
    await Inventory.insertMany(productIds.map((productId, index) => ({
        inventoryId: `IT${suffix.slice(0, 18)}${index}`,
        productId,
        availableQuantity: index === 1 ? 0 : 2,
        reservedQuantity: 0,
        soldQuantity: 0,
        version: 0
    })));
}

async function cleanFixtures() {
    await Checkout.deleteMany({ userId: { $in: userIds } });
    await Cart.deleteMany({ userId: { $in: userIds } });
    await Reservation.deleteMany({ userId: { $in: userIds } });
    await Product.deleteMany({ productId: { $in: productIds } });
    await Inventory.deleteMany({ productId: { $in: productIds } });
}

async function run() {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI must be set in .env to run API integration tests");
    await mongoose.connect(process.env.MONGODB_URI);
    await createFixtures();

    try {
        const productList = await request("/api/products");
        assertStatus(productList, 200);
        assert(productList.body.data.products.some((product) => product.productId === "P1001"));
        const searchedProducts = await request("/api/products?search=API%20Test&category=API%20Test&sort=price&order=desc");
        assertStatus(searchedProducts, 200);
        assert(searchedProducts.body.data.products.some((product) => product.productId === productIds[0]));

        const productDetail = await request("/api/products/P1001");
        assertStatus(productDetail, 200);
        assert.equal(productDetail.body.data.product.productId, "P1001");
        assert(Number.isInteger(productDetail.body.data.inventory.availableQuantity));

        assertStatus(await request("/api/cart", "POST", { userId: userIds[0], productId: "P1001", quantity: 0 }), 400);
        assertStatus(await request("/api/cart", "POST", { userId: userIds[0], productId: "P1001", quantity: 100 }), 400);
        assertStatus(await request("/api/cart", "POST", { userId: userIds[0], productId: "MISSING", quantity: 1 }), 404);
        assertStatus(await request("/api/cart", "POST", { userId: userIds[0], productId: "P1001", quantity: 1 }), 200);
        const cartRead = await request(`/api/cart/${userIds[0]}`);
        assertStatus(cartRead, 200);
        assert.equal(cartRead.body.data.items[0].quantity, 1);
        assertStatus(await request(`/api/cart/${userIds[0]}/items/P1001`, "PUT", { quantity: 2 }), 200);
        assertStatus(await request(`/api/cart/${userIds[0]}/items/P1001`, "PUT", { quantity: 0 }), 400);
        assertStatus(await request(`/api/cart/${userIds[0]}/items/P1001`, "DELETE"), 200);
        assertStatus(await request("/api/cart", "POST", { userId: userIds[0], productId: "P1001", quantity: 1 }), 200);
        assertStatus(await request(`/api/cart/${userIds[0]}`, "DELETE"), 200);

        assertStatus(await request("/api/checkout", "POST", {}), 400);
        assertStatus(await request("/api/checkout", "POST", { userId: userIds[1], cartId: "missing", idempotencyKey: `missing-${suffix}` }), 404);
        assertStatus(await request("/api/cart", "POST", { userId: userIds[1], productId: productIds[0], quantity: 1 }), 200);
        const checkoutCart = await request(`/api/cart/${userIds[1]}`);
        const checkoutBody = { userId: userIds[1], cartId: checkoutCart.body.data.cartId, idempotencyKey: `checkout-${suffix}` };
        const firstCheckout = await request("/api/checkout", "POST", checkoutBody);
        assertStatus(firstCheckout, 201);
        assert.equal(firstCheckout.body.data.status, "PAYMENT_PENDING");
        assert.equal(firstCheckout.body.data.reservationIds.length, 1);
        const stockAfterFirst = await Inventory.findOne({ productId: productIds[0] });
        assert.equal(stockAfterFirst.availableQuantity, 1);
        const duplicateCheckout = await request("/api/checkout", "POST", checkoutBody);
        assertStatus(duplicateCheckout, 200);
        assert.deepEqual(duplicateCheckout.body.data.reservationIds, firstCheckout.body.data.reservationIds);
        assert.equal((await Inventory.findOne({ productId: productIds[0] })).availableQuantity, 1);

        assertStatus(await request("/api/cart", "POST", { userId: userIds[2], productId: productIds[2], quantity: 1 }), 200);
        await Product.updateOne({ productId: productIds[2] }, { $set: { active: false } });
        const invalidCart = await request(`/api/cart/${userIds[2]}`);
        assertStatus(await request("/api/checkout", "POST", { userId: userIds[2], cartId: invalidCart.body.data.cartId, idempotencyKey: `invalid-${suffix}` }), 404);

        assertStatus(await request("/api/cart", "POST", { userId: userIds[3], productId: productIds[1], quantity: 1 }), 200);
        const noStockCart = await request(`/api/cart/${userIds[3]}`);
        const noStockBody = { userId: userIds[3], cartId: noStockCart.body.data.cartId, idempotencyKey: `outofstock-${suffix}` };
        assertStatus(await request("/api/checkout", "POST", noStockBody), 409);
        assert.equal((await Inventory.findOne({ productId: productIds[1] })).availableQuantity, 0);

        const reservationBody = { userId: userIds[4], productId: productIds[3], quantity: 1, idempotencyKey: reservationKeys[0] };
        const firstReservation = await request("/api/reservations", "POST", reservationBody);
        assertStatus(firstReservation, 201);
        const duplicateReservation = await request("/api/reservations", "POST", reservationBody);
        assertStatus(duplicateReservation, 200);
        assert.equal(duplicateReservation.body.reservationId, firstReservation.body.reservationId);
        assertStatus(await request("/api/reservations", "POST", { ...reservationBody, idempotencyKey: reservationKeys[1] }), 201);
        assertStatus(await request("/api/reservations", "POST", { ...reservationBody, idempotencyKey: reservationKeys[2] }), 409);
        assertStatus(await request("/api/reservations", "POST", { userId: userIds[4] }), 400);
        const reservedInventory = await Inventory.findOne({ productId: productIds[3] });
        assert(reservedInventory.availableQuantity >= 0);
        assert.equal(reservedInventory.availableQuantity, 0);

        console.log("API integration tests passed: products, cart, checkout idempotency, inventory conflict, and reservation regression.");
    } finally {
        await cleanFixtures();
        await mongoose.disconnect();
    }
}

run().catch((error) => {
    console.error("API integration tests failed:", error.message);
    process.exitCode = 1;
});
