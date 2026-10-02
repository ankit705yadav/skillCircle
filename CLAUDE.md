# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SkillCircle is a location-based skill-sharing platform. Users post skills they **OFFER** or **ASK** for. Others nearby find those posts and send a connection request. Once the post author accepts, the two can chat. There is no app server:

- `frontend/` — Next.js 15 (App Router, React 19, Turbopack), MUI + Tailwind v4. It talks to Supabase directly with `supabase-js`.
- `supabase/` — Postgres + PostGIS schema, RLS policies, SQL functions, Edge Functions (Deno), and pgTAP tests, managed with the Supabase CLI.

## Commands

### Supabase (run from repo root, needs Docker)
```bash
npx supabase start            # local stack; prints URL + publishable key
npx supabase stop
npx supabase db reset         # recreate DB from supabase/migrations
npx supabase test db          # pgTAP tests in supabase/tests/
npx supabase functions serve  # run Edge Functions (reads supabase/functions/.env)
npx supabase migration new <name>
npx supabase gen types typescript --local > frontend/src/lib/supabase/database.types.ts
```
Local ports are moved to **553xx** in `supabase/config.toml` (API `http://127.0.0.1:55321`, Studio `:55323`, Mailpit `:55324`) so this project doesn't clash with other local Supabase projects. After any schema change, regenerate `database.types.ts`.

Edge Function secrets go in `supabase/functions/.env` locally (template: `.env.example`) and are set with `supabase secrets set` in production: `OPENAI_API_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`.

### Frontend (run from `frontend/`)
```bash
npm run dev     # next dev --turbopack on :3000
npm run build
npm run lint
```
`frontend/.env.local` (template: `.env.example`) needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`.

## Architecture

### Security lives in the database
All access control is in `supabase/migrations/`, through RLS policies, triggers, and **column-level grants**. The frontend is untrusted. When you change behavior, change the migration and add a case to `supabase/tests/rls_test.sql`. Key rules:
- `skill_posts` has **no client INSERT**. Posts can only be created by the `create-post` Edge Function, which moderates the text with OpenAI's moderation endpoint and **fails closed**: it returns 503 if moderation can't run. Clients may only `UPDATE (archived)` on their own posts.
- `connections`: clients insert only `skill_post_id`. `requester_id` defaults to `auth.uid()`, and a trigger sets `approver_id` to the post author. Only the approver may update `status`, and a trigger allows only `PENDING → ACCEPTED/REJECTED` (it also sets `accepted_at`). A partial unique index blocks duplicate open requests.
- `messages`: clients insert only `connection_id` and `content`. `sender_id` defaults to `auth.uid()`. Messages can only be sent on ACCEPTED connections by a participant.
- `user_locations` is a separate table that only its owner can read. `nearby_posts()` is `security definer` so it can do the PostGIS `ST_DWithin` search without exposing anyone's coordinates.
- Usernames are generated server-side (`generate_usernames()`) and claimed once (`claim_username()`). Users are only ever shown by username.
- Errors raised in SQL with `P0001`/`P0002`/`22023` codes are user-facing. `toError` in `queries.ts` passes them through to toasts.

### Auth
Supabase Auth with email + password. `@supabase/ssr` keeps the session in cookies. `src/middleware.ts` refreshes the session, and `app/auth/callback/route.ts` exchanges email-confirmation codes. A trigger on `auth.users` creates a `profiles` row with no username. `AuthProvider` (`src/lib/contexts/AuthContext.tsx`) exposes `user`, `profile`, and `isLoaded`. `AppInitializer` blocks the app with `UsernameSelectionModal` until `profile.username` is set.

### Frontend data layer
All pages are client components. Every query goes through `src/lib/supabase/queries.ts`, which uses PostgREST embedded selects with aliases (e.g. `author:profiles!author_id(id, username)`, `posterImageUrl:poster_image_url`) to return the camelCase `SkillPost`/`Connection`/`Message` shapes the UI uses. Add new queries there rather than calling `getSupabase()` from components.

### Realtime
`RealtimeProvider` (`src/lib/contexts/RealtimeContext.tsx`) opens one channel per signed-in user with **Postgres Changes** on `connections` and `messages`. Both tables are in the `supabase_realtime` publication. RLS filters the events, so users only get rows they can read. Payloads are raw rows without joined data, so the provider fetches usernames and posts when a toast needs them. Pages use `useRealtime()`: `isConnected`, `notifications`, unread counts, and `subscribeToConnection(connectionId, cb)`, which reuses the single channel.

The chat route `app/chats/[userId]` is keyed by the **other user's id**. It merges messages from all accepted connections with that user into one timeline and sends on the most recently accepted one.

### Images
Images are checked in the browser with `nsfwjs` (`ImageUpload.tsx`; this can be bypassed). They are then uploaded directly to ImageKit using a signature from the `imagekit-auth` Edge Function. `create-post` only accepts poster URLs that start with `IMAGEKIT_URL_ENDPOINT`.

### Frontend layout
- App components are in `src/app/components/` and often have a co-located `.css` file. shadcn/ui primitives are in `src/components/ui/`. The `@/*` alias maps to `src/*`.
- Styling mixes MUI (`ThemeRegistry` + `src/theme.ts`), Tailwind v4 (`globals.css`), and plain CSS. Use `sonner` for toasts and `lucide-react` for icons.
