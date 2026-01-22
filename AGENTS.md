# Repository Guidelines

## Project Structure & Module Organization
- `src/routes/` contains SvelteKit routes and pages; API endpoints live under `src/routes/api/**/+server.ts`.
- `src/lib/` is shared code: UI components in `src/lib/components/`, stores in `src/lib/stores/`, and assets in `src/lib/assets/`.
- `src/app.css` and `src/app.html` define global styles and HTML shell.
- `static/` holds public assets served at the site root.
- `docs/` includes product/spec references (see `docs/01_spec.md` and related design docs).

## Build, Test, and Development Commands
Use pnpm (see `pnpm-lock.yaml`).
- `pnpm install` installs dependencies.
- `pnpm dev` starts the Vite dev server.
- `pnpm build` creates a production build.
- `pnpm preview` serves the production build locally.
- `pnpm check` runs `svelte-check` after syncing types.
- `pnpm check:watch` runs `svelte-check` in watch mode.

## Coding Style & Naming Conventions
- Follow existing SvelteKit + TypeScript patterns and keep files small and focused.
- Indentation: match the file you edit; Svelte/CSS/TS in this repo use 2 spaces, while JSON uses tabs.
- Components use PascalCase filenames (e.g., `ProjectCard.svelte`).
- Route files follow SvelteKit conventions (`+page.svelte`, `+layout.svelte`, `+server.ts`).
- Tailwind CSS is configured via `@import "tailwindcss"` in `src/app.css`.

## Testing Guidelines
- No automated test framework is set up yet.
- If you add tests, document the framework and add a script in `package.json`.
- Name tests clearly (e.g., `ComponentName.test.ts`) and place them near the code or in a dedicated test folder.

## Commit & Pull Request Guidelines
- Commit messages currently follow a conventional style (e.g., `feat: mock`). Use `type: summary` where possible (`feat`, `fix`, `chore`, etc.).
- PRs should include a concise description, linked issue (if any), and screenshots for UI changes.
- Note any new environment variables or migration steps in the PR description.

## Domain & Architecture Notes
- High-level product and design references live in `docs/`.
- See `CLAUDE.md` for domain concepts (roles, timelines, reaction types, routing map).
