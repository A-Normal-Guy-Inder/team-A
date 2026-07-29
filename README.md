# Hire-a-Helper

**Hire-a-Helper** is a full-stack task management marketplace where users can create tasks requiring assistance and others can request to perform those tasks. The platform implements a **one-to-one assignment model**: when a task owner accepts a request, the task is assigned to that requester and all other pending requests are automatically rejected.

## 🚀 Key Features

*   **Secure Authentication**: Multi-stage verification using **cryptographically random 6-digit OTPs** (sent via Gmail SMTP) with per-purpose scoping, attempt limiting (6 attempts → 10-minute block) and JWT-based sessions stored in **HTTP-only cookies**.
*   **Task Management**: Users can create, edit, and browse tasks with details like location, category, and time range.
*   **Request System**: A transactional workflow for sending, accepting, and rejecting task requests, with a cooldown before a rejected requester may re-apply.
*   **Server-Side Pagination, Search, Filtering & Sorting**: Every list endpoint accepts `page`, `limit`, `search`, `status`, `category`, `sortBy` and `sortOrder`, and returns a `meta` block. The client never downloads a whole collection to filter it in the browser.
*   **Automated Background Jobs**: Powered by **node-cron**, a scheduled job closes expired tasks. A **MongoDB-backed lease lock** guarantees exactly one execution per tick no matter how many API instances are running.
*   **Media Management**: Integrated **Multer** and **Cloudinary** pipeline with type/size validation and guaranteed temp-file cleanup.
*   **Realtime Notifications**: **Socket.IO** pushes notifications the moment they are created, authenticated with the same HTTP-only session cookie as the REST API.
*   **Hardening**: **Helmet** security headers plus tiered **express-rate-limit** buckets for global traffic, credential endpoints, OTP issuance and authenticated writes.

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Redux Toolkit, React Router DOM, Socket.IO Client, Axios, React Toastify, Lucide Icons |
| **Backend** | Node.js, Express.js, JWT, bcryptjs, Helmet, express-rate-limit, Socket.IO |
| **Database** | MongoDB with Mongoose (UUID primary keys, compound indexes & transactions) |
| **Automation** | node-cron with a database lease lock |
| **Storage** | Cloudinary (Image hosting & transformations) |
| **Email** | Nodemailer (Gmail SMTP for OTPs) |

## 🏗️ Architecture Overview

The backend is split into single-responsibility layers, top to bottom:

*   **Routes** — endpoint definitions plus validation and rate-limit wiring. No logic.
*   **Controllers** — translate HTTP to service calls and back. No database access.
*   **Services** — all business logic and persistence. Reusable outside HTTP (jobs, scripts).
*   **Models** — Mongoose schemas with the indexes that back every supported query.
*   **Middleware** — auth, validation, uploads, rate limiting, and one central error handler.
*   **Realtime / Jobs** — Socket.IO fan-out and the locked scheduler, both independent of the request path.

Every endpoint answers with the same envelope, so the client never has to guess at the response shape:

```jsonc
{ "success": true, "message": "…", "data": …, "meta": { "page": 1, "totalPages": 4, … } }
```

The frontend mirrors this with feature-sliced Redux Toolkit state (`auth`, `tasks`, `requests`, `notifications`, `ui`) and presentational components that receive data through selectors.

## 📂 Directory Structure

### Backend
```text
backend/
├── config/         # env, database, cloudinary, SMTP, constants, index bootstrap
├── models/         # Mongoose schemas + indexes (incl. the cron lease lock)
├── validators/     # Declarative request schemas and shared rules
├── middleware/     # auth, validation, uploads, rate limiting, error handling
├── controllers/    # HTTP request/response translation
├── services/       # Business logic and persistence
├── routes/         # Endpoint definitions
├── realtime/       # Socket.IO server, auth and emit helpers
├── jobs/           # Scheduler, distributed lock, auto-close job
├── utils/          # ApiError, response envelope, pagination, OTP, mail, cloudinary
├── app.js          # Express app factory
└── index.js        # Bootstrap: env → DB → indexes → HTTP → sockets → scheduler
```

### Frontend
```text
webapp/src/
├── app/            # Redux store
├── config/         # Environment-driven runtime config
├── features/       # Redux slices + thunks (auth, tasks, requests, notifications, ui)
├── components/
│   └── dashboard/  # Layout, pages, cards, modals — the former monolith, split up
├── hooks/          # useRealtime (Socket.IO), useDebouncedValue
├── routes/         # Protected and public-only route guards
├── services/       # Axios client and Socket.IO client
├── utils/          # Shared validation and date helpers
└── styles/         # Plain CSS files organized by functional area
```

## 🚥 Getting Started

### Prerequisites
*   Node.js (≥18.0.0)
*   npm (≥8.0.0)
*   MongoDB (≥4.4). A replica set is required for multi-document transactions; on a
    standalone server the request-acceptance flow automatically falls back to
    sequential writes.
*   Cloudinary & Gmail SMTP (App Password enabled) accounts

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    ```

2.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET and the rest
    npm run dev            # nodemon;  npm start for plain node
    ```

3.  **Frontend Setup**:
    ```bash
    cd ../webapp
    npm install
    cp .env.example .env   # point REACT_APP_API_URL at your backend
    npm start              # runs on port 3000
    ```

### Environment Variables

Only `MONGO_URI` and `JWT_SECRET` are mandatory — everything else has a working
default. See `backend/.env.example` and `webapp/.env.example` for the annotated
full list.

**`backend/.env`**

| Variable | Description |
| :--- | :--- |
| `NODE_ENV` | `development` (default) or `production`; drives cookie security defaults |
| `PORT` | Server listening port (default: 5000) |
| `MONGO_URI` | MongoDB connection string **(required)** |
| `JWT_SECRET` | Secret for signing session tokens **(required, ≥32 chars in production)** |
| `COOKIE_NAME` | Name for the HTTP-only JWT cookie |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | Override the `NODE_ENV`-derived cookie defaults |
| `FRONTEND_URL` | Comma-separated allowed origins for CORS **and** websockets |
| `CLOUDINARY_*` | Cloud Name, API Key, and API Secret |
| `GMAIL_USER` / `GMAIL_PASS` | Sending address and Gmail App-specific password |
| `RATE_LIMIT_*`, `OTP_*`, `PAGINATION_*` | Tunables for limits, OTP policy and page sizes |
| `CRON_ENABLED`, `CRON_LOCK_TTL_MS` | Background job toggle and lease duration |
| `ENSURE_INDEXES` | Build schema indexes on boot (default `true`) |

**`webapp/.env`**

| Variable | Description |
| :--- | :--- |
| `REACT_APP_API_URL` | Base URL of the REST API, including `/api`. Unset in development — defaults to the host the page was served from |
| `REACT_APP_SOCKET_URL` | Socket.IO origin (defaults to the API URL without `/api`) |
| `REACT_APP_API_PORT` | Port used when deriving the default API origin (default `5000`) |
| `REACT_APP_PAGE_SIZE` | Items per page for the paginated lists |

> Create React App inlines `REACT_APP_*` variables at build time — restart the dev
> server after changing them.

> **Leave `REACT_APP_API_URL` unset locally.** The session is an HTTP-only
> `SameSite=Lax` cookie, and browsers treat `localhost` and `127.0.0.1` as
> different *sites*. Pointing the app at one while serving it from the other makes
> the browser discard the cookie set by `POST /auth/login`, so every following
> request fails with `401 Not authorized, no token` and the websocket handshake is
> rejected. Deriving the API origin from `window.location` keeps the two aligned;
> set the variable explicitly only when the API really is on another origin, and
> add that origin to the backend's `FRONTEND_URL`.

### Running Multiple Backend Instances

Scaling out horizontally needs no extra configuration. The scheduler takes a lease
in the `joblocks` collection before each run, so only one instance performs the
auto-close for a given tick; the others log a skip and move on. Keep
`CRON_LOCK_TTL_MS` **below** the schedule interval so the lease expires between
ticks.

## 🔌 API Conventions

*   All list endpoints accept `?page`, `?limit`, `?search`, `?sortBy`, `?sortOrder`
    plus resource-specific filters (`status`, `category`, `location`, `startFrom`,
    `startTo`).
*   Successful responses: `{ success: true, message, data, meta? }`.
*   Failures: `{ success: false, message, details? }` with an accurate status code —
    `400` validation, `401` unauthenticated, `403` forbidden, `404` missing,
    `409` conflict, `413` payload too large, `429` rate limited.
