# MediChain — Milestone 1

**Cloud-Based Pharmacy Inventory Management System (Blockchain integration planned for a later milestone)**

MediChain is a two-sided platform built on React/Vite/Tailwind + Express/Mongo:

- **Admin dashboard** (`/admin/login` → `/dashboard`) — internal inventory, sales, and reporting tools for pharmacy staff.
- **Customer storefront** (`/login` → `/shop`) — search medicines, find nearby stores, order medicine, and view a payment summary at checkout.

There are exactly two account roles: `Admin` and `Customer`. Public registration (`/register`) always creates a `Customer` account; Admin accounts are provisioned separately (see [Authentication](#4-authentication)).

**Multi-store:** every `Store` has its own Admin account(s) and its own medicine stock — an Admin only ever sees and manages their own store's inventory and orders, never another store's. A customer picks a store to shop from (`/shop/stores`) before browsing; their cart, catalog, and the resulting order are all scoped to that one store, so an order always routes to the correct store's admin.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Axios, React Router v6, react-hot-toast, react-icons |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT, bcryptjs |
| Security/Dev | Helmet, CORS, Morgan, express-validator, express-mongo-sanitize, express-rate-limit, dotenv |

---

## 2. Project Structure

```
medichain/
├── server/                        # Express API (MVC architecture)
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # register, login, logout, getMe, updateMe
│   │   ├── medicineController.js  # CRUD + search/filter/sort/pagination + stats
│   │   ├── storeController.js     # store list + nearby (Haversine distance)
│   │   └── orderController.js     # place order, my orders, order detail
│   ├── middleware/
│   │   ├── authMiddleware.js      # protect (JWT) + authorize (roles)
│   │   ├── errorHandler.js        # centralized error handler + 404
│   │   └── validate.js            # express-validator result handler
│   ├── models/
│   │   ├── User.js                # fullName, email, password(hashed), role, phone, addresses
│   │   ├── Medicine.js            # full medicine schema + auto status
│   │   ├── Store.js               # pharmacy store locations
│   │   └── Order.js               # customer orders + payment summary
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── medicineRoutes.js
│   │   ├── storeRoutes.js
│   │   └── orderRoutes.js
│   ├── seed/
│   │   ├── seedAdmin.js           # `npm run seed:admin` — provisions the Admin account
│   │   └── seedStores.js          # `npm run seed:stores` — sample store locations
│   ├── utils/
│   │   ├── generateToken.js       # JWT signing
│   │   └── ApiError.js            # custom error class
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── medicineValidator.js
│   │   └── orderValidator.js
│   ├── app.js                     # Express app (middleware + routes)
│   ├── server.js                  # entry point (connects DB, starts server)
│   ├── .env.example
│   └── package.json
│
└── client/                        # React + Vite + Tailwind SPA
    ├── src/
    │   ├── components/
    │   │   ├── shop/MedicineCard.jsx  # storefront product card
    │   │   ├── Sidebar.jsx / Navbar.jsx  # admin dashboard chrome
    │   │   ├── ProtectedRoute.jsx     # role-aware route guard
    │   │   ├── Spinner.jsx / EmptyState.jsx / ConfirmModal.jsx
    │   │   └── MedicineForm.jsx       # shared by Add & Edit pages (admin)
    │   ├── pages/
    │   │   ├── Login.jsx / Register.jsx   # customer auth
    │   │   ├── admin/AdminLogin.jsx       # admin-only sign-in (no public signup)
    │   │   ├── shop/                      # customer storefront pages
    │   │   │   ├── Home.jsx, SearchResults.jsx, MedicineDetail.jsx
    │   │   │   ├── Stores.jsx, Cart.jsx, Checkout.jsx
    │   │   │   └── Orders.jsx, OrderDetail.jsx, Account.jsx
    │   │   ├── Dashboard.jsx, MedicineList.jsx, ...   # admin dashboard pages
    │   │   └── NotFound.jsx
    │   ├── layouts/
    │   │   ├── DashboardLayout.jsx   # admin: Sidebar + Navbar + <Outlet/>
    │   │   └── ShopLayout.jsx        # customer: top nav + search + cart + <Outlet/>
    │   ├── context/
    │   │   ├── AuthContext.jsx       # global auth state
    │   │   └── CartContext.jsx       # per-user cart, persisted to localStorage
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   └── useCart.js
    │   ├── services/
    │   │   ├── api.js                # Axios instance, JWT interceptor, role-aware 401 redirect
    │   │   ├── authService.js, medicineService.js
    │   │   └── storeService.js, orderService.js
    │   ├── App.jsx                   # routes (customer /shop/*, admin /dashboard/*)
    │   ├── main.jsx                  # entry point
    │   └── index.css
    ├── .env.example
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vite.config.js
    ├── index.html
    └── package.json
```

---

## 3. Database Models

### User
| Field | Type | Notes |
|---|---|---|
| fullName | String | required |
| email | String | required, unique, validated |
| password | String | required, min 6, bcrypt-hashed, `select: false` |
| role | String | enum: `Admin`, `Customer` (default) |
| store | ObjectId → Store | required if `role` is `Admin`; the one store this admin manages |
| phone | String | optional |
| addresses | Array | optional saved delivery addresses |
| createdAt / updatedAt | Date | via `timestamps: true` |

### Medicine
| Field | Type | Notes |
|---|---|---|
| medicineName | String | required, indexed |
| genericName | String | optional |
| manufacturer | String | required |
| category | String | required, indexed |
| batchNumber | String | required |
| expiryDate | Date | required |
| manufacturingDate | Date | optional |
| quantity | Number | required, ≥ 0 |
| buyingPrice / sellingPrice | Number | required, ≥ 0 |
| supplier | String | optional |
| description | String | optional, ≤ 1000 chars |
| status | String | auto-computed: `In Stock`, `Low Stock`, `Out of Stock`, `Expired` |
| createdBy | ObjectId → User | required |
| store | ObjectId → Store | required; the store this stock belongs to |
| createdAt / updatedAt | Date | via `timestamps: true` |

`status` is recalculated automatically in a `pre('save')` hook, so it never drifts from the real quantity/expiry data. This is the same catalog customers browse in the storefront — there is no separate customer-facing product table. Stock is per-store: an Admin's create/update/delete requests are always scoped to `req.user.store`, and a customer's catalog is filtered to whichever store they've chosen to shop from.

### Store
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| address | Object | `{ line1, city, state, pincode }` |
| phone / openingHours | String | optional |
| location | Object | `{ lat, lng }`, used for nearby-store distance search |

### Order
| Field | Type | Notes |
|---|---|---|
| user | ObjectId → User | required |
| items | Array | medicine ref + name/price snapshot + quantity, re-priced server-side |
| deliveryType | String | `Delivery` or `Pickup` |
| address | Object | required if `Delivery` |
| store | ObjectId → Store | required — the fulfilling store (same store the customer's cart was shopping from) |
| paymentMethod | String | `COD`, `UPI`, `Card` |
| paymentStatus | String | `Pending` (COD) or `Paid` (UPI/Card, simulated) |
| pricing | Object | `{ subtotal, deliveryFee, totalAmount }` — the payment summary |
| status | String | `Placed`, `Processing`, `Out for Delivery`, `Delivered`, `Cancelled` |

---

## 4. Authentication

- **Register** — `POST /api/auth/register` — always creates a `Customer` account (role cannot be set from the request body).
- **Login** — `POST /api/auth/login` — verifies password, returns user + JWT. The frontend has two login pages (`/login` for customers, `/admin/login` for staff) that call the same endpoint and reject a role mismatch client-side.
- **Logout** — `POST /api/auth/logout` — stateless; client discards token.
- **Get current user** — `GET /api/auth/me` — protected.
- **Update profile** — `PATCH /api/auth/me` — protected; lets a signed-in user update `fullName`, `phone`, `addresses`.
- **JWT** — signed with `JWT_SECRET`, expires per `JWT_EXPIRES_IN` (default 7 days).
- **Protected routes** — `protect` middleware validates the `Authorization: Bearer <token>` header.
- **Role-based middleware** — `authorize('Admin')` / `authorize('Customer')` restricts by role.
- All inputs validated with `express-validator`; consistent JSON error responses with correct HTTP status codes (400/401/403/404/409/500).

### Provisioning Admin accounts

There is no public Admin signup, and every Admin is scoped to exactly one Store. Seed stores first, then admins:

```bash
cd server
npm run seed:stores   # creates the sample stores
npm run seed:admin    # creates one Admin per store
```

`seed:admin` loops over every `Store` and creates one Admin each (email `admin.<store-slug>@medstock.com`, e.g. `admin.connaught-place@medstock.com`), all sharing the `ADMIN_PASSWORD` set in `server/.env`. It prints every created login to the console and is safe to re-run (skips stores that already have one).

---

## 5. Medicine CRUD API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/medicines` | Admin | Create medicine — always created under `req.user.store`, regardless of what's sent in the body |
| GET | `/api/medicines` | Any authenticated user | List with search/filter/sort/pagination (also powers the customer catalog) |
| GET | `/api/medicines/:id` | Any authenticated user | Get single medicine |
| PUT | `/api/medicines/:id` | Admin, own store only | Update medicine — 403 if it belongs to another store |
| DELETE | `/api/medicines/:id` | Admin, own store only | Delete medicine — 403 if it belongs to another store |
| GET | `/api/medicines/stats/summary` | Any authenticated user | Dashboard stats, scoped to `req.user.store` for Admin callers |

**Query parameters on `GET /api/medicines`:**
- `search` — text search across medicineName / genericName / manufacturer
- `category` — exact category filter
- `expiry` — `valid` | `expiringSoon` (next 30 days) | `expired`
- `status` — `In Stock` | `Low Stock` | `Out of Stock` | `Expired`
- `store` — filter by store id (used by the customer storefront; **ignored** for Admin callers, who are always forced to their own `req.user.store`)
- `sortBy` — `medicineName` | `expiryDate` | `quantity` | `createdAt`
- `order` — `asc` | `desc`
- `page`, `limit` — pagination (default page 1, limit 10, max 100)

---

## 6. Store API (nearby store search)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/stores` | Any authenticated user | List all stores |
| GET | `/api/stores/nearby?lat=&lng=&limit=` | Any authenticated user | Stores sorted by distance (Haversine formula), each with a `distanceKm` |

Seed sample stores with `npm run seed:stores` (safe to re-run; skips if the collection is already populated).

---

## 7. Order API (order placement + payment summary)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/orders` | Customer | Place an order — server re-prices every item from the live `Medicine` documents, verifies every item belongs to the given `storeId`, and decrements stock |
| GET | `/api/orders/mine` | Customer | The signed-in customer's own orders, newest first |
| GET | `/api/orders` | Admin | Every order placed with `req.user.store`, newest first — this is how an order reaches "the pharmacy admin it was ordered from" |
| GET | `/api/orders/:id` | Owner, or Admin of the fulfilling store | Single order detail |
| PATCH | `/api/orders/:id/status` | Admin, own store only | Update `status` (`Placed` → `Processing` → `Out for Delivery` → `Delivered`/`Cancelled`) |

**Payment summary** = `pricing.subtotal + pricing.deliveryFee = pricing.totalAmount`, computed server-side and returned on every order response (delivery fee is a flat ₹40, waived above a ₹500 subtotal). `UPI`/`Card` payments are **simulated** (`paymentStatus` is marked `Paid` immediately, no real gateway is called) and clearly labeled as such in the checkout UI; `COD` orders are `Pending` until delivery. Real payment gateway integration is intentionally out of scope for this milestone.

---

## 8. Frontend

- **Customer storefront** (`/shop/*`, behind `ShopLayout`): a customer picks a store first (`/shop/stores`, with `navigator.geolocation` + `/api/stores/nearby`, or a manual pincode fallback) — Home (category tiles + catalog) and Search are then scoped to that store. Medicine Detail, Cart, Checkout (delivery/pickup, address, payment method, live payment summary — no separate pickup-store picker since the cart is already store-scoped), My Orders, Order Detail, Account.
- **Admin dashboard** (`/dashboard`, `/medicines`, `/orders`, etc., behind `DashboardLayout`): inventory/order/reporting tool for pharmacy staff, scoped to the signed-in Admin's own store — Sidebar + Top Navbar (shows the admin's store name) layout, stat cards, searchable/filterable/sortable medicine table, a **Customer Orders** page for viewing and updating the status of orders placed with that store, forms with client-side validation.
- **Cart**: client-side `CartContext`, persisted to `localStorage` per signed-in user, tracks `{ storeId, storeName, items }`. Switching stores clears the cart (stock/pricing is per-store) — carts never leak across accounts on a shared browser either.
- **Axios**: single instance (`services/api.js`) auto-attaches the JWT to every request; on a 401 it redirects to `/admin/login` if the current path is inside the admin dashboard, otherwise `/login`.
- **Notifications**: `react-hot-toast` for success/error feedback across all actions.
- **Responsive**: mobile-friendly layouts on both the storefront and the admin dashboard.

---

## 9. Security Measures

- `helmet` for secure HTTP headers.
- JWT authentication + bcrypt password hashing (10 salt rounds).
- `express-validator` on every write endpoint.
- `express-mongo-sanitize` to strip NoSQL-injection operators from input.
- Role-based authorization on sensitive routes (medicine writes = Admin only; order placement = Customer only; no public Admin signup).
- Rate limiting on `/api/auth/*` to slow brute-force attempts.
- Order pricing is always re-derived from the live `Medicine` documents server-side — client-submitted prices are never trusted.
- All secrets/config via environment variables (`.env`, never committed — see `.gitignore`).
- Passwords and `__v` are stripped from every JSON response via a `toJSON` override on the relevant models.

---

## 10. Installation & Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally or a MongoDB Atlas connection string

### Backend

```bash
cd server
cp .env.example .env      # then edit .env with your MongoDB URI, JWT secret, and ADMIN_PASSWORD
npm install
npm run seed:stores        # seeds sample store locations (run first — admins need a store to belong to)
npm run seed:admin         # creates one Admin per store, sharing ADMIN_PASSWORD (prints logins to console)
npm run dev                 # starts on http://localhost:5000
```

### Frontend

```bash
cd client
cp .env.example .env      # set VITE_API_BASE_URL if different from default
npm install
npm run dev                # starts on http://localhost:5173
```

Open `http://localhost:5173`:
- `/register` → create a **Customer** account → lands on the storefront (`/shop`) → pick a store to start browsing.
- `/admin/login` → sign in with any of the per-store logins printed by `npm run seed:admin` (e.g. `admin.connaught-place@medstock.com` / your `ADMIN_PASSWORD`) → lands on that store's internal dashboard (`/dashboard`).

---

## 11. Designed for Future Milestones

The current architecture keeps future features additive rather than disruptive:

- **Blockchain ledger** — add a `services/blockchainService.js` on the backend and hook it into `medicineController`/`orderController` create/update events (e.g. emit a transaction hash) without touching existing routes.
- **Real payment gateway** — swap the simulated `UPI`/`Card` success in `orderController.createOrder` for a real gateway call (e.g. Razorpay/Stripe); the `pricing`/`paymentStatus` shape already matches what a gateway integration would need.
- **Cloud storage (Firebase/AWS)** — add an `upload` middleware + a `imageUrl` field on `Medicine`; the schema already isolates all product fields so this is additive.
- **Barcode/QR scanning** — a new frontend page/component that resolves a scanned code to a `batchNumber`/`_id` and calls the existing `GET /api/medicines/:id`.
- **AI recommendations / expiry prediction** — new controller + route namespace (e.g. `/api/ai/*`) that reads from the same `Medicine` collection; no changes needed to existing CRUD.
- **Multi-admin per store / admin management UI** — `seed:admin` already supports multiple admins per store (dedup is by email, not by store); a `UserManagement.jsx`-backed screen for an existing Admin to invite/create teammates for their own store is a natural next step.

---

## 12. Notes

- Real payment gateway integration and a real interactive map for the store locator are intentionally **out of scope** for this milestone — payments are simulated and store distance uses a plain Haversine calculation.
- Default low-stock threshold is 20 units (see `LOW_STOCK_THRESHOLD` in `models/Medicine.js`) — make this configurable per-pharmacy in a later milestone if needed.
- Delivery fee is a flat ₹40, waived above a ₹500 order subtotal (see `FREE_DELIVERY_THRESHOLD` / `DELIVERY_FEE` in `controllers/orderController.js`) — make this configurable if pricing rules need to vary.
- Store assignment is one-directional today: an Admin's `store` and a Medicine's `store` are set once (at seed time / on creation) and there's no UI to move either to a different store — do this directly in the database if needed.
