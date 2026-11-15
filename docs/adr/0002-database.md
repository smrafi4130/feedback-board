# ADR-0002: Drizzle ORM, PGlite for dev/test, Postgres for production

**Status:** Accepted

## Context

The app needs a relational store (users, posts, votes with a uniqueness rule, comments, sessions). It should be trivial to run and test locally, and run on managed Postgres in production.

## Decision

- **Drizzle ORM** for a typed schema and queries with no heavy runtime.
- **PGlite** (Postgres compiled to WASM, in-process) when `DATABASE_URL` is unset: real Postgres semantics — constraints, cascades, transactions — with zero setup, used for local dev, the Vitest integration tests and CI.
- **node-postgres** in production via `DATABASE_URL`. Only `src/db/client.ts` changes; every query is identical.

## Consequences

- `src/features/posts-repo.test.ts` runs the real SQL (ordering, the one-vote-per-user unique index, cascade deletes) against actual Postgres on every CI run, no service container needed.
- PGlite is a single in-process instance, so the client funnels operations through a queue and shares one instance via `globalThis` (Next.js does not share module singletons across route bundles — without this, each route opens its own PGlite on the same data dir and corrupts it). A production Postgres pool removes both concerns.
- Limitation: the dev/test database is per-process and resets unless `PGLITE_DATA` points at a directory. It is not for production load.
