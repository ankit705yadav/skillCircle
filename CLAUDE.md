# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SkillCircle is a location-based skill-sharing platform. Users post skills they **OFFER** or **ASK** for. Others nearby find those posts and send a connection request. Once the post author accepts, the two can chat. It is a monorepo with two independent apps:

- `backend/` — Spring Boot 3.5 (Java 21, Maven), PostgreSQL + PostGIS, STOMP WebSockets
- `frontend/` — Next.js 15 (App Router, React 19, Turbopack), Clerk auth, MUI + Tailwind v4

## Commands

### Backend (run from `backend/`)
The Maven wrapper (`mvnw`) is gitignored, so use a system `mvn`.
```bash
mvn spring-boot:run                 # start API on :8080
mvn package                         # build jar (runs tests)
mvn test                            # run tests
mvn test -Dtest=SkillcircleApplicationTests          # single test class
mvn test -Dtest=SkillcircleApplicationTests#method   # single test method
```
The backend needs a local PostgreSQL database `skillcircle` (user/pass `postgres`/`postgres`) with the **PostGIS extension** enabled. `UserAccount.location` is `geometry(Point,4326)`, and the nearby query uses `ST_DWithin`. The schema is managed by `spring.jpa.hibernate.ddl-auto=update`. There are no migrations. The only test is the `@SpringBootTest` context-load test, and it needs the database too.

### Frontend (run from `frontend/`)
```bash
npm run dev     # next dev --turbopack on :3000
npm run build   # next build --turbopack
npm run lint    # eslint (next/core-web-vitals + next/typescript)
```
The frontend has no test setup. It needs `frontend/.env.local` (gitignored) with:
- `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:8080`). Every fetch and the SockJS URL are built from this.
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`, plus the standard Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)

## Architecture

### Auth flow (Clerk → Spring resource server)
- Clerk handles all sign-in on the frontend (`src/middleware.ts`, `app/sign-in`, `app/sign-up`). Client components call `useAuth().getToken()` and send `Authorization: Bearer <token>` on every request. The frontend has no API client wrapper. Each page calls `fetch` directly.
- The backend is an OAuth2 JWT resource server. It validates tokens against Clerk's JWKS URI in `application.properties`. **The Clerk user ID (`jwt.getSubject()`) is the identity used everywhere.** Controllers take `@AuthenticationPrincipal Jwt jwt`, and services look users up with `findByClerkUserId`. `SkillPost.author` joins on `clerkUserId`, not on the numeric `id`.
- `SecurityConfig`: `/api/stats` and `/ws/**` are public, and every other `/api/**` route needs a JWT. CORS and WebSocket origins are hardcoded to localhost:3000/3001.

### User onboarding
`AppInitializer` (in the root layout) uses `useUserSetup`, which calls `GET /api/users/me`. That endpoint find-or-creates the `UserAccount`. If `generatedUsername` is null, `UsernameSelectionModal` blocks the app until the user claims one of the server-generated names (`UsernameGenerator`; format `^[A-Z][a-zA-Z]+[0-9]{2}$`). Users never see real names. They only see generated usernames. `UserLocationSync` posts browser geolocation to `/api/users/sync`, which feeds the PostGIS nearby search (`GET /api/skills/nearby`).

### Domain model
`UserAccount` → `SkillPost` (OFFER/ASK, soft-deleted with an `archived` flag) → `Connection` (requester, approver = post author, status `PENDING/ACCEPTED/REJECTED/COMPLETED`) → `Message`. A message belongs to one **connection**, not to a pair of users. Messages can only be sent on ACCEPTED connections by one of its two participants. These checks live in `MessageService`.

### Backend conventions
- Layering is controller → service → repository. Entities live in `com.skillcircle.Entity` (capital E) and use plain getters and setters, with no Lombok.
- Controllers always convert entities to `record` DTOs with private `convertToDto` helpers. Each controller has its own copy. This avoids Jackson serialization problems with lazy `@ManyToOne` relations, so never return entities directly.
- Services signal errors by throwing exceptions: `IllegalArgumentException` (not found or bad input), `IllegalStateException` (conflict), and `SecurityException` (forbidden). Controllers map them to HTTP status codes with try/catch. There is no global `@ControllerAdvice`.
- Content moderation: `SkillPostService` checks title and description with the Google Perspective API (`ModerationService`, toxicity > 0.5 is rejected, and it fails open). Post images are checked **on the client** with `nsfwjs`/TensorFlow.js in `ImageUpload.tsx`, and then uploaded directly to ImageKit using signed parameters from `GET /api/imagekit/auth`.

### Real-time (STOMP over SockJS)
See `WEBSOCKET_IMPLEMENTATION.md` for full details. Its file paths are partly out of date: the chat route is `app/chats/[userId]`, not `[connectionId]`.
- Backend: `WebSocketConfig` exposes the `/ws` endpoint with SockJS and uses a simple in-memory broker (`/topic`, `/queue`). `WebSocketAuthInterceptor` decodes the Bearer token from the STOMP CONNECT headers and sets the principal, so `convertAndSendToUser(clerkUserId, ...)` routes by Clerk ID. If the token is invalid, the connection is still allowed, just without a principal.
- Pushes happen in **controllers**, after the service call, through `NotificationService`. They go to `/user/queue/notifications` as a `NotificationDTO` with `type` set to `CONNECTION_REQUEST`, `CONNECTION_ACCEPTED`, `NEW_MESSAGE` or `CONNECTION_STATUS_CHANGED`. Chat messages are also sent to `/topic/connection/{connectionId}`.
- Frontend: `WebSocketProvider` (`src/lib/contexts/WebSocketContext.tsx`, mounted in `app/layout.tsx`) holds the one shared STOMP client. It reconnects with a fresh Clerk token (`skipCache: true`), keeps unread counts, and shows toasts. Pages use `useWebSocket()` and `subscribeToConnection(id, cb)`.
- The chat page `app/chats/[userId]` merges messages from **all** active connections with that user into one timeline. It sends new messages on the primary connection.

### Frontend layout
- Pages live in `src/app/*`. App-specific components are in `src/app/components/` and often have a co-located `.css` file. shadcn/ui-style primitives are in `src/components/ui/` (`components.json`). The `@/*` alias maps to `src/*`.
- Styling mixes MUI (`ThemeRegistry` + `src/theme.ts`, Emotion), Tailwind v4 (`globals.css`), and plain CSS files. Use `sonner` for toasts and `lucide-react` for icons.
