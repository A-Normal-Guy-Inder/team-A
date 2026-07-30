# HireHelper — Angular webapp

An Angular 21 port of `../webapp` (React 19 + Redux Toolkit + react-router 7). Same
backend, same API contract, same stylesheets. Nothing about the server changed.

```bash
npm install
npm start          # http://localhost:3000
npm run build      # production bundle into ./build
```

The backend is expected on port 5000 of the same host. See "Configuration" below.

### The dev server runs on 3000, not Angular's default 4200

This is deliberate. The backend's CORS allowlist defaults to the CRA dev port:

```js
// backend/config/env.js
const frontendUrls = toList(process.env.FRONTEND_URL, ["http://localhost:3000"]);
```

On 4200 every request is CORS-rejected, which the browser surfaces as `status 0`
and the app reports as "Cannot reach the server" — a misleading message for what is
really a blocked origin. Serving on 3000 keeps the backend untouched. To run both
frontends side by side instead, add the other port to `FRONTEND_URL` in
`backend/.env` (it accepts a comma-separated list) and restart the backend.

## Why this exists

The React app worked; it was the only frontend nobody on the team could read
comfortably. This port trades a known-good codebase for one that is maintainable
by the people who own it. The behaviour is meant to be indistinguishable — where
it is not, this file says so.

## How the React concepts map

| React app | Here |
| --- | --- |
| Redux slice (`features/auth/authSlice.js`) | Signal store (`state/auth.store.ts`) |
| `createAsyncThunk` | `async` method on the store returning `Result<T>` |
| `useSelector(selectX)` | `computed()` exposed as a public field |
| `dispatch(action(payload))` | plain method call: `store.action(payload)` |
| `useState` | `signal()` |
| `useEffect` | `effect()` — or a constructor, when it ran once |
| `useMemo` / derived render values | `computed()` |
| `useRef` on a DOM node | `viewChild(..., { read: ElementRef })` |
| `useDebouncedValue` hook | `shared/debounced.ts` |
| `useRealtime` hook | `core/realtime.service.ts` |
| axios instance + interceptor | `core/api.service.ts` + `core/unauthorized.interceptor.ts` |
| `<ProtectedRoute>` wrapper | `authGuard` (`core/auth.guards.ts`) |
| `<PublicOnlyRoute>` wrapper | `publicOnlyGuard` |
| `React.lazy` + `<Suspense>` | `loadComponent` + the loader in `app.ts` |
| `location.state` | `core/navigation-state.ts` |
| `react-toastify` | `core/toast/` (hand-rolled, no dependency) |
| `lucide-react` | `shared/icons.ts` (four inlined SVGs) |
| CRA + craco + `craco.config.js` | Angular CLI; Tailwind via `.postcssrc.json` |

### Two things worth knowing before you edit

**Everything the template reads must be a signal.** There is no zone.js — a plain
class field mutated in a click handler will not repaint. This is why components
here have `readonly loading = signal(false)` rather than `loading = false`.

**Never call a store action from a tracked reactive context.** A store action reads
current state to build its request and then writes that state back. Called from
inside an `effect` with the read tracked, the effect gains a dependency on the
store, the write re-triggers the effect, and it fetches forever — which freezes the
browser tab, not just the component. Two defences are in place and both should stay:

- store actions read state through an untracked `snapshot()`, never `this.state()`;
- callers wrap the action in `untracked(...)`, so an effect's dependency set is
  exactly the signals read above that boundary.

`state/store-reentrancy.spec.ts` covers this. With the guard removed it does not
merely fail — it kills the vitest worker.

**Store actions return a `Result`, not a thrown error.** The Redux code branched
on `createTask.rejected.match(result)`; the equivalent is:

```ts
const result = await this.tasks.createTask(formData);
if (!result.ok) {
  this.toasts.error(result.error);
  return;
}
```

## Layout

```
src/app/
  core/        config, HTTP, socket, realtime, toasts, guards, nav state
  shared/      validation, datetime, pagination, icons, loader, password input
  state/       the five stores that replaced the Redux slices
  auth/        login, signup, verify-email, forgot-password, reset-password
  dashboard/   shell, sidebar, topbar, cards, modals, pages
  settings/    settings, update-profile, change-email, change-password
  styles/      auth.css, dashboard.css, loader.css, settings.css — copied verbatim
```

The four stylesheets are registered as **global** styles in `angular.json`, not as
component styles. They are written as global class selectors and Angular's default
style scoping would break every one of them.

## Configuration

CRA read `REACT_APP_*` from the shell at build time. Angular swaps a whole file per
build configuration instead:

- `src/environments/environment.ts` — development
- `src/environments/environment.production.ts` — production, via `fileReplacements`

| Old | New |
| --- | --- |
| `REACT_APP_API_URL` | `environment.apiUrl` |
| `REACT_APP_SOCKET_URL` | `environment.socketUrl` |
| `REACT_APP_API_PORT` | `environment.apiPort` |
| `REACT_APP_PAGE_SIZE` | `environment.pageSize` |
| `REACT_APP_API_TIMEOUT` | `environment.apiTimeout` |

**This is a deployment change.** Setting `REACT_APP_API_URL` in the Vercel dashboard
no longer does anything — the value has to be committed to
`environment.production.ts`, or passed via `ng build --define`. Leaving a field empty
keeps the old runtime fallback: the API origin is derived from `window.location`, so
a same-host deployment needs no configuration at all.

`vercel.json` was updated to match: framework `angular`, and the immutable-cache
header now targets Angular's hashed `*-XXXXXXXX.js/css` filenames instead of CRA's
`/static/` directory.

## Deliberate differences from the React app

Three, all small:

1. **The `from` path on an auth redirect is gone.** `ProtectedRoute` attached
   `state: { from }` when bouncing to `/login`, but no screen ever read it, and an
   Angular `UrlTree` cannot carry navigation state. Reimplementing it as a query
   parameter would have changed the login URL.
2. **Toasts are ours.** `core/toast/` — no library. Same top-right position and
   colour-coded bar as react-toastify, plus a drain-down progress bar, an exit
   animation, and pause-on-hover so a message cannot expire mid-read. Auto-close is
   4s (react-toastify was configured at 3s; the progress bar makes the longer window
   readable rather than nagging). `App.css`, which existed only to override
   react-toastify's internals with `!important`, is gone.
3. **The auth check happens before the route activates, not during.** React rendered
   `<Loader />` inside `ProtectedRoute` while `/auth/me` was in flight; the guard
   awaits it, and `app.ts` shows the loader for the whole pending navigation. Same
   pixels, different mechanism.

Everything else — the OTP flow routing, the 60s resend cooldown, the click-outside
dismissal on the notification dropdown, the 400ms search debounce that skips the
delay when you clear the box, the silent-401 path list, the 90s timeout for
cold-starting free-tier backends — behaves as it did. Route casing is unchanged too
(`/Dashboard`, `/ForgotPassword`, `/ResetPassword`), since Angular matches
case-sensitively and those spellings are already in the wild.

## Verification status

Built clean (`npm run build`), tests pass, zero unprocessed Tailwind directives in
the output CSS, zero app-level console errors.

Exercised against a **stopped** backend: login, signup, forgot-password, the
`/verify` guard, the unknown-route redirect, and the `/Dashboard` auth redirect.

Exercised against a **running** backend: sign-in and the dashboard load. This is
what surfaced the store re-entrancy loop described above — the dashboard froze the
tab on first real login, in both Chrome and Brave. Fixed and covered by a test.

Still only lightly walked: the individual dashboard flows — creating and editing a
task, sending a request, accepting/rejecting one, pagination, the notification
dropdown, and socket-driven live updates. They are code-complete and the shell they
live in now works, but each deserves a click-through before this replaces `webapp/`
in production.

## Tests

```bash
npm test
```

`state/store-reentrancy.spec.ts` — three specs pinning the effect/store re-entrancy
guard described above. This is the one defect from the port that reached a browser,
so it is the one thing covered by a test.

## What was not ported

`webapp/src/config/config.test.js` and `webapp/src/App.test.js`. They test CRA
scaffolding and a config module that no longer has the same shape. Angular's test
target (`npm test`, vitest) is configured and has no specs yet.
