# AGENTS.md

## Scope

This file is project-level guidance for agents working in this repository.
Higher-priority user instructions still win.

## Architecture

- This is an Iconcat monorepo. Publishable packages live under `packages/*`.
- Shared example fixtures live under `fixtures/*`; keep them out of
  `packages/*` so package orchestration only targets real packages.
- Catalog extraction starts from framework entries and follows the reachable
  dependency graph. Keep this behavior aligned with `docs/iconcat-flow.md`.
- UnoCSS compatibility is intentionally out of scope for the current phase.

## Build Tooling

- Library packages use tsdown for JavaScript and declaration output. See
  `docs/package-build.md`.
- Root build, test, and typecheck orchestration uses Turborepo.
- Use `tsgo` for repository typecheck scripts. Keep `typescript` pinned only for
  lint/tooling ecosystem compatibility.
- Do not reintroduce `vite-plugin-dts` or `vite.lib.config.ts` for package
  builds.
- Vite remains valid for docs, examples, and Vitest configuration.

## Framework Adapters

- Next.js helpers live in `@iconcat/next`.
- Vite helpers live in `@iconcat/vite`.
- Shared manifest/CSS file utilities live in `@iconcat/adapter-utils`.
- Next App Router should emit a stylesheet link with React `precedence`.
- Next Pages Router injects through `_document` and may include CSS preload.

## Generated Files

Do not commit generated output:

- `dist`
- `.iconcat`
- `.next`
- coverage output

These are already covered by `.gitignore`.

## Commit Messages

- Keep the `commit-msg` hook emoji behavior. The subject may be written as a
  plain Conventional Commit header or with the correct emoji prefix; the hook
  adds or corrects the emoji when needed.
- Use compact commit bodies that explain the actual engineering process:
  context, hard parts, and the validation loop that improved AI Coding
  efficiency or quality.
- Call out meaningful verification-loop improvements when present, such as
  faster local checks, clearer demo observability, reduced warning noise, or
  earlier failure detection.
- Frame AI Coding quality or efficiency as a property of the change itself:
  stronger type validation, tests, agent docs, observability, or cleaner
  failure signals.
- Follow `docs/commit-messages.md` for AI Coding commit body examples.
- Do not put every sentence in its own paragraph. Avoid blank lines between
  related body sentences.

## Validation

Before reporting package-build changes as done, run:

```bash
pnpm run build:packages
pnpm run typecheck
pnpm run test
pnpm run lint
```

For demo or framework adapter changes, also build the affected example app.
