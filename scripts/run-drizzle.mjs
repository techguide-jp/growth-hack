import { spawn } from "node:child_process";
import { isProductionLike, loadAppEnvFile } from "./lib/app-env.js";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("drizzle command is required");
  process.exit(1);
}

loadAppEnvFile();
const databaseUrl = process.env.DATABASE_URL?.trim();

if (databaseUrl) {
  const parsed = new URL(databaseUrl);
  const hasHost = parsed.hostname.length > 0;
  const hasSocketHost = parsed.searchParams.has("host");

  if (!hasHost && !hasSocketHost) {
    console.error(
      "Invalid DATABASE_URL: DATABASE_URL must include a hostname or host query parameter.",
    );
    process.exit(1);
  }
}

if (isProductionLike() && !databaseUrl) {
  console.error("DATABASE_URL is required for production drizzle commands.");
  process.exit(1);
}

const child = spawn(
  process.execPath,
  ["node_modules/drizzle-kit/bin.cjs", ...args],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ...(databaseUrl ? { DATABASE_URL: databaseUrl } : {}),
    },
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
