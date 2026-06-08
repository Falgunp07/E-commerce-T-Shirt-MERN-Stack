# ThreadLab - Custom T-Shirt E-Commerce

Full-stack MERN storefront for a custom T-shirt printing business.

## Features

- React frontend with product listing, detail, cart, and COD checkout
- Express + MongoDB backend with product and order APIs
- Seeded sample products stored in local MongoDB
- Cart persists in `localStorage`

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS, Framer Motion
- Backend: Node.js, Express, Mongoose, MongoDB

## Project Structure

- `frontend/` - client app
- `backend/` - API server and MongoDB models

## Prerequisites

- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`

## Setup

Install dependencies from the repo root:

```bash
npm install
```

If you want to reinstall workspace dependencies directly:

```bash
cd frontend
npm install

cd ../backend
npm install
```

## Run Locally

Start the frontend:

```bash
cd frontend
npm run dev
```

Start the backend:

```bash
cd backend
npm run dev
```

The default ports are:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Seed MongoDB

If you want the sample products in Compass / MongoDB, run:

```bash
cd backend
npm run seed
```

## API Endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `POST /api/checkout`
- `GET /api/orders`

## Notes

- Product pages use MongoDB `_id` values.
- If you already had items in cart from the old mock data, clear the browser `localStorage` cart once so the IDs match the database.