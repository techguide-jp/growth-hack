import { defineConfig } from "drizzle-kit";
import { isProductionLike, loadAppEnvFile } from "./scripts/lib/app-env.js";

loadAppEnvFile();
const databaseUrl = process.env.DATABASE_URL;

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
