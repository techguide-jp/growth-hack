import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { isProductionLike, loadAppEnvFile } from "./app-env.js";

const FALLBACK_DATABASE_URL =
	"postgresql://postgres:postgres@127.0.0.1:5432/growth_hach_dev";

loadAppEnvFile();

export function getDatabaseUrl() {
	if (process.env.DATABASE_URL) {
		return process.env.DATABASE_URL;
	}

	if (isProductionLike()) {
		throw new Error("DATABASE_URL is required in production.");
	}

	return FALLBACK_DATABASE_URL;
}

export function createDatabaseHandle() {
	const client = postgres(getDatabaseUrl(), { max: 1 });

	return {
		db: drizzle(client),
		query: client,
		async close() {
			await client.end();
		},
	};
}
