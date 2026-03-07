import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "svelte/compiler";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const svelteRoot = path.join(workspaceRoot, "src");
const legacySvelteImports = new Set([
  "createEventDispatcher",
  "onMount",
  "onDestroy",
  "beforeUpdate",
  "afterUpdate",
]);

async function collectSvelteFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectSvelteFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".svelte")
        ? [entryPath]
        : [];
    }),
  );

  return files.flat().sort();
}

function getLineStarts(source) {
  const lineStarts = [0];

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") {
      lineStarts.push(index + 1);
    }
  }

  return lineStarts;
}

function getPositionFromIndex(lineStarts, index) {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const start = lineStarts[middle];
    const nextStart = lineStarts[middle + 1] ?? Number.POSITIVE_INFINITY;

    if (index < start) {
      high = middle - 1;
    } else if (index >= nextStart) {
      low = middle + 1;
    } else {
      return {
        line: middle + 1,
        column: index - start + 1,
      };
    }
  }

  return { line: 1, column: 1 };
}

function getNodePosition(node, lineStarts) {
  if (node?.name_loc?.start) {
    return {
      line: node.name_loc.start.line,
      column: node.name_loc.start.column + 1,
    };
  }

  if (node?.loc?.start) {
    return {
      line: node.loc.start.line,
      column: node.loc.start.column + 1,
    };
  }

  if (typeof node?.start === "number") {
    return getPositionFromIndex(lineStarts, node.start);
  }

  return { line: 1, column: 1 };
}

function visitAst(node, visit) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      visitAst(item, visit);
    }

    return;
  }

  if (typeof node.type === "string") {
    visit(node);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "name_loc") {
      continue;
    }

    visitAst(value, visit);
  }
}

function addIssue(issues, filePath, lineStarts, node, message) {
  const position = getNodePosition(node, lineStarts);

  issues.push({
    filePath,
    line: position.line,
    column: position.column,
    message,
  });
}

function checkScript(script, filePath, lineStarts, issues) {
  if (!script?.content) {
    return;
  }

  visitAst(script.content.body, (node) => {
    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "VariableDeclaration" &&
      node.declaration.kind === "let"
    ) {
      addIssue(
        issues,
        filePath,
        lineStarts,
        node,
        "`export let` は legacy 記法です。`$props()` を使ってください。",
      );
    }

    if (node.type === "LabeledStatement" && node.label?.name === "$") {
      addIssue(
        issues,
        filePath,
        lineStarts,
        node,
        "`$:` は legacy 記法です。`$derived(...)` または `$effect(...)` を使ってください。",
      );
    }

    if (node.type !== "ImportDeclaration") {
      return;
    }

    if (node.source.value === "$app/stores") {
      addIssue(
        issues,
        filePath,
        lineStarts,
        node,
        "`$app/stores` は legacy です。`$app/state` を使ってください。",
      );
    }

    if (node.source.value === "svelte/legacy") {
      addIssue(
        issues,
        filePath,
        lineStarts,
        node,
        "`svelte/legacy` の import は避けて、Svelte 5 の素の構文へ移行してください。",
      );
    }

    if (node.source.value !== "svelte") {
      return;
    }

    for (const specifier of node.specifiers ?? []) {
      if (specifier.type !== "ImportSpecifier") {
        continue;
      }

      const importedName = specifier.imported?.name;

      if (!legacySvelteImports.has(importedName)) {
        continue;
      }

      addIssue(
        issues,
        filePath,
        lineStarts,
        specifier,
        `\`${importedName}\` は今回の基準では legacy API です。Svelte 5 Rune/新構文へ置き換えてください。`,
      );
    }
  });
}

function checkTemplate(fragment, filePath, lineStarts, issues) {
  if (!fragment) {
    return;
  }

  visitAst(fragment, (node) => {
    if (node.type === "EventHandler") {
      addIssue(
        issues,
        filePath,
        lineStarts,
        node,
        "`on:` ディレクティブは legacy 記法です。`onclick` などの属性へ置き換えてください。",
      );
    }

    if (node.type === "Slot") {
      addIssue(
        issues,
        filePath,
        lineStarts,
        node,
        "`<slot>` は legacy 記法です。snippet props と `{@render ...}` を使ってください。",
      );
    }

    if (node.type === "InlineComponent" && node.name === "svelte:component") {
      addIssue(
        issues,
        filePath,
        lineStarts,
        node,
        "`<svelte:component>` は legacy 記法です。`<Component />` や `<item.icon />` の直接記法へ置き換えてください。",
      );
    }
  });
}

async function main() {
  const files = await collectSvelteFiles(svelteRoot);
  const issues = [];

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const lineStarts = getLineStarts(source);

    try {
      const ast = parse(source);
      checkScript(ast.instance, filePath, lineStarts, issues);
      checkScript(ast.module, filePath, lineStarts, issues);
      checkTemplate(ast.html, filePath, lineStarts, issues);
    } catch (error) {
      issues.push({
        filePath,
        line: error?.start?.line ?? 1,
        column: (error?.start?.column ?? 0) + 1,
        message: `Svelte の parse に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  if (issues.length === 0) {
    console.log(`Svelte Rune check passed. ${files.length} files checked.`);
    return;
  }

  console.error(`Svelte Rune check failed. ${issues.length} issue(s) found.\n`);

  for (const issue of issues) {
    const relativePath = path.relative(workspaceRoot, issue.filePath);
    console.error(
      `- ${relativePath}:${issue.line}:${issue.column} ${issue.message}`,
    );
  }

  process.exitCode = 1;
}

await main();
