import { sql } from "drizzle-orm";
import { createDatabaseHandle } from "./lib/database.ts";

async function resetDb() {
  const { db, close } = createDatabaseHandle();

  try {
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
    await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
    await db.execute(sql`CREATE SCHEMA public`);
    await db.execute(sql`CREATE SCHEMA drizzle`);
    console.log("db reset complete");
  } finally {
    await close();
  }
}

resetDb().catch((error: unknown) => {
  console.error("db reset failed", error);
  process.exit(1);
});
