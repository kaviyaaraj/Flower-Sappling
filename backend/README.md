# Flower-Sapling Backend

Express/MongoDB backend for the BloomKart flower-sapling store. This phase adds a read-only product catalog, a non-reserving cart, and a checkout foundation around the existing inventory reservation service. Payment gateway integration is **not implemented**.

## Architecture

- `src/server.js`: Express application, CORS, JSON parsing, and API router mounts.
- `src/config/db.js`: MongoDB connection.
- `src/models/`: Product, Inventory, Reservation, Cart, and Checkout schemas.
- `src/controllers/` and `src/routes/`: HTTP validation, responses, and route definitions.
- `src/services/inventoryService.js`: atomic inventory decrement guarded by `availableQuantity >= quantity`.
- `src/services/reservationService.js`: existing reservation and reservation idempotency logic, reused by checkout.
- `src/services/checkoutService.js`: cart price snapshots, totals, checkout idempotency, and calls into the reservation service.

`Product.active` remains the stored active flag used by the existing reservation code. Product API responses expose it as `isActive`. Schema timestamps provide `createdAt` and `updatedAt`.

## Requirements and run commands

Use Node.js 18 or newer (the API integration test uses built-in `fetch`) and a MongoDB replica set. MongoDB transactions are already required by the existing reservation service, so a standalone MongoDB server is insufficient.

PowerShell, from the repository root:

```powershell
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Set `MONGODB_URI` in `.env` to the existing replica-set connection string. Do not replace any working environment configuration. Seed P1001 only if it is not already present, then start the server:

```powershell
npm run seed:inventory
npm run dev
```

The seed is non-destructive: it inserts Product P1001 and its initial 100-unit inventory only when missing. It does not delete or reset existing product, inventory, reservation, or checkout data. The server listens on port 5000 unless `PORT` is set.

## API

All responses use `{ "success": true, "data": ... }` on success and `{ "success": false, "message": "..." }` for errors. The existing reservation endpoint retains its original response shape for backward compatibility.

### Products

- `GET /api/products` — active products; optional `search` (name/category), `category`, `sort` (`name`, `price`, `rating`, `createdAt`), `order` (`asc`/`desc`), `limit` (1–100), and `skip`.
- `GET /api/products/:productId` — public product details and `{ inventory: { availableQuantity } }`.

Example:

```http
GET /api/products?search=flower&category=Flowering&sort=price&order=asc
GET /api/products/P1001
```

The list response contains `data.products`, `data.limit`, and `data.skip`. Product details contain `data.product` and `data.inventory`. Missing inventory is reported as zero. Database documents and internal MongoDB IDs are not returned.

### Cart

- `POST /api/cart` — add quantity to a user's cart. Body: `{ "userId": "USER001", "productId": "P1001", "quantity": 1 }`.
- `GET /api/cart/:userId` — get cart and price snapshots.
- `PUT /api/cart/:userId/items/:productId` — set quantity. Body: `{ "quantity": 2 }`.
- `DELETE /api/cart/:userId/items/:productId` — remove an item.
- `DELETE /api/cart/:userId` — clear the cart.

Quantity must be an integer from 1 to 99. Products must exist and be active. Cart writes do not reserve or decrement inventory; stock is checked by checkout through the existing reservation flow.

### Checkout

- `POST /api/checkout` — validate a non-empty cart, calculate totals, reserve each item using the existing reservation service, then return a checkout in `PAYMENT_PENDING` state.

Example request:

```json
{
	"userId": "USER001",
	"cartId": "CART_ID_FROM_GET_CART",
	"idempotencyKey": "checkout-attempt-001"
}
```

Successful response data includes `checkoutId`, item snapshots, `subtotal`, `discount`, `deliveryFee`, `totalAmount`, `reservationIds`, and `status`. Checkout is scoped for idempotency by the unique database index on `{ userId, idempotencyKey }`. Repeating a successful request returns the same checkout and does not create additional reservations.

Pricing assumptions for this phase: when an original-price snapshot exceeds the cart's captured sale-price snapshot, checkout uses the original price for the subtotal and records their difference as the discount. Otherwise the captured price is the subtotal and the product's percentage `discount` is applied. Delivery is 50 currency units when the post-discount subtotal is below 1000 and free at or above 1000. Adjust these constants/policies in `src/services/checkoutService.js` to match the store's final pricing rules.

### Existing reservation API (preserved)

- `POST /api/reservations` — unchanged route/controller/service behavior.

Request example:

```json
{
	"userId": "USER001",
	"productId": "P1001",
	"quantity": 1,
	"idempotencyKey": "reserve-attempt-001"
}
```

The existing reservation service is the only inventory reservation implementation used by checkout. Checkout derives a stable per-user/per-checkout/per-product reservation idempotency key and calls `createReservation()` for every cart line; its existing atomic inventory update and transaction remain authoritative. Reservation keys and checkout keys are independently unique. Inventory is only decremented when reservation succeeds, never when an item is added to a cart.

A checkout containing multiple products currently creates one existing reservation per product. If a later reservation fails, the checkout is marked `FAILED`; any earlier reservations remain temporary holds and expire according to the existing reservation expiry behavior (five minutes). This limitation avoids duplicating or changing the established reservation/release algorithm.

Checkout success means inventory has been reserved and the checkout is awaiting payment. Payment capture, checkout completion, reservation confirmation, and fulfillment are out of scope; no payment provider is integrated.

## Testing

Unit tests do not require a database:

```powershell
npm test
```

API integration tests require `.env`, the MongoDB replica set, P1001 with inventory, and a running backend. In a second PowerShell terminal:

```powershell
npm run test:api
```

The integration test creates temporary MongoDB fixture products/inventory, tests product lookup, cart CRUD and validation, successful checkout/idempotent retry, invalid/inactive and out-of-stock checkout, and the original reservation API (valid, duplicate key, different key, invalid request, and no-stock conflict). It removes its fixture records afterwards. Do not run integration tests against production data.