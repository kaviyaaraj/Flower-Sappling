const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const reservationRoutes = require("./routes/reservationRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/reservations", reservationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/payments", paymentRoutes);

connectDB();

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SALESTORM Backend is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});