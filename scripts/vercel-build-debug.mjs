import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";

const workspaceRoot = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const workspaceRequire = createRequire(path.join(workspaceRoot, "package.json"));
const adapterPackageJsonPath = workspaceRequire.resolve("@sveltejs/adapter-vercel/package.json");
const adapterIndexPath = path.join(path.dirname(adapterPackageJsonPath), "index.js");
const adapterRequire = createRequire(adapterPackageJsonPath);
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

function safeResolve(specifier, resolver = workspaceRequire) {
  try {
    return resolver.resolve(specifier);
  } catch {
    return "<unresolved>";
  }
}

function resolveNftPath() {
  const directPath = safeResolve("@vercel/nft/out/node-file-trace.js");

  if (directPath !== "<unresolved>") {
    return directPath;
  }

  return adapterRequire.resolve("@vercel/nft/out/node-file-trace.js");
}

function patchNftLogging() {
  const nftPath = resolveNftPath();
  const source = fs.readFileSync(nftPath, "utf8");
  const emitDependencyPrologue = `async emitDependency(path, parent, depth = this.depth) {\n        const ignoreSandboxDependency = parent === '/var/task/sandbox.js';\n        if (ignoreSandboxDependency)\n            return;\n        if (depth < 0)\n            throw new Error('invariant - depth option cannot be negative');`;
  const emitDependencyProloguePattern = /async emitDependency\(path, parent, depth = this\.depth\) \{\n(?:        const ignoreSandboxDependency = [^\n]+\n        if \(ignoreSandboxDependency\)\n            return;\n)?        if \(depth < 0\)\n            throw new Error\('invariant - depth option cannot be negative'\);/;

  const replacement = `if (source === null) {\n                const missingFileContext = {\n                    requestedPath: path,\n                    realPath,\n                    parent,\n                    depth,\n                    base: this.base,\n                    cwd: this.cwd,\n                    execPath: process.execPath,\n                    npmExecPath: process.env.npm_execpath,\n                    nodePath: process.env.NODE_PATH,\n                    userAgent: process.env.npm_config_user_agent,\n                };\n                const ignoreMissingFile = realPath.includes('/.local/share/pnpm/.tools/pnpm/') || realPath.includes('/.pnpm-store/') || realPath.includes('/usr/bin') || realPath.includes('/proc/') || path.includes('/.local/share/pnpm/.tools/pnpm/') || path.includes('/vercel/.local/share/pnpm/') || path.includes('/.pnpm-store/') || path.includes('/usr/bin') || path.includes('/proc/') || parent === '/var/task/sandbox.js';\n                if (ignoreMissingFile) {\n                    return;\n                }\n                console.error('[codex:nft-missing-file]', JSON.stringify(missingFileContext, null, 2));\n                throw new Error('File ' + realPath + ' does not exist.');\n            }`;
  const patchedBlock = /if \(source === null\) \{[\s\S]*?throw new Error\('File ' \+ realPath \+ ' does not exist\.'\);\n\s*\}/;
  const originalBlock = "if (source === null)\n                throw new Error('File ' + realPath + ' does not exist.');";

  let nextSource = source;

  if (emitDependencyProloguePattern.test(nextSource)) {
    nextSource = nextSource.replace(emitDependencyProloguePattern, emitDependencyPrologue);
  } else if (!nextSource.includes(emitDependencyPrologue)) {
    throw new Error(`@vercel/nft の emitDependency パッチ対象が見つかりません: ${nftPath}`);
  }

  if (patchedBlock.test(source)) {
    nextSource = nextSource.replace(patchedBlock, replacement);
  } else if (nextSource.includes(originalBlock)) {
    nextSource = nextSource.replace(originalBlock, replacement);
  } else {
    throw new Error(`@vercel/nft のパッチ対象が見つかりません: ${nftPath}`);
  }

  if (nextSource !== source) {
    fs.writeFileSync(nftPath, nextSource);
  }

  return nftPath;
}

function patchAdapterWarningNoise() {
  const source = fs.readFileSync(adapterIndexPath, "utf8");
  const originalTraceLine = `\tconst traced = await nodeFileTrace([entry], { base });`;
  const patchedTraceLine = `\tconst traced = await nodeFileTrace([entry], {\n\t\tbase,\n\t\tignore: (value) =>\n\t\t\tvalue.includes('.pnpm-store/') ||\n\t\t\tvalue.includes('.local/share/pnpm/') ||\n\t\t\tvalue.includes('/proc/') ||\n\t\t\tvalue.includes('/usr/bin') ||\n\t\t\tvalue.includes('var/task/sandbox.js')\n\t});`;
  const originalWarningBlock = `\tif (resolution_failures.size > 0) {\n\t\tconst cwd = process.cwd();\n\t\tbuilder.log.warn(\n\t\t\t'Warning: The following modules failed to locate dependencies that may (or may not) be required for your app to work:'\n\t\t);\n\n\t\tfor (const [importer, modules] of resolution_failures) {\n\t\t\tconsole.error(\`  \${path.relative(cwd, importer)}\`);\n\t\t\tfor (const module of modules) {\n\t\t\t\tconsole.error(\`    - \\u001B[1m\\u001B[36m\${module}\\u001B[39m\\u001B[22m\`);\n\t\t\t}\n\t\t}\n\t}`;
  const patchedWarningBlock = `\tconst noisy_warning_patterns = [\n\t\t'/var/task/sandbox.js',\n\t\t'/.pnpm-store/',\n\t\t'/vercel/.local/share/pnpm/',\n\t\t'/.local/share/pnpm/',\n\t\t'/.vercel/output/functions/',\n\t\t'/usr/bin',\n\t\t'/proc/'\n\t];\n\tconst is_noisy_warning = (value) => noisy_warning_patterns.some((pattern) => value.includes(pattern));\n\tconst filtered_resolution_failures = new Map();\n\n\t\tfor (const [importer, modules] of resolution_failures) {\n\t\t\tif (is_noisy_warning(importer)) continue;\n\t\t\tconst filtered_modules = modules.filter((module) => !is_noisy_warning(module)).slice(0, 20);\n\t\t\tif (filtered_modules.length === 0) continue;\n\t\t\tfiltered_resolution_failures.set(importer, filtered_modules);\n\t\t}\n\n\tif (filtered_resolution_failures.size > 0) {\n\t\tconst cwd = process.cwd();\n\t\tbuilder.log.warn(\n\t\t\t'Warning: The following modules failed to locate dependencies that may (or may not) be required for your app to work:'\n\t\t);\n\n\t\tfor (const [importer, modules] of filtered_resolution_failures) {\n\t\t\tconsole.error(\`  \${path.relative(cwd, importer)}\`);\n\t\t\tfor (const module of modules) {\n\t\t\t\tconsole.error(\`    - \\u001B[1m\\u001B[36m\${module}\\u001B[39m\\u001B[22m\`);\n\t\t\t}\n\t\t}\n\t}`;

  if (source.includes(patchedTraceLine) && source.includes(patchedWarningBlock)) {
    return adapterIndexPath;
  }

  if (!source.includes(originalTraceLine) && !source.includes(patchedTraceLine)) {
    throw new Error(`@sveltejs/adapter-vercel の trace パッチ対象が見つかりません: ${adapterIndexPath}`);
  }

  if (!source.includes(originalWarningBlock) && !source.includes(patchedWarningBlock)) {
    throw new Error(`@sveltejs/adapter-vercel の warning パッチ対象が見つかりません: ${adapterIndexPath}`);
  }

  const withPatchedTrace = source.includes(originalTraceLine)
    ? source.replace(originalTraceLine, patchedTraceLine)
    : source;
  const withPatchedWarnings = withPatchedTrace.includes(originalWarningBlock)
    ? withPatchedTrace.replace(originalWarningBlock, patchedWarningBlock)
    : withPatchedTrace;

  fs.writeFileSync(adapterIndexPath, withPatchedWarnings);
  return adapterIndexPath;
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
  log("resolve adapter-vercel", adapterPackageJsonPath);
  log("resolve npm", safeResolve("npm"));
  log("resolve pnpm", safeResolve("pnpm"));
  log("resolve @vercel/nft", safeResolve("@vercel/nft/out/node-file-trace.js"));
  log("resolve @vercel/nft via adapter", safeResolve("@vercel/nft/out/node-file-trace.js", adapterRequire));
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
try {
  const patchedPath = patchNftLogging();
  log("patched nft", patchedPath);
} catch (error) {
  log("patch nft skipped", error instanceof Error ? error.message : String(error));
}

try {
  const patchedAdapterPath = patchAdapterWarningNoise();
  log("patched adapter", patchedAdapterPath);
} catch (error) {
  log("patch adapter skipped", error instanceof Error ? error.message : String(error));
}

if (dryRun) {
  log("mode", "dry-run");
  process.exit(0);
}

await runBuild();
