# ThreadLab - Custom T-Shirt E-Commerce

Full-stack MERN storefront and multi-role operations suite for a custom T-shirt & apparel e-commerce business.

## Features

### Customer Storefront
- **Dynamic Catalog**: Real-time products fetched from MongoDB with categories (Anime, Streetwear, Oversized, Minimalist, Vintage), color swatches, and live price/stock badges.
- **Product Details & SKU Selector**: Image gallery previews, size matrix (S, M, L, XL), stock alerts, and single-click cart/wishlist management.
- **Live Cart & Coupons**: Real-time subtotal calculation, coupon discounts (`WELCOME10`, `FLAT200`), and local cache persistence.
- **COD Checkout Flow**: Validated recipient details, saved delivery addresses, tax splits (12% GST), inventory decrement, and instant order tracking ID generation.
- **Customer Account Portal**: Order history with tracking status, saved shipping address book, profile updates, and secure password changes.

### Operations & Admin Console (`/admin`)
- **Role-Based Access Control**: Supports `admin`, `catalog_manager`, and `logistics_manager` roles with secure JWT authentication.
- **Catalog SKU Matrix (Full Product CRUD)**:
  - Create brand new apparel items with multiple high-res photo uploads / URLs.
  - Multi-SKU variant matrix (Size, Color, Stock units, Low-stock safety threshold, Cost Price, MRP, Selling Price, GST split).
  - Live in-line stock level editing and variant removal.
  - Edit existing products or delete products with audit trail logging.
- **Fulfillment & RMA Returns Console**:
  - Filter orders by status (`pending`, `manifested`, `shipped`, `delivered`, `returns`, `cancelled`).
  - Generate courier manifestations with Shiprocket AWB tracking codes.
  - Printable surface logistics shipping labels and packing manifests.
  - Return merchandise authorization (RMA) workflow: simulate return request -> schedule courier pickup -> warehouse quality check (QC evaluation) -> automated refund settlement with transaction ID.
  - Export full Orders Ledger CSV and Financial Splits CSV.
- **Coupon Engine (Full Coupon CRUD)**:
  - Create, view, modify, and delete promotional discount codes with percentage or flat amount discounts, minimum cart values, and expiration schedules.
- **Customer CRM**:
  - Real-time customer search, order frequency, total lifetime value (LTV), and delivery address histories.
- **CMS Banners & Bento Grid**:
  - Manage hero campaign banners and homepage bento priority ordering.
- **Security Audit Logs**:
  - Live timeline of admin actions with timestamp, user role, client IP, and payload inspection.
- **Executive BI Dashboard**:
  - Real-time gross sales, collected GST, net profit, low-stock threshold alerts, and 7-day revenue trend SVG chart.

---

## Default Credentials

### Admin Users
| Role | Email | Password |
|---|---|---|
| Root Administrator | `admin@threadlab.com` | `admin123` |
| Catalog Manager | `catalog@threadlab.com` | `admin123` |
| Logistics Manager | `logistics@threadlab.com` | `admin123` |

### Demo Customers
| Name | Email | Password |
|---|---|---|
| Falgun Patel | `user@gmail.com` | `user123` |
| James Miller | `james.miller@gmail.com` | `user123` |

---

## Tech Stack

- **Frontend**: React, Vite, React Router 7, Tailwind CSS, Framer Motion, Axios
- **Backend**: Node.js, Express, Mongoose, JWT, Bcrypt
- **Database**: MongoDB

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed MongoDB Demo Products & Data
Make sure MongoDB is running (`mongodb://localhost:27017`), then run:
```bash
npm run seed --workspace backend
# or: cd backend && node seed.js
```

### 3. Run Development Servers
Start backend API:
```bash
npm run dev:server
```
Start frontend client:
```bash
npm run dev:client
```

- **Frontend URL**: `http://localhost:5173`
- **Admin Login**: `http://localhost:5173/admin/login`
- **Backend API**: `http://localhost:5000`
