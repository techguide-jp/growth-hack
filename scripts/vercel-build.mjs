import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

// Vercel build で adapter-vercel / @vercel/nft が sandbox.js と pnpm 一時パスを
// 誤って runtime dependency として追うため、build 中だけ最小パッチを当てる。
const workspaceRoot = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const verbose = dryRun || process.env.VERCEL_BUILD_PATCH_VERBOSE === "1";
const workspaceRequire = createRequire(path.join(workspaceRoot, "package.json"));
const adapterPackageJsonPath = workspaceRequire.resolve("@sveltejs/adapter-vercel/package.json");
const adapterIndexPath = path.join(path.dirname(adapterPackageJsonPath), "index.js");
const adapterRequire = createRequire(adapterPackageJsonPath);

const pnpmTemporaryPathPatterns = [
  "/.local/share/pnpm/.tools/pnpm/",
  `${path.sep}.tools${path.sep}pnpm${path.sep}`,
];

function log(label, value) {
  if (!verbose || value === undefined) {
    return;
  }

  console.error(`[vercel-build] ${label}: ${value}`);
}

function hasAnyPattern(value, patterns) {
  if (!value) {
    return false;
  }

  return patterns.some((pattern) => value.includes(pattern));
}

function exactReplace(source, original, replacement, errorMessage) {
  if (source.includes(original)) {
    return source.replace(original, replacement);
  }

  if (source.includes(replacement)) {
    return source;
  }

  throw new Error(errorMessage);
}

function regexReplace(source, pattern, replacement, errorMessage) {
  if (pattern.test(source)) {
    return source.replace(pattern, replacement);
  }

  if (source.includes(replacement)) {
    return source;
  }

  throw new Error(errorMessage);
}

function resolveNftPath() {
  try {
    return workspaceRequire.resolve("@vercel/nft/out/node-file-trace.js");
  } catch {
    return adapterRequire.resolve("@vercel/nft/out/node-file-trace.js");
  }
}

function patchNft() {
  const nftPath = resolveNftPath();
  const source = fs.readFileSync(nftPath, "utf8");

  const emitDependencyPattern =
    /async emitDependency\(path, parent, depth = this\.depth\) \{\n(?:        const ignoreSandboxDependency = [^\n]+\n        if \(ignoreSandboxDependency\)\n            return;\n)?        if \(depth < 0\)\n            throw new Error\('invariant - depth option cannot be negative'\);/;
  const emitDependencyReplacement = `async emitDependency(path, parent, depth = this.depth) {\n        const ignoreSandboxDependency = parent === '/var/task/sandbox.js';\n        if (ignoreSandboxDependency)\n            return;\n        if (depth < 0)\n            throw new Error('invariant - depth option cannot be negative');`;

  const missingFilePattern =
    /if \(source === null\) \{[\s\S]*?throw new Error\('File ' \+ realPath \+ ' does not exist\.'\);\n\s*\}/;
  const missingFileReplacement = `if (source === null) {\n                const ignoreMissingFile = realPath.includes('/.local/share/pnpm/.tools/pnpm/') || realPath.includes('/.pnpm-store/') || realPath.includes('/usr/bin') || realPath.includes('/proc/') || path.includes('/.local/share/pnpm/.tools/pnpm/') || path.includes('/vercel/.local/share/pnpm/') || path.includes('/.pnpm-store/') || path.includes('/usr/bin') || path.includes('/proc/') || parent === '/var/task/sandbox.js';\n                if (ignoreMissingFile) {\n                    return;\n                }\n                throw new Error('File ' + realPath + ' does not exist.');\n            }`;

  let nextSource = regexReplace(
    source,
    emitDependencyPattern,
    emitDependencyReplacement,
    `@vercel/nft の emitDependency パッチ対象が見つかりません: ${nftPath}`,
  );

  nextSource = regexReplace(
    nextSource,
    missingFilePattern,
    missingFileReplacement,
    `@vercel/nft の missing-file パッチ対象が見つかりません: ${nftPath}`,
  );

  if (nextSource !== source) {
    fs.writeFileSync(nftPath, nextSource);
  }

  log("patched nft", nftPath);
}

function patchAdapter() {
  const source = fs.readFileSync(adapterIndexPath, "utf8");

  const originalTraceLine = `\tconst traced = await nodeFileTrace([entry], { base });`;
  const patchedTraceLine = `\tconst traced = await nodeFileTrace([entry], {\n\t\tbase,\n\t\tignore: (value) =>\n\t\t\tvalue.includes('.pnpm-store/') ||\n\t\t\tvalue.includes('.local/share/pnpm/') ||\n\t\t\tvalue.includes('/proc/') ||\n\t\t\tvalue.includes('/usr/bin') ||\n\t\t\tvalue.includes('var/task/sandbox.js')\n\t});`;

  const originalWarningBlock = `\tif (resolution_failures.size > 0) {\n\t\tconst cwd = process.cwd();\n\t\tbuilder.log.warn(\n\t\t\t'Warning: The following modules failed to locate dependencies that may (or may not) be required for your app to work:'\n\t\t);\n\n\t\tfor (const [importer, modules] of resolution_failures) {\n\t\t\tconsole.error(\`  \${path.relative(cwd, importer)}\`);\n\t\t\tfor (const module of modules) {\n\t\t\t\tconsole.error(\`    - \\u001B[1m\\u001B[36m\${module}\\u001B[39m\\u001B[22m\`);\n\t\t\t}\n\t\t}\n\t}`;
  const patchedWarningBlock = `\tconst noisy_warning_patterns = [\n\t\t'/var/task/sandbox.js',\n\t\t'/.pnpm-store/',\n\t\t'/vercel/.local/share/pnpm/',\n\t\t'/.local/share/pnpm/',\n\t\t'/.vercel/output/functions/',\n\t\t'/usr/bin',\n\t\t'/proc/'\n\t];\n\tconst is_noisy_warning = (value) => noisy_warning_patterns.some((pattern) => value.includes(pattern));\n\tconst filtered_resolution_failures = new Map();\n\n\t\tfor (const [importer, modules] of resolution_failures) {\n\t\t\tif (is_noisy_warning(importer)) continue;\n\t\t\tconst filtered_modules = modules.filter((module) => !is_noisy_warning(module)).slice(0, 20);\n\t\t\tif (filtered_modules.length === 0) continue;\n\t\t\tfiltered_resolution_failures.set(importer, filtered_modules);\n\t\t}\n\n\tif (filtered_resolution_failures.size > 0) {\n\t\tconst cwd = process.cwd();\n\t\tbuilder.log.warn(\n\t\t\t'Warning: The following modules failed to locate dependencies that may (or may not) be required for your app to work:'\n\t\t);\n\n\t\tfor (const [importer, modules] of filtered_resolution_failures) {\n\t\t\tconsole.error(\`  \${path.relative(cwd, importer)}\`);\n\t\t\tfor (const module of modules) {\n\t\t\t\tconsole.error(\`    - \\u001B[1m\\u001B[36m\${module}\\u001B[39m\\u001B[22m\`);\n\t\t\t}\n\t\t}\n\t}`;

  let nextSource = exactReplace(
    source,
    originalTraceLine,
    patchedTraceLine,
    `@sveltejs/adapter-vercel の trace パッチ対象が見つかりません: ${adapterIndexPath}`,
  );

  nextSource = exactReplace(
    nextSource,
    originalWarningBlock,
    patchedWarningBlock,
    `@sveltejs/adapter-vercel の warning パッチ対象が見つかりません: ${adapterIndexPath}`,
  );

  if (nextSource !== source) {
    fs.writeFileSync(adapterIndexPath, nextSource);
  }

  log("patched adapter", adapterIndexPath);
}

function createBuildEnvironment() {
  const env = { ...process.env };
  const pathEntries = (env.PATH ?? "").split(path.delimiter);
  env.PATH = pathEntries
    .filter((entry) => entry && !hasAnyPattern(entry, pnpmTemporaryPathPatterns))
    .join(path.delimiter);

  for (const key of ["npm_execpath", "npm_config_user_agent", "npm_config_node_gyp", "NODE_PATH"]) {
    delete env[key];
  }

  return env;
}

async function runBuild() {
  const child = spawn(process.execPath, ["./node_modules/vite/bin/vite.js", "build"], {
    cwd: workspaceRoot,
    env: createBuildEnvironment(),
    stdio: "inherit",
  });

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

patchNft();
patchAdapter();

if (dryRun) {
  log("mode", "dry-run");
  process.exit(0);
}

await runBuild();
