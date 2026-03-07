import { defineConfig } from "drizzle-kit";
import { isProductionLike, loadAppEnvFile } from "./scripts/lib/app-env.js";

loadAppEnvFile();
const databaseUrl = process.env.DATABASE_URL?.trim();

if (databaseUrl) {
  const parsed = new URL(databaseUrl);
  const hasHost = parsed.hostname.length > 0;
  const hasSocketHost = parsed.searchParams.has("host");

  if (!hasHost && !hasSocketHost) {
    throw new Error(
      "Invalid DATABASE_URL: DATABASE_URL must include a hostname or host query parameter.",
    );
  }
}

if (isProductionLike() && !databaseUrl) {
  throw new Error("DATABASE_URL is required for production drizzle commands.");
}

export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl || "",
  },
});
