import { spawnSync } from "node:child_process";
import { lookup } from "node:dns/promises";

const registryHost = "registry.npmjs.org";

try {
  await lookup(registryHost);
} catch (error) {
  const message = `${error?.code ?? ""} ${(error?.message ?? String(error)).toLowerCase()}`;
  if (
    message.includes("enotfound") ||
    message.includes("eai_again") ||
    message.includes("network")
  ) {
    console.warn(
      "WARN: レジストリ DNS 解決に失敗したため pnpm audit をスキップしました。",
    );
    process.exit(0);
  }
  throw error;
}

const result = spawnSync("pnpm", ["audit", "--audit-level", "high"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  shell: false,
});

const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

if (result.status === 0) {
  process.exit(0);
}

const lowerOutput = output.toLowerCase();
const isOfflineError =
  lowerOutput.includes("enotfound") ||
  lowerOutput.includes("getaddrinfo") ||
  lowerOutput.includes("eai_again") ||
  lowerOutput.includes("network");

if (isOfflineError) {
  console.warn(
    "WARN: pnpm audit はネットワーク到達不可のためスキップしました。",
  );
  console.warn(output.trim());
  process.exit(0);
}

if (output.trim().length > 0) {
  process.stderr.write(output);
}

process.exit(result.status ?? 1);
