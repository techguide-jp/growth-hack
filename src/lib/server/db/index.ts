import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "$env/dynamic/private";
import * as schema from "$lib/server/db/schema";

const FALLBACK_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:5432/growth_hach_dev";

let queryClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;
let activeDatabaseUrl: string | null = null;

export function hasDatabaseUrl() {
  return Boolean(env.DATABASE_URL);
}

export function getDb() {
  const databaseUrl = env.DATABASE_URL || FALLBACK_DATABASE_URL;

  if (!queryClient || activeDatabaseUrl !== databaseUrl) {
    queryClient = postgres(databaseUrl, { max: 1 });
    dbInstance = drizzle(queryClient, { schema });
    activeDatabaseUrl = databaseUrl;
  }

  return dbInstance as ReturnType<typeof drizzle>;
}
