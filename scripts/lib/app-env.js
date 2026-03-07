import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function getAppEnv() {
	const appEnv = process.env.APP_ENV?.trim().toLowerCase();
	return appEnv || null;
}

export function getAppEnvFilePath() {
	const appEnv = getAppEnv();
	return resolve(process.cwd(), appEnv ? `.env.${appEnv}` : ".env");
}

export function loadAppEnvFile() {
	const envFilePath = getAppEnvFilePath();

	if (!existsSync(envFilePath)) {
		return null;
	}

	process.loadEnvFile(envFilePath);
	return envFilePath;
}

export function isProductionLike() {
	return process.env.NODE_ENV === "production" || getAppEnv() === "production";
}
