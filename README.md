# Flower-Sappling (SaleStorm)

SaleStorm is a high-performance e-commerce platform designed specifically for handling high-traffic flash sales events. It provides a seamless shopping experience for users with features tailored towards urgency and scale.

## What the Project Does

The core objective of this project is to manage flash sale scenarios where many users attempt to purchase a limited stock of items simultaneously. To achieve this, the platform focuses on speed, real-time feedback, and efficient inventory management.

### Key Features
- **Flash Sale Campaigns:** Dedicated infrastructure to run time-limited sales events with live countdown timers.
- **Real-Time Inventory Tracking:** Accurate tracking of stock availability, showing users low-stock warnings and live stock progress bars to create urgency.
- **High-Concurrency Handling:** Built to prevent overselling when multiple users try to buy the last item at the exact same millisecond.
- **Product Discovery & Checkout:** A smooth user flow covering product browsing, cart management, and order processing.

## Architecture

The platform is built as a modern, decoupled full-stack application aiming for high availability and low latency during traffic spikes.

### Frontend Architecture
- **Framework:** React.js bootstrapped with Vite for fast builds and optimized production bundles.
- **State Management:** Utilizes React Context API and custom hooks (`useProducts`, etc.) for managing global states like Cart and User Authentication, minimizing prop drilling.
- **Routing:** React Router DOM is used for client-side routing, enabling a Single Page Application (SPA) experience across pages like Home, Products, Cart, Checkout, and Order Success.
- **UI & Styling:** Built with modern CSS (and CSS Modules) and Lucide React icons. It includes reusable, stateful components specifically designed for flash sales, such as `CountdownTimer`, `StockBadge`, `StockProgress`, and `FlashSaleBanner`.
- **API Integration:** Uses Axios for communicating with the backend, abstracted into a dedicated API service layer (`api.js`) for maintainable network requests.

### Backend Architecture
- **Server:** Node.js with Express.js provides a RESTful API to serve the frontend client.
- **Database (Persistent Storage):** MongoDB, orchestrated via Mongoose, acts as the primary database for persisting product catalogs, user profiles, and historical order records.
- **Caching & Concurrency (Redis):** Redis (`ioredis`) is a critical architectural component. It acts as an in-memory datastore used for:
  - **Inventory Management:** Caching live stock counts.
  - **Concurrency Control:** Leveraging Redis atomic operations (like decr) or distributed locks to prevent race conditions (overselling) during simultaneous checkout requests.
- **Project Structure:** Follows a modular controller-route pattern, separating business logic into controllers, data schemas into models, and API endpoints into routes. Scripts are provided for database seeding (`seed:inventory`) and API testing.

## Folder Structure

### Frontend (`/frontend`)
```text
frontend/
├── public/                 # Static assets like favicon and uncompiled resources
├── src/                    # Main application source code
│   ├── assets/             # Images, SVGs, and other global assets
│   ├── components/         # Reusable React components (Navbar, ProductCard, etc.)
│   ├── context/            # React Context providers (AuthContext, CartContext)
│   ├── data/               # Static or mock data for development
│   ├── hooks/              # Custom React hooks (e.g., useProducts)
│   ├── pages/              # Top-level page components (Home, Cart, Checkout, etc.)
│   ├── services/           # API integration and external service logic
│   ├── App.jsx             # Root application component
│   ├── index.css           # Global CSS styles
│   └── main.jsx            # Application entry point
├── package.json            # Frontend dependencies and scripts
└── vite.config.js          # Vite configuration
```

### Backend (`/backend`)
```text
backend/
├── scripts/                # Utility scripts (e.g., database seeding, API tests)
├── src/                    # Backend source code
│   ├── server.js           # Express application entry point
│   └── (controllers, routes, models would typically be placed here)
├── tests/                  # Backend test suites
├── .env.example            # Environment variables template
└── package.json            # Backend dependencies and scripts
```
