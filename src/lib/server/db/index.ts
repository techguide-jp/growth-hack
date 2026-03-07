import { dev } from "$app/environment";
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
  return Boolean(getConfiguredDatabaseUrl());
}

function isProductionLike() {
  return !dev || env.APP_ENV === "production";
}

function getConfiguredDatabaseUrl() {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  return null;
}

function getDatabaseUrl() {
  const databaseUrl = getConfiguredDatabaseUrl();

  if (databaseUrl) {
    return databaseUrl;
  }

  if (isProductionLike()) {
    throw new Error("DATABASE_URL is required in production.");
  }

  return FALLBACK_DATABASE_URL;
}

export function getDb() {
  const databaseUrl = getDatabaseUrl();

  if (!queryClient || activeDatabaseUrl !== databaseUrl) {
    queryClient = postgres(databaseUrl, { max: 1 });
    dbInstance = drizzle(queryClient, { schema });
    activeDatabaseUrl = databaseUrl;
  }

  return dbInstance as ReturnType<typeof drizzle>;
}
