import { readFileSync } from "node:fs";
import { createDatabaseHandle } from "./lib/database.ts";

type QueryResultRow = Record<string, unknown>;

function resolveSqlFromCliOrStdin(): string {
	const args = process.argv.slice(2).join(" ").trim();
	if (args.length > 0) {
		return args;
	}

	if (process.stdin.isTTY) {
		return "";
	}

	const stdinSql = readFileSync(0, "utf8").trim();
	return stdinSql;
}

async function main() {
	const sql = resolveSqlFromCliOrStdin();

	if (!sql) {
		console.error(
			'query not provided. usage: pnpm db:query "SELECT ..." or echo "..." | pnpm db:query'
		);
		process.exit(1);
	}

	const { query, close } = createDatabaseHandle();

	try {
		const result = await query.unsafe<QueryResultRow[]>(sql);
		const rowCount = Number(result.count ?? result.length ?? 0);
		console.log(`rowCount: ${rowCount}`);

		if (result.length > 0) {
			console.table(result);
		} else {
			console.log("(no rows)");
		}
	} catch (error: unknown) {
		console.error("db query failed", error);
		process.exit(1);
	} finally {
		await close();
	}
}

main().catch(async (error: unknown) => {
	console.error("db query failed", error);
	await Promise.resolve();
	process.exit(1);
});
