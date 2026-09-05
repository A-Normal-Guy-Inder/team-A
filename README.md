# HelperHub

**HelperHub** is a full-stack task management marketplace where users can create tasks requiring assistance and others can request to perform those tasks. The platform implements a **one-to-one assignment model**: when a task owner accepts a request, the task is assigned to that requester and all other pending requests are automatically rejected.

## 🚀 Key Features

*   **Secure Authentication**: Multi-stage verification using **cryptographically random 6-digit OTPs** (sent via Gmail SMTP) with per-purpose scoping, attempt limiting (6 attempts → 10-minute block, counter resets after 30 minutes idle) and JWT-based sessions stored in **HTTP-only cookies**.
*   **Optional Two-Factor Login**: An account can require an emailed code after the password check. No session cookie is minted until that code is redeemed.
*   **Task Management**: Users can create, edit, and browse tasks with details like location, category, and time range.
*   **Request System**: A transactional workflow for sending, accepting, rejecting and withdrawing task requests, with a cooldown before a rejected requester may re-apply.
*   **Server-Side Pagination, Search, Filtering & Sorting**: Every list endpoint accepts `page`, `limit`, `search`, `status`, `category`, `sortBy` and `sortOrder`, and returns a `meta` block. The client never downloads a whole collection to filter it in the browser.
*   **Automated Background Jobs**: Powered by **node-cron**, a scheduled job closes expired tasks. A **MongoDB-backed lease lock** guarantees exactly one execution per tick no matter how many API instances are running.
*   **Media Management**: Integrated **Multer** and **Cloudinary** pipeline with type/size validation and guaranteed temp-file cleanup.
*   **Realtime Notifications**: **Socket.IO** pushes notifications the moment they are created, authenticated with the same HTTP-only session cookie as the REST API.
*   **Hardening**: **Helmet** security headers plus tiered **express-rate-limit** buckets for global traffic, credential endpoints, OTP issuance and authenticated writes.

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Angular 21 (zoneless, standalone components), Angular Signals, Angular Router, Socket.IO Client, Tailwind CSS |
| **Backend** | Node.js, Express.js, JWT, bcryptjs, Helmet, express-rate-limit, Socket.IO |
| **Database** | MongoDB with Mongoose (UUID primary keys, compound indexes & transactions) |
| **Automation** | node-cron with a database lease lock |
| **Storage** | Cloudinary (Image hosting & transformations) |
| **Email** | Nodemailer (Gmail SMTP for OTPs) |
| **Testing** | Vitest via the Angular CLI test target |


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

The frontend mirrors this with five signal-based stores (`auth`, `tasks`, `requests`,
`notifications`, `ui`) and standalone components that read `computed()` fields. Store actions
are `async` methods returning a `Result<T>` discriminated union rather than throwing, so call
sites branch on `if (!result.ok)`.

### Two frontend invariants

The app runs **zoneless**. Anything a template reads must be a signal — a plain class field
mutated in a click handler will not repaint.

**Store actions must not be called from a tracked reactive context.** An action reads current
state to build its request and writes that state back; if the read is tracked, an enclosing
`effect` gains a dependency on the store, the write re-triggers the effect, and it fetches
forever. Two defences are in place and both should stay: actions read through an untracked
`snapshot()`, and callers wrap the action in `untracked(...)`.
`src/app/state/store-reentrancy.spec.ts` pins this.

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
webapp-angular/src/
├── app/
│   ├── core/           # config, HTTP, socket, realtime, toasts, guards, nav state
│   ├── state/          # the five signal stores
│   ├── shared/         # validation, datetime, pagination, icons, loader, result type
│   ├── auth/           # login, signup, verify-email, forgot-password, reset-password
│   ├── dashboard/      # shell, sidebar, topbar, cards, modals, pages
│   ├── settings/       # settings, update-profile, change-email, change-password
│   ├── app.routes.ts   # route table + derived PROTECTED_PATH_PREFIXES
│   └── app.config.ts   # providers (zoneless, router, HTTP interceptors)
├── environments/       # environment.ts / environment.production.ts
└── styles/             # global CSS: auth, dashboard, loader, settings, not-found
```

The stylesheets are registered as **global** styles in `angular.json`, not as component
styles. They are written as global class selectors and Angular's default style scoping
would break every one of them.   

## 🚥 Getting Started

> **New to the project?** [`requirements.txt`](./requirements.txt) is the single-page
> setup sheet: system requirements, the external accounts you need, every backend and
> frontend package with its version, the minimum `.env`, and the commands to run both
> halves. It is a human-readable checklist, **not** a pip manifest — this is a Node.js
> project, so packages install with `npm install` from each `package.json`.

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
    # create .env with at least MONGO_URI and JWT_SECRET — see the table below
    npm run dev            # nodemon;  npm start for plain node
    ```

3.  **Frontend Setup**:
    ```bash
    cd ../webapp-angular
    npm install
    npm start              # runs on port 3000
    npm run build          # production bundle into ./build
    npm test               # vitest, single run
    ```

#### The dev server runs on 3000, not Angular's default 4200

This is deliberate. The backend's CORS allowlist defaults to `http://localhost:3000`. On
4200 every request is CORS-rejected, which the browser surfaces as `status 0` and the app
reports as "Cannot reach the server" — a misleading message for what is really a blocked
origin. To use another port, add it to `FRONTEND_URL` in `backend/.env` (comma-separated)
and restart the backend.

### Backend environment variables

Only `MONGO_URI` and `JWT_SECRET` are mandatory — everything else has a working default.

| Variable | Description |
| :--- | :--- |
| `NODE_ENV` | `development` (default) or `production`; drives cookie security defaults |
| `PORT` | Server listening port (default: 5000) |
| `MONGO_URI` | MongoDB connection string **(required)** |
| `JWT_SECRET` | Secret for signing session tokens **(required, ≥32 chars in production)** |
| `COOKIE_NAME` | Name for the HTTP-only JWT cookie (default: `helperhub_token`) |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | Override the `NODE_ENV`-derived cookie defaults |
| `FRONTEND_URL` | Comma-separated allowed origins for CORS **and** websockets |
| `CLOUDINARY_*` | Cloud Name, API Key, and API Secret |
| `GMAIL_USER` / `GMAIL_PASS` | Sending address and Gmail App-specific password |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Mail transport (defaults: `smtp.gmail.com`, `465`, `true`) |
| `RATE_LIMIT_*`, `OTP_*` | Tunables for limits and OTP policy |
| `LOGIN_MAX_ATTEMPTS`, `LOGIN_BLOCK_MS` | Per-account login lockout |
| `TWO_FACTOR_WINDOW_MS` | How long a password-verified login may wait for its second factor |
| `CRON_ENABLED`, `NODE_CRON_RUN` | Background job toggle, and whether this instance runs the scheduled jobs |
| `ENSURE_INDEXES` | Build schema indexes on boot (default `true`) |

### Frontend configuration

Angular has no `REACT_APP_*` equivalent — it swaps a whole file per build configuration
via `fileReplacements` in `angular.json`:

*   `src/environments/environment.ts` — development
*   `src/environments/environment.production.ts` — production

| Field | Description |
| :--- | :--- |
| `apiUrl` | Base URL of the REST API, including `/api`. Leave empty to derive from the page host |
| `socketUrl` | Socket.IO origin (defaults to `apiUrl` without `/api`) |
| `apiPort` | Port used when deriving the default API origin (default `5000`) |
| `apiTimeout` | Request timeout in ms (default `90000`). Sized for a cold-starting free-tier backend; drop to ~`30000` on an always-on plan so real failures surface quickly |
| `pageSize` | Items per page for the paginated lists |

> **These are build-time values, committed to the repo.** Setting them in a host's
> dashboard does nothing; change `environment.production.ts` (or pass `ng build --define`)
> and redeploy.

> **Leave `apiUrl` empty locally.** The session is an HTTP-only `SameSite=Lax` cookie, and
> browsers treat `localhost` and `127.0.0.1` as different *sites*. Pointing the app at one
> while serving it from the other makes the browser discard the cookie set by
> `POST /auth/login`, so every following request fails with `401 Not authorized, no token`
> and the websocket handshake is rejected. Deriving the API origin from `window.location`
> keeps the two aligned; set the field explicitly only when the API really is on another
> origin, and add that origin to the backend's `FRONTEND_URL`.

### Running Multiple Backend Instances

Scaling out horizontally needs one decision: which instance runs the cron jobs.
Duplicate runs are prevented by node-cron's own coordination — the auto-close job is
scheduled with `distributed: true`, and the default coordinator reads `NODE_CRON_RUN`.
Set it to `true` on **exactly one** instance and `false` on the rest; an instance with
`false` still schedules the job but skips every fire (`execution:skipped`, reason
`not-elected`). `noOverlap: true` separately stops a slow run from overlapping the next
tick within an instance.

Because a host's environment variables normally apply to every replica of a service,
`NODE_CRON_RUN=true` cannot single out one replica of a scaled service — give the
scheduler its own service (a background worker) with the flag on, and set it to `false`
on the scaled web service. For a coordinator that elects a winner at runtime instead,
pass `runCoordinator` to `cron.schedule`: a two-method interface
(`shouldRun`/`onComplete`) that any shared store can back.

## ☁️ Deployment

The frontend and backend deploy independently: the webapp is a static Angular bundle, the
backend is a long-lived process that owns websockets and the scheduler and therefore cannot
run on serverless functions.

| Piece | Target | Root directory |
| :--- | :--- | :--- |
| `webapp-angular/` | Vercel (static build) | `webapp-angular` — it reads `webapp-angular/vercel.json`, not the repo root |
| `backend/` | Render / Railway / Fly (persistent instance) | `backend` |

`vercel.json` sets framework `angular`, output directory `build`, an SPA rewrite to
`index.html`, and immutable caching for Angular's hashed `*-XXXXXXXX.js/css` filenames.

### Cross-site cookies

Once the two halves live on different domains the session cookie becomes
*cross-site*, and browsers only accept a cross-site cookie when it carries
`SameSite=None` **and** `Secure`. Setting `SameSite=None` on its own is worse than
leaving it `Lax` — the browser rejects the cookie outright and no request is ever
authenticated.

`backend/config/env.js` already derives both from `NODE_ENV`, so the correct
production behaviour needs no cookie configuration at all:

```js
cookieSecure:   toBool(process.env.COOKIE_SECURE, isProduction),        // → true
cookieSameSite: required("COOKIE_SAMESITE", isProduction ? "none" : "lax"),  // → "none"
```

> **Do not copy `backend/.env` into your host's dashboard wholesale.** A local file
> carrying `COOKIE_SECURE=false` and `COOKIE_SAMESITE=lax` is correct for development,
> since `Secure` cookies are not sent over `http://localhost` — but an explicit `false`
> **overrides** the `NODE_ENV` default above and silently breaks authentication in
> production. Set `NODE_ENV=production` and leave both cookie variables **unset**.

### Host configuration

Set on the **backend** host:

| Variable | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | The deployed frontend origin, e.g. `https://your-app.vercel.app` |
| `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `GMAIL_*` | Real credentials |
| `COOKIE_SECURE`, `COOKIE_SAMESITE` | Leave unset |

`FRONTEND_URL` feeds the CORS allowlist for both Express (`app.js`) and Socket.IO
(`realtime/socket.js`); if it still points at `localhost`, the browser blocks every
request before cookies are even considered.

For the **frontend**, commit the deployed API origin to `environment.production.ts`:

```ts
apiUrl: 'https://your-backend.onrender.com/api',
socketUrl: 'https://your-backend.onrender.com',
```

> Leave these empty and the frontend falls back to `<page-host>:5000`, so every
> request fails with `401 Not authorized, no token`.

### Free-tier caveats

Free tiers on Render and similar hosts **block outbound SMTP on ports 25, 465 and
587**, so OTP delivery through Gmail fails there — the OTP endpoints are the only
ones affected, because `utils/otp.js` awaits the send before responding. Either use
a paid instance or swap `utils/mailer.js` for an HTTP email API (Resend, Brevo,
SendGrid) that talks over port 443.

`config/email.js` sets explicit connection, greeting and socket timeouts so a
blocked or stalled SMTP connection fails fast with a logged error instead of
hanging the request until the client aborts.

Free instances also sleep when idle and cold-start on the next request, which is
why `apiTimeout` defaults to 90s. Lower it on an always-on plan.

## 🔌 API Conventions

*   All list endpoints accept `?page`, `?limit`, `?search`, `?sortBy`, `?sortOrder`
    plus resource-specific filters (`status`, `category`, `location`, `startFrom`,
    `startTo`).
*   Successful responses: `{ success: true, message, data, meta? }`.
*   Failures: `{ success: false, message, details? }` with an accurate status code —
    `400` validation, `401` unauthenticated, `403` forbidden, `404` missing,
    `409` conflict, `413` payload too large, `429` rate limited.
*   Authentication failures are deliberately indistinguishable from one another. A wrong
    password, an unknown address and an unmet second factor all answer with the same
    message and status so the endpoints cannot be used to enumerate accounts.
