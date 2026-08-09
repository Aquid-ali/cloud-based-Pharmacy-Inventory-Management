<<<<<<< HEAD
# MediChain — Milestone 1

**Cloud-Based Pharmacy Inventory Management System (Blockchain integration planned for a later milestone)**

This is the first development milestone of MediChain: a secure, production-ready foundation covering user authentication and full medicine inventory CRUD. The architecture is deliberately modular so future milestones (blockchain ledger, cloud storage, barcode scanning, AI recommendations, expiry prediction, analytics, notifications, customer portal) can be layered in without refactoring the core.

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
│   │   ├── authController.js      # register, login, logout, getMe
│   │   └── medicineController.js  # CRUD + search/filter/sort/pagination + stats
│   ├── middleware/
│   │   ├── authMiddleware.js      # protect (JWT) + authorize (roles)
│   │   ├── errorHandler.js        # centralized error handler + 404
│   │   └── validate.js            # express-validator result handler
│   ├── models/
│   │   ├── User.js                # fullName, email, password(hashed), role
│   │   └── Medicine.js            # full medicine schema + auto status
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── medicineRoutes.js
│   ├── utils/
│   │   ├── generateToken.js       # JWT signing
│   │   └── ApiError.js            # custom error class
│   ├── validators/
│   │   ├── authValidator.js
│   │   └── medicineValidator.js
│   ├── app.js                     # Express app (middleware + routes)
│   ├── server.js                  # entry point (connects DB, starts server)
│   ├── .env.example
│   └── package.json
│
└── client/                        # React + Vite + Tailwind SPA
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── Spinner.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── ConfirmModal.jsx
    │   │   └── MedicineForm.jsx   # shared by Add & Edit pages
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── MedicineList.jsx
    │   │   ├── AddMedicine.jsx
    │   │   ├── EditMedicine.jsx
    │   │   ├── MedicineDetails.jsx
    │   │   └── NotFound.jsx
    │   ├── layouts/
    │   │   └── DashboardLayout.jsx # Sidebar + Navbar + <Outlet/>
    │   ├── context/
    │   │   └── AuthContext.jsx     # global auth state
    │   ├── hooks/
    │   │   └── useAuth.js
    │   ├── services/
    │   │   ├── api.js              # Axios instance, JWT interceptor, 401 redirect
    │   │   ├── authService.js
    │   │   └── medicineService.js
    │   ├── App.jsx                 # routes
    │   ├── main.jsx                # entry point
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
| role | String | enum: `Admin`, `Pharmacist` (default) |
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
| createdAt / updatedAt | Date | via `timestamps: true` |

`status` is recalculated automatically in a `pre('save')` hook, so it never drifts from the real quantity/expiry data.

---

## 4. Authentication

- **Register** — `POST /api/auth/register` — hashes password with bcrypt, returns user + JWT.
- **Login** — `POST /api/auth/login` — verifies password, returns user + JWT.
- **Logout** — `POST /api/auth/logout` — stateless; client discards token (endpoint kept for a consistent API and future token-blacklisting).
- **Get current user** — `GET /api/auth/me` — protected.
- **JWT** — signed with `JWT_SECRET`, expires per `JWT_EXPIRES_IN` (default 7 days).
- **Protected routes** — `protect` middleware validates the `Authorization: Bearer <token>` header.
- **Role-based middleware** — `authorize('Admin')` / `authorize('Admin', 'Pharmacist')` restricts by role (e.g. only Admins can delete medicines).
- All inputs validated with `express-validator`; consistent JSON error responses with correct HTTP status codes (400/401/403/404/409/500).

---

## 5. Medicine CRUD API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/medicines` | Admin, Pharmacist | Create medicine |
| GET | `/api/medicines` | Any authenticated user | List with search/filter/sort/pagination |
| GET | `/api/medicines/:id` | Any authenticated user | Get single medicine |
| PUT | `/api/medicines/:id` | Admin, Pharmacist | Update medicine |
| DELETE | `/api/medicines/:id` | Admin only | Delete medicine |
| GET | `/api/medicines/stats/summary` | Any authenticated user | Dashboard stats |

**Query parameters on `GET /api/medicines`:**
- `search` — text search across medicineName / genericName / manufacturer
- `category` — exact category filter
- `expiry` — `valid` | `expiringSoon` (next 30 days) | `expired`
- `status` — `In Stock` | `Low Stock` | `Out of Stock` | `Expired`
- `sortBy` — `medicineName` | `expiryDate` | `quantity` | `createdAt`
- `order` — `asc` | `desc`
- `page`, `limit` — pagination (default page 1, limit 10, max 100)

---

## 6. Frontend

- **Pages**: Login, Register, Dashboard, Medicine List, Add Medicine, Edit Medicine, Medicine Details, 404.
- **Dashboard**: Sidebar + Top Navbar layout, stat cards (Total Medicines, Low Stock, Expired, Categories).
- **Medicine List**: searchable/filterable/sortable table, pagination, delete confirmation modal, empty state, loading spinner.
- **Forms**: shared `MedicineForm` component with client-side validation and inline error messages.
- **Axios**: single instance (`services/api.js`) auto-attaches the JWT to every request and redirects to `/login` on a 401 response.
- **Notifications**: `react-hot-toast` for success/error feedback across all actions.
- **Responsive**: mobile-friendly sidebar (collapsible) and responsive grid/table layouts.

---

## 7. Security Measures

- `helmet` for secure HTTP headers.
- JWT authentication + bcrypt password hashing (10 salt rounds).
- `express-validator` on every write endpoint.
- `express-mongo-sanitize` to strip NoSQL-injection operators from input.
- Role-based authorization on sensitive routes (e.g. delete = Admin only).
- Rate limiting on `/api/auth/*` to slow brute-force attempts.
- All secrets/config via environment variables (`.env`, never committed — see `.gitignore`).
- Passwords and `__v` are stripped from every JSON response via a `toJSON` override on the User model.

---

## 8. Installation & Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally or a MongoDB Atlas connection string

### Backend

```bash
cd server
cp .env.example .env      # then edit .env with your MongoDB URI and JWT secret
npm install
npm run dev                # starts on http://localhost:5000
```

### Frontend

```bash
cd client
cp .env.example .env      # set VITE_API_BASE_URL if different from default
npm install
npm run dev                # starts on http://localhost:5173
```

Open `http://localhost:5173`, register an account, and start managing inventory.

---

## 9. Designed for Future Milestones

The current architecture keeps future features additive rather than disruptive:

- **Blockchain ledger** — add a `services/blockchainService.js` on the backend and hook it into `medicineController` create/update events (e.g. emit a transaction hash) without touching existing routes.
- **Cloud storage (Firebase/AWS)** — add an `upload` middleware + a `imageUrl` field on `Medicine`; the schema already isolates all product fields so this is additive.
- **Barcode/QR scanning** — a new frontend page/component that resolves a scanned code to a `batchNumber`/`_id` and calls the existing `GET /api/medicines/:id`.
- **AI recommendations / expiry prediction** — new controller + route namespace (e.g. `/api/ai/*`) that reads from the same `Medicine` collection; no changes needed to existing CRUD.
- **Analytics / notifications / customer portal** — additional route modules and a `role` extension (e.g. `Customer`) plumb into the same `authorize()` middleware already in place.

---

## 10. Notes

- Blockchain, AI, cloud analytics, barcode scanning, and payments are intentionally **out of scope** for this milestone, per the project brief.
- Default low-stock threshold is 20 units (see `LOW_STOCK_THRESHOLD` in `models/Medicine.js`) — make this configurable per-pharmacy in a later milestone if needed.
=======
# cloud-based-Pharmacy-Inventory-Management
>>>>>>> 1b307ae6489df2794f75cdcb5f2534d586383250
