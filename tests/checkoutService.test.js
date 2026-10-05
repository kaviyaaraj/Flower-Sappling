const test = require("node:test");
const assert = require("node:assert/strict");
const { getCheckoutAmounts, reservationKeyFor } = require("../src/services/checkoutService");
const Product = require("../src/models/Product");

test("checkout amounts apply line discounts and free-delivery threshold", () => {
    assert.deepEqual(getCheckoutAmounts([
        { lineSubtotal: 1200, lineDiscount: 200 }
    ]), {
        subtotal: 1200,
        discount: 200,
        deliveryFee: 0,
        totalAmount: 1000
    });
});

test("checkout amounts add delivery below the free-delivery threshold", () => {
    assert.deepEqual(getCheckoutAmounts([
        { lineSubtotal: 200, lineDiscount: 20 }
    ]), {
        subtotal: 200,
        discount: 20,
        deliveryFee: 50,
        totalAmount: 230
    });
});

test("reservation keys are deterministic and scoped to checkout and product", () => {
    const first = reservationKeyFor("USER1", "key1", "P1001");
    assert.equal(first, reservationKeyFor("USER1", "key1", "P1001"));
    assert.notEqual(first, reservationKeyFor("USER1", "key2", "P1001"));
    assert.notEqual(first, reservationKeyFor("USER2", "key1", "P1001"));
    assert.notEqual(first, reservationKeyFor("USER1", "key1", "P1002"));
});

test("catalog isActive virtual stays compatible with the existing active field", () => {
    const product = new Product({ active: true });
    assert.equal(product.isActive, true);
    product.isActive = false;
    assert.equal(product.active, false);
});
