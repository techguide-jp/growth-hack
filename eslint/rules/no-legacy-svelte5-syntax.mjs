import { parse } from "svelte/compiler";

const legacySvelteImports = new Set([
  "createEventDispatcher",
  "onMount",
  "onDestroy",
  "beforeUpdate",
  "afterUpdate",
]);

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
      continue;
    }

    if (index >= nextStart) {
      low = middle + 1;
      continue;
    }

    return {
      line: middle + 1,
      column: index - start,
    };
  }

  return { line: 1, column: 0 };
}

function getNodePosition(node, lineStarts) {
  if (node?.name_loc?.start) {
    return {
      line: node.name_loc.start.line,
      column: node.name_loc.start.column,
    };
  }

  if (node?.loc?.start) {
    return {
      line: node.loc.start.line,
      column: node.loc.start.column,
    };
  }

  if (typeof node?.start === "number") {
    return getPositionFromIndex(lineStarts, node.start);
  }

  return { line: 1, column: 0 };
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

function report(context, lineStarts, node, message) {
  const position = getNodePosition(node, lineStarts);

  context.report({
    loc: {
      start: position,
      end: position,
    },
    message,
  });
}

function checkScript(context, script, lineStarts) {
  if (!script?.content) {
    return;
  }

  visitAst(script.content.body, (node) => {
    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "VariableDeclaration" &&
      node.declaration.kind === "let"
    ) {
      report(
        context,
        lineStarts,
        node,
        "`export let` は legacy 記法です。`$props()` を使ってください。",
      );
      return;
    }

    if (node.type === "LabeledStatement" && node.label?.name === "$") {
      report(
        context,
        lineStarts,
        node,
        "`$:` は legacy 記法です。`$derived(...)` または `$effect(...)` を使ってください。",
      );
      return;
    }

    if (node.type !== "ImportDeclaration") {
      return;
    }

    if (node.source.value === "$app/stores") {
      report(
        context,
        lineStarts,
        node,
        "`$app/stores` は legacy です。`$app/state` を使ってください。",
      );
    }

    if (node.source.value === "svelte/legacy") {
      report(
        context,
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

      if (!legacySvelteImports.has(specifier.imported?.name)) {
        continue;
      }

      report(
        context,
        lineStarts,
        specifier,
        `\`${specifier.imported.name}\` は legacy API です。Svelte 5 Rune/新構文へ置き換えてください。`,
      );
    }
  });
}

function checkTemplate(context, fragment, lineStarts) {
  if (!fragment) {
    return;
  }

  visitAst(fragment, (node) => {
    if (node.type === "EventHandler") {
      report(
        context,
        lineStarts,
        node,
        "`on:` ディレクティブは legacy 記法です。`onclick` などの属性へ置き換えてください。",
      );
    }

    if (node.type === "Slot") {
      report(
        context,
        lineStarts,
        node,
        "`<slot>` は legacy 記法です。snippet props と `{@render ...}` を使ってください。",
      );
    }

    if (node.type === "InlineComponent" && node.name === "svelte:component") {
      report(
        context,
        lineStarts,
        node,
        "`<svelte:component>` は legacy 記法です。`<Component />` や `<item.icon />` の直接記法へ置き換えてください。",
      );
    }
  });
}

const noLegacySvelte5SyntaxRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow legacy Svelte syntax when the codebase is standardized on Svelte 5 runes",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();

    if (!filename.endsWith(".svelte")) {
      return {};
    }

    return {
      Program() {
        const source = context.sourceCode.text;
        const lineStarts = getLineStarts(source);

        try {
          const ast = parse(source);
          checkScript(context, ast.instance, lineStarts);
          checkScript(context, ast.module, lineStarts);
          checkTemplate(context, ast.html, lineStarts);
        } catch (error) {
          const line = error?.start?.line ?? 1;
          const column = error?.start?.column ?? 0;

          context.report({
            loc: {
              start: { line, column },
              end: { line, column },
            },
            message: `Svelte の parse に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      },
    };
  },
};

export default noLegacySvelte5SyntaxRule;
