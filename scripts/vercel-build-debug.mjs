import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";

const require = createRequire(import.meta.url);
const workspaceRoot = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const ignoredMissingPathPatterns = [
  "/.local/share/pnpm/.tools/pnpm/",
  "/usr/bin",
  "/proc/",
];
const pnpmTemporaryPathPatterns = [
  "/.local/share/pnpm/.tools/pnpm/",
  `${path.sep}.tools${path.sep}pnpm${path.sep}`,
];

function isIgnoredMissingPath(targetPath) {
  if (!targetPath) {
    return false;
  }

  return ignoredMissingPathPatterns.some((pattern) => targetPath.includes(pattern));
}

function isPnpmTemporaryPath(targetPath) {
  if (!targetPath) {
    return false;
  }

  return pnpmTemporaryPathPatterns.some((pattern) => targetPath.includes(pattern));
}

function log(label, value) {
  if (value === undefined) {
    return;
  }

  console.error(`[codex:vercel-debug] ${label}: ${value}`);
}

function safeResolve(specifier) {
  try {
    return require.resolve(specifier);
  } catch {
    return "<unresolved>";
  }
}

function patchNftLogging() {
  const nftPath = require.resolve("@vercel/nft/out/node-file-trace.js");
  const source = fs.readFileSync(nftPath, "utf8");

  const replacement = `if (source === null) {\n                const missingFileContext = {\n                    requestedPath: path,\n                    realPath,\n                    parent,\n                    depth,\n                    base: this.base,\n                    cwd: this.cwd,\n                    execPath: process.execPath,\n                    npmExecPath: process.env.npm_execpath,\n                    nodePath: process.env.NODE_PATH,\n                    userAgent: process.env.npm_config_user_agent,\n                };\n                console.error('[codex:nft-missing-file]', JSON.stringify(missingFileContext, null, 2));\n                if (realPath.includes('/.local/share/pnpm/.tools/pnpm/') || realPath.startsWith('/usr/bin') || realPath.startsWith('/proc/')) {\n                    console.error('[codex:nft-ignored-missing-file]', JSON.stringify(missingFileContext, null, 2));\n                    return;\n                }\n                throw new Error('File ' + realPath + ' does not exist.');\n            }`;
  const patchedBlock = /if \(source === null\) \{[\s\S]*?throw new Error\('File ' \+ realPath \+ ' does not exist\.'\);\n\s*\}/;
  const originalBlock = "if (source === null)\n                throw new Error('File ' + realPath + ' does not exist.');";

  let nextSource = source;

  if (patchedBlock.test(source)) {
    nextSource = source.replace(patchedBlock, replacement);
  } else if (source.includes(originalBlock)) {
    nextSource = source.replace(originalBlock, replacement);
  } else {
    throw new Error(`@vercel/nft のパッチ対象が見つかりません: ${nftPath}`);
  }

  if (nextSource !== source) {
    fs.writeFileSync(nftPath, nextSource);
  }

  return nftPath;
}

function inspectWrapper(scriptPath) {
  if (!fs.existsSync(scriptPath)) {
    return;
  }

  const content = fs.readFileSync(scriptPath, "utf8");
  const hasPnpmTemp = content.includes(".tools/pnpm");
  log(`wrapper ${path.relative(workspaceRoot, scriptPath)}`, hasPnpmTemp ? "contains .tools/pnpm" : "ok");
}

function inspectSymlinks(dirPath, limit = 20000) {
  const matches = [];
  const queue = [dirPath];
  let visited = 0;

  while (queue.length > 0 && visited < limit && matches.length < 20) {
    const current = queue.pop();

    if (!current) {
      continue;
    }

    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      visited += 1;
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (!entry.isSymbolicLink()) {
        continue;
      }

      try {
        const target = fs.readlinkSync(fullPath);

        if (target.includes(".tools/pnpm") || target.includes("/.local/share/pnpm/")) {
          matches.push(`${path.relative(workspaceRoot, fullPath)} -> ${target}`);
        }
      } catch {
        // ignore broken symlinks here, nft patch will surface the exact path later
      }
    }
  }

  if (matches.length === 0) {
    log("symlink-scan", "no pnpm temp symlink found");
    return;
  }

  for (const match of matches) {
    log("symlink", match);
  }
}

function logEnvironment() {
  log("cwd", process.cwd());
  log("execPath", process.execPath);
  log("argv", JSON.stringify(process.argv));
  log("npm_execpath", process.env.npm_execpath ?? "<unset>");
  log("npm_config_user_agent", process.env.npm_config_user_agent ?? "<unset>");
  log("NODE_PATH", process.env.NODE_PATH ?? "<unset>");
  log("PATH[pnpm]", (process.env.PATH ?? "").split(path.delimiter).filter((item) => item.includes("pnpm")).join(path.delimiter) || "<none>");
  log("resolve npm", safeResolve("npm"));
  log("resolve pnpm", safeResolve("pnpm"));
  log("resolve @vercel/nft", safeResolve("@vercel/nft/out/node-file-trace.js"));
  log("resolve node-gyp-build", safeResolve("node-gyp-build"));
  log("resolve @mapbox/node-pre-gyp", safeResolve("@mapbox/node-pre-gyp"));

  inspectWrapper(path.join(workspaceRoot, "node_modules/.bin/vite"));
  inspectWrapper(path.join(workspaceRoot, "node_modules/.bin/nft"));
  inspectWrapper(path.join(workspaceRoot, "node_modules/.bin/node-pre-gyp"));
  inspectSymlinks(path.join(workspaceRoot, "node_modules"));
}

function createBuildEnvironment() {
  const env = { ...process.env };
  const clearedEntries = [];
  const originalPath = env.PATH ?? "";
  const filteredPathEntries = [];

  for (const pathEntry of originalPath.split(path.delimiter)) {
    if (!pathEntry) {
      continue;
    }

    if (isPnpmTemporaryPath(pathEntry)) {
      clearedEntries.push(`PATH=${pathEntry}`);
      continue;
    }

    filteredPathEntries.push(pathEntry);
  }

  env.PATH = filteredPathEntries.join(path.delimiter);

  for (const key of [
    "npm_execpath",
    "npm_config_user_agent",
    "npm_config_node_gyp",
    "NODE_PATH",
  ]) {
    if (!(key in env) || env[key] === undefined || env[key] === "") {
      continue;
    }

    clearedEntries.push(`${key}=${env[key]}`);
    delete env[key];
  }

  return {
    env,
    clearedEntries,
  };
}

async function runBuild() {
  const buildEnvironment = createBuildEnvironment();

  if (buildEnvironment.clearedEntries.length === 0) {
    log("sanitized-env", "no pnpm temp env entry found");
  } else {
    for (const clearedEntry of buildEnvironment.clearedEntries) {
      log("sanitized-env", clearedEntry);
    }
  }

  const child = spawn(
    process.execPath,
    ["./node_modules/vite/bin/vite.js", "build"],
    {
      cwd: workspaceRoot,
      env: buildEnvironment.env,
      stdio: "inherit",
    },
  );

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`build が signal ${signal} で終了しました`));
        return;
      }

      resolve(code ?? 1);
    });
  });

  process.exit(exitCode);
}

logEnvironment();
const patchedPath = patchNftLogging();
log("patched nft", patchedPath);

if (dryRun) {
  log("mode", "dry-run");
  process.exit(0);
}

await runBuild();
