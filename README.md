# Flipkart Clone (Full-Stack Monorepo)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Claude](https://img.shields.io/badge/Anthropic-Claude%20Haiku-orange)

Production-grade Flipkart-style e-commerce application built as an SDE intern assignment. The project is a monorepo with a React frontend and an Express backend using Supabase for Auth, PostgreSQL, and storage-ready schema design.

## Highlights

- Real authentication using Supabase Auth (Email/Password + Google OAuth)
- Real cart, wishlist, addresses, and orders persisted in PostgreSQL
- Atomic order placement using PostgreSQL RPC (`place_order_atomic`) for:
  - stock validation
  - stock decrement
  - `orders` + `order_items` creation
  - cart clearing
- Admin panel with role-based access and live dashboard metrics
- AI support chatbot via Anthropic Claude Haiku through backend `/api/chat`
- Responsive UI with protected routes, skeleton loading, and toast notifications

## Monorepo Structure

```text
flipkart-clone/
├── client/                    # React + Vite + Tailwind application
├── server/                    # Express API + Supabase integration
├── package.json               # Monorepo convenience scripts
└── README.md
```

## Tech Stack

### Frontend

- React 18
- Vite 6
- React Router v6
- Tailwind CSS 3
- Recharts
- Axios
- Lucide icons

### Backend

- Node.js + Express 4
- Supabase JS SDK (admin and auth clients)
- Anthropic SDK
- Helmet, CORS, Morgan

### Database

- Supabase PostgreSQL
- RLS policies
- PL/pgSQL stored function for atomic order flow

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase project
- Anthropic API key (for chatbot)

### 1. Install Dependencies

From repository root:

```bash
npm run install:all
```

Or manually:

```bash
npm install --prefix server
npm install --prefix client
```

### 2. Configure Environment Variables

Create:

- `server/.env` from `server/.env.example`
- `client/.env` from `client/.env.example`

Server variables used by code:

- `PORT`
- `NODE_ENV`
- `CORS_ORIGIN` (comma-separated origins)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

Client variables used by code:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Setup Supabase Schema + Seed Data

Run full SQL in Supabase SQL Editor:

- `server/sql/supabase_schema_seed.sql`

This creates:

- enums, tables, indexes, trigger, RLS policies
- atomic order RPC function
- seed categories and 30 products

### 4. Run Locally

Option A (recommended, root scripts):

```bash
npm run dev:server
npm run dev:client
```

Option B:

```bash
cd server && npm run dev
cd client && npm run dev
```

Local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## How To Access Admin Page

Admin access is role-based (`users.role = 'admin'`), not email-based.

1. Signup/login in the app from `/auth`.
2. Promote your user in Supabase SQL Editor:

```sql
update public.users
set role = 'admin'
where email = 'your-email@example.com';
```

3. Logout and login again so role refreshes.
4. Open user menu in navbar and click **Admin**, or navigate to `/admin`.

Authorization enforcement locations:

- Backend role guard: `server/src/middleware/admin.js`
- JWT + role attachment: `server/src/middleware/auth.js`
- Frontend route guard: `client/src/components/layout/AdminRoute.jsx`

## API Reference

### Public

- `GET /health`
- `GET /api/categories`
- `GET /api/products`
  - query params supported:
    - `q`
    - `category`
    - `min_price`
    - `max_price`
    - `brand`
    - `min_rating`
    - `page`
    - `limit`
- `GET /api/products/:slug`
- `POST /api/chat`

### Authenticated

- `GET /api/me`
- `PUT /api/me`
- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/:id`
- `DELETE /api/cart/:id`
- `GET /api/wishlist`
- `POST /api/wishlist` (toggle)
- `GET /api/addresses`
- `POST /api/addresses`
- `PUT /api/addresses/:id`
- `DELETE /api/addresses/:id`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`

### Admin Only

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/orders`
- `PUT /api/admin/orders/:id/status`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`

## Deployment

### Frontend (Vercel)

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing config: `client/vercel.json`
- Required env vars:
  - `VITE_API_BASE_URL`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Backend (Render)

- Render blueprint file: `server/render.yaml`
- Build command: `npm install`
- Start command: `node src/index.js`
- Required env vars:
  - `NODE_ENV=production`
  - `PORT`
  - `CORS_ORIGIN` (set to Vercel URL, optionally comma-separated for multiple origins)
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`

## Database Relationship Summary

- `auth.users` -> `public.users` (1:1, trigger-managed)
- `users` -> `addresses` (1:N)
- `users` -> `cart_items` (1:N), `cart_items` -> `products` (N:1)
- `users` -> `wishlist` (1:N), `wishlist` -> `products` (N:1)
- `categories` -> `products` (1:N)
- `users` -> `orders` (1:N)
- `orders` -> `order_items` (1:N), `order_items` -> `products` (N:1)
- `orders` -> `addresses` (N:1)

## Notes And Current Scope

- Payment step is intentionally COD-only in UI, with "Online payment coming soon".
- Product image URLs are placeholder CDN links from Unsplash/Picsum.
- Search and filters are server-driven via query params listed above.

## Troubleshooting

### Port already in use (EADDRINUSE)

If backend fails on port 5000:

```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen |
Select-Object -ExpandProperty OwningProcess -Unique |
ForEach-Object { Stop-Process -Id $_ -Force }
```

### CORS blocked

- Ensure `CORS_ORIGIN` exactly matches frontend origin(s), including protocol.
- Multiple origins must be comma-separated.

### Admin access not visible

- Verify `users.role = 'admin'` in Supabase.
- Logout and login again to refresh role in client context.

### Chatbot errors

- Confirm valid `ANTHROPIC_API_KEY` in `server/.env`.

## AI & RAG Architecture

The chatbot uses a Retrieval-Augmented Generation (RAG) flow for product-aware responses.

- **Embeddings model**: Cohere `embed-english-v3.0`
  - 1024-dimension vectors per product
  - Product text is generated from name, brand, price, description, and specifications
- **Vector storage**: Supabase PostgreSQL + `pgvector`
  - Separate `product_embeddings` table linked to `products(id)`
- **Similarity retrieval**: cosine similarity via PostgreSQL `match_products()` function
- **LLM generation**: OpenRouter OpenAI-compatible API
  - Model: `meta-llama/llama-3.1-8b-instruct:free`

RAG flow (text diagram):

```text
User message
   |
   v
Cohere Embed API (search_query)
   |
   v
Supabase RPC: match_products(query_embedding)
   |
   +--> Top similar product IDs
           |
           v
      Fetch product details from products table
           |
           v
      Build product context string
           |
           v
OpenRouter Chat Completion (Llama 3.1 8B)
  system prompt + short history + user message + product context
           |
           v
Assistant reply + related product sources (shown in chat UI)
```

Operational notes:

- Run `npm run embed` in `server/` after seeding or updating products.
- Keep `COHERE_API_KEY` and `OPENROUTER_API_KEY` in backend env variables only.
