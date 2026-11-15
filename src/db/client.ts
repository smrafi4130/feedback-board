import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { schema } from "./schema";

/**
 * Database driver selection.
 *
 * - With no DATABASE_URL (local dev, tests, CI): an in-process PGlite instance.
 *   Real Postgres compiled to WASM, so SQL, constraints and transactions behave
 *   as in production, with no server to run or test against.
 * - With DATABASE_URL set (production): swap in node-postgres. Query code is
 *   identical; only this file changes. See docs/adr/0002-database.md.
 *
 * PGlite is a single WASM instance and is not safe to drive with overlapping
 * operations. A long-running server (Next.js) renders layout + page and runs
 * server actions that can touch the database concurrently, so every operation
 * is funnelled through a one-at-a-time queue below. A real Postgres pool makes
 * this wrapper unnecessary.
 */
export type Database = ReturnType<typeof drizzlePglite<typeof schema>>;

// A single shared instance across all route bundles and HMR reloads. Next.js
// does not share module-level singletons across server bundles, so without this
// each route would open its own PGlite on the same data dir and corrupt it.
const globalForDb = globalThis as unknown as { __db?: Database; __dbReady?: Promise<void> };

/** Serialize all PGlite calls: each waits for the previous to settle. */
function serialize(pg: PGlite): PGlite {
  let chain: Promise<unknown> = Promise.resolve();
  const run = <T>(fn: () => Promise<T>): Promise<T> => {
    const result = chain.then(fn, fn);
    chain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
  const query = pg.query.bind(pg);
  const exec = pg.exec.bind(pg);
  const transaction = pg.transaction.bind(pg);
  return new Proxy(pg, {
    get(target, prop, receiver) {
      if (prop === "query") return (...args: Parameters<typeof query>) => run(() => query(...args));
      if (prop === "exec") return (...args: Parameters<typeof exec>) => run(() => exec(...args));
      if (prop === "transaction")
        return (...args: Parameters<typeof transaction>) => run(() => transaction(...args));
      return Reflect.get(target, prop, receiver);
    },
  });
}

function create(): { db: Database; init: Promise<void> } {
  const pg = serialize(new PGlite(process.env.PGLITE_DATA));
  const db = drizzlePglite(pg, { schema });
  const ddl = readFileSync(join(process.cwd(), "src/db/schema.sql"), "utf8");
  return { db, init: pg.exec(ddl).then(() => undefined) };
}

export function getDb(): Database {
  if (!globalForDb.__db) {
    const { db, init } = create();
    globalForDb.__db = db;
    globalForDb.__dbReady = init;
  }
  return globalForDb.__db;
}

/** Await schema creation before the first query. */
export async function ensureReady(): Promise<Database> {
  const db = getDb();
  await globalForDb.__dbReady;
  return db;
}
