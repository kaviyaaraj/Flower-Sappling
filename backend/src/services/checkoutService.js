const { createHash, randomUUID } = require("crypto");
const Cart = require("../models/Cart");
const Checkout = require("../models/Checkout");
const Product = require("../models/Product");
const { createReservation } = require("./reservationService");

const FREE_DELIVERY_THRESHOLD = 1000;
const DELIVERY_FEE = 50;
const money = (value) => Number(value.toFixed(2));

const getCheckoutAmounts = (items) => {
    const subtotal = money(items.reduce((sum, item) => sum + item.lineSubtotal, 0));
    const discount = money(items.reduce((sum, item) => sum + item.lineDiscount, 0));
    const deliveryFee = subtotal - discount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    return {
        subtotal,
        discount,
        deliveryFee,
        totalAmount: money(Math.max(0, subtotal - discount) + deliveryFee)
    };
};

const buildCheckoutItems = async (cart) => {
    if (!cart.items.length) throw new Error("CART_EMPTY");

    const items = [];
    const seenProducts = new Set();
    for (const cartItem of cart.items) {
        if (seenProducts.has(cartItem.productId)) throw new Error("DUPLICATE_CART_PRODUCT");
        seenProducts.add(cartItem.productId);
        const product = await Product.findOne({ productId: cartItem.productId, active: true });
        if (!product) throw new Error("PRODUCT_NOT_FOUND");
        if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1 || cartItem.quantity > 99) {
            throw new Error("INVALID_CART_QUANTITY");
        }

        const priceSnapshot = Number(cartItem.priceSnapshot);
        if (!Number.isFinite(priceSnapshot) || priceSnapshot < 0) throw new Error("INVALID_CART_PRICE");
        const originalPriceSnapshot = Number(cartItem.originalPriceSnapshot);
        const hasOriginalPrice = Number.isFinite(originalPriceSnapshot) && originalPriceSnapshot > priceSnapshot;
        const lineUnitPrice = hasOriginalPrice ? originalPriceSnapshot : priceSnapshot;
        let unitDiscount = 0;
        if (hasOriginalPrice) {
            unitDiscount = originalPriceSnapshot - priceSnapshot;
        } else if (Number(cartItem.discountSnapshot) > 0) {
            unitDiscount = lineUnitPrice * Number(cartItem.discountSnapshot) / 100;
        }
        unitDiscount = money(Math.min(unitDiscount, lineUnitPrice));

        items.push({
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            priceSnapshot,
            unitDiscount,
            lineSubtotal: money(lineUnitPrice * cartItem.quantity),
            lineDiscount: money(unitDiscount * cartItem.quantity)
        });
    }
    return items;
};

const reservationKeyFor = (userId, idempotencyKey, productId) => {
    const checkoutToken = createHash("sha256")
        .update(`${userId}:${idempotencyKey}`)
        .digest("hex");
    return `checkout-${checkoutToken}-${productId}`;
};

const processReservations = async (checkout) => {
    const reservationIds = new Set(checkout.reservationIds);
    checkout.status = "RESERVATION_PENDING";
    await checkout.save();

    try {
        for (const item of checkout.items) {
            const result = await createReservation({
                userId: checkout.userId,
                productId: item.productId,
                quantity: item.quantity,
                idempotencyKey: reservationKeyFor(checkout.userId, checkout.idempotencyKey, item.productId)
            });
            reservationIds.add(result.reservation.reservationId);
            checkout.reservationIds = [...reservationIds];
            await checkout.save();
        }

        checkout.status = "PAYMENT_PENDING";
        await checkout.save();
        return { checkout, existing: false };
    } catch (error) {
        checkout.reservationIds = [...reservationIds];
        checkout.status = "FAILED";
        await checkout.save();
        throw error;
    }
};

const createCheckout = async ({ userId, cartId, idempotencyKey }) => {
    let checkout = await Checkout.findOne({ userId, idempotencyKey });
    if (checkout) {
        if (["CREATED", "RESERVATION_PENDING"].includes(checkout.status)) {
            return processReservations(checkout);
        }
        return { checkout, existing: true };
    }

    const cart = await Cart.findOne({ userId, cartId });
    if (!cart) throw new Error("CART_NOT_FOUND");
    const items = await buildCheckoutItems(cart);
    const amounts = getCheckoutAmounts(items);

    try {
        checkout = await Checkout.create({
            checkoutId: `CO${randomUUID()}`,
            userId,
            cartId,
            items,
            ...amounts,
            reservationIds: [],
            status: "RESERVATION_PENDING",
            idempotencyKey
        });
    } catch (error) {
        if (error.code !== 11000) throw error;
        checkout = await Checkout.findOne({ userId, idempotencyKey });
        if (!checkout) throw error;
        if (["CREATED", "RESERVATION_PENDING"].includes(checkout.status)) return processReservations(checkout);
        return { checkout, existing: true };
    }

    return processReservations(checkout);
};

module.exports = { createCheckout, getCheckoutAmounts, reservationKeyFor };
