# ADR-0001: Server Components + Server Actions, minimal client JS

**Status:** Accepted

## Context

A feedback board is mostly reads (the board, a post) with a few writes (post, vote, comment, status). We want fast first loads, SEO-able public pages, and little client JavaScript.

## Decision

- Pages are **React Server Components** that query the database directly; no client-side data fetching or API layer for reads.
- Mutations are **Server Actions** (`"use server"`) called straight from forms, with Zod validation server-side.
- Client Components are used only where interactivity needs them: the vote button (optimistic), forms (`useActionState`/`useFormStatus`), and the admin status control.

## Consequences

- The initial payload is small (see the build output in the README); most routes ship ~100 kB shared JS and a few hundred bytes of their own.
- No duplicated validation: the Zod schemas in `src/lib/validation.ts` run on the server, the single source of truth.
- Trade-off: logic runs on the server, so interactions cost a round trip. For this app that is fine; a latency-sensitive view would add more optimistic UI (as the vote button already does).
