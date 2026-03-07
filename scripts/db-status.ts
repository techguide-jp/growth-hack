import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { createDatabaseHandle } from "./lib/database.ts";

function parseMigrationFileName(name: string): boolean {
	return /^[0-9]{4,}_.*\.sql$/.test(name);
}

function getMigrationHash(filePath: string): string {
	const sqlText = readFileSync(filePath, "utf8");
	return createHash("sha256").update(sqlText).digest("hex");
}

type LocalMigration = {
	fileName: string;
	hash: string;
};

function listLocalMigrations(): LocalMigration[] {
	const migrationDir = resolve(process.cwd(), "drizzle", "migrations");

	return readdirSync(migrationDir)
		.filter(parseMigrationFileName)
		.sort()
		.map((fileName) => ({
			fileName,
			hash: getMigrationHash(resolve(migrationDir, fileName)),
		}));
}

type DatabaseHandle = ReturnType<typeof createDatabaseHandle>;
type DatabaseQuery = DatabaseHandle["query"];

async function getMigrationTableSchema(
	query: DatabaseQuery
): Promise<"drizzle" | null> {
	const rows = await query.unsafe<{ table_schema: string }[]>(`
		SELECT table_schema
		FROM information_schema.tables
		WHERE table_name = '__drizzle_migrations' AND table_schema = 'drizzle'
	`);

	return rows.some((row) => row.table_schema === "drizzle") ? "drizzle" : null;
}

async function listPublicTables(query: DatabaseQuery): Promise<Set<string>> {
	const rows = await query.unsafe<{ table_name: string }[]>(`
		SELECT table_name
		FROM information_schema.tables
		WHERE table_schema = 'public'
	`);

	return new Set(rows.map((row) => row.table_name));
}

type AppliedMigration = {
	id: string;
	hash: string | null;
	created_at: string;
};

async function getAppliedMigrations(
	query: DatabaseQuery,
	migrationTableSchema: "drizzle"
): Promise<AppliedMigration[]> {
	const rows = await query.unsafe<{
		id: string | number;
		hash: string | null;
		created_at: string;
	}[]>(
		`SELECT id, hash, created_at FROM ${migrationTableSchema}.__drizzle_migrations ORDER BY created_at ASC`
	);

	return rows.map((row) => ({
		id: String(row.id),
		hash: row.hash,
		created_at: row.created_at,
	}));
}

async function main() {
	const { query, close } = createDatabaseHandle();

	try {
		const migrationTableSchema = await getMigrationTableSchema(query);
		if (!migrationTableSchema) {
			console.warn("migration status: drizzle migration テーブルが見つかりません。");
			console.warn("=> db:push 実行済み、またはまだ `drizzle migrate` が未実行の可能性があります。");
			console.warn("=> migration テーブルがないため、migration 履歴比較は実行できません。");

			const existingTables = await listPublicTables(query);
			const sortedTables = [...existingTables].sort();
			console.log("public schema table check:");
			if (sortedTables.length === 0) {
				console.log("  - none");
				return;
			}
			for (const tableName of sortedTables) {
				console.log(`  - ${tableName}`);
			}
			return;
		}

		const localMigrations = listLocalMigrations();
		const appliedMigrations = await getAppliedMigrations(
			query,
			migrationTableSchema
		);

		const localByHash = new Map(
			localMigrations.map((migration) => [migration.hash, migration.fileName])
		);
		const localHashSet = new Set(localMigrations.map((migration) => migration.hash));
		const appliedHashSet = new Set(
			appliedMigrations
				.map((migration) => migration.hash)
				.filter((hash): hash is string => hash !== null)
		);

		const pendingMigrations = localMigrations.filter(
			(localMigration) => !appliedHashSet.has(localMigration.hash)
		);
		const extraMigrations = appliedMigrations.filter((applied) => {
			if (applied.hash === null) {
				return true;
			}
			return !localHashSet.has(applied.hash);
		});

		console.log("Migration status");
		console.log(`table: ${migrationTableSchema}.__drizzle_migrations`);
		console.log(`local migrations: ${localMigrations.length}`);
		console.log(`applied migrations: ${appliedMigrations.length}`);
		console.log(`pending migrations: ${pendingMigrations.length}`);
		console.log("");

		if (pendingMigrations.length > 0) {
			console.log("Pending (local has not applied):");
			for (const migration of pendingMigrations) {
				console.log(`- ${migration.fileName}`);
			}
			console.log("");
		}

		if (extraMigrations.length > 0) {
			console.log("Extra (DB has but local file missing):");
			for (const migration of extraMigrations) {
				const migrationFile = migration.hash === null ? undefined : localByHash.get(migration.hash);
				console.log(`- ${migrationFile ?? migration.id}`);
			}
			console.log("");
		}

		console.log("Latest applied:");
		const latest = appliedMigrations.at(-1);
		if (!latest) {
			console.log("- none");
		} else {
			const latestFile = latest.hash === null ? undefined : localByHash.get(latest.hash);
			console.log(`- file: ${latestFile ?? "(unknown)"}`);
			console.log(`- hash: ${latest.hash ?? "(none)"}`);
			console.log(`- created_at: ${latest.created_at}`);
		}
	} finally {
		await close();
	}
}

main().catch(async (error: unknown) => {
	console.error("migration status failed:", error);
	process.exit(1);
});
