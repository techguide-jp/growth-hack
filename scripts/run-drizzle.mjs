import { spawn } from "node:child_process";
import { isProductionLike, loadAppEnvFile } from "./lib/app-env.js";

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error("drizzle command is required");
	process.exit(1);
}

loadAppEnvFile();
const databaseUrl = process.env.DATABASE_URL;

if (isProductionLike() && !databaseUrl) {
	console.error("DATABASE_URL is required for production drizzle commands.");
	process.exit(1);
}

const child = spawn(process.execPath, ["node_modules/drizzle-kit/bin.cjs", ...args], {
	stdio: "inherit",
	env: {
		...process.env,
		...(databaseUrl ? { DATABASE_URL: databaseUrl } : {})
	},
});

child.on("exit", (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}

	process.exit(code ?? 0);
});
