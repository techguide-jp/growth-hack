import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const FALLBACK_DATABASE_URL =
	"postgresql://postgres:postgres@127.0.0.1:5432/growth_hach_dev";

export function getDatabaseUrl() {
	return process.env.DATABASE_URL || FALLBACK_DATABASE_URL;
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
