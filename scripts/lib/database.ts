import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { isProductionLike, loadAppEnvFile } from "./app-env.js";

const FALLBACK_DATABASE_URL =
	"postgresql://postgres:postgres@127.0.0.1:5432/growth_hach_dev";

loadAppEnvFile();

export function getDatabaseUrl() {
	if (process.env.DATABASE_URL) {
		const databaseUrl = process.env.DATABASE_URL.trim();

		if (databaseUrl.length === 0) {
			throw new Error("DATABASE_URL must not be empty.");
		}

		try {
			const parsed = new URL(databaseUrl);
			const hasHost = parsed.hostname.length > 0;
			const hasSocketHost = parsed.searchParams.has("host");

			if (!hasHost && !hasSocketHost) {
				throw new Error(
					"DATABASE_URL must include a hostname or host query parameter."
				);
			}

			return databaseUrl;
		} catch (error) {
			throw new Error(
				`Invalid DATABASE_URL: ${error instanceof Error ? error.message : "failed to parse database url."}`
			);
		}
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
