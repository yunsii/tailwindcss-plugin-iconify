---
title: Package Build
description: tsdown package build contract and repository typecheck conventions.
---

# Iconcat Package Build

Iconcat library packages use `tsdown` for package output. `tsdown` wraps
Rolldown for JavaScript bundling and also drives declaration generation, so
package scripts do not need separate `rolldown` and `tsc` steps.

Root task orchestration is handled by Turborepo. Repository typecheck scripts
use `tsgo` from `@typescript/native-preview`; the root `typescript` dependency
stays pinned for lint and the broader TypeScript-aware tooling ecosystem.

## Scope

This applies to publishable packages under `packages/*`:

- `@iconcat/core`
- `@iconcat/adapter-utils`
- `@iconcat/extractor`
- `@iconcat/presets`
- `@iconcat/next`
- `@iconcat/vite`
- `iconcat`
- `@iconcat/tailwind`
- `tailwindcss-plugin-iconify`

Vite remains in the repo for docs, examples, and Vitest. It is not used for
library package bundling.

## Files

Each publishable package has:

- `tsdown.config.ts` for JavaScript and declaration output.
- `tsconfig.build.json` for declaration build options.
- `package.json` `build` script:

```json
{
  "build": "tsdown"
}
```

Shared package-build defaults live in `build/tsdown-package.mjs`.

## Output Contract

`tsdown` runs in unbundle mode, keeps source modules under `dist`, and emits
both ESM and CJS outputs unless a package opts out. Declaration maps are
disabled for package builds to avoid noisy dts sourcemap output:

```text
src/index.ts -> dist/index.mjs
src/index.ts -> dist/index.cjs
src/index.ts -> dist/index.d.mts
src/index.ts -> dist/index.d.cts
```

The CLI package emits ESM only because the bin entry is `dist/cli.mjs`, so it
only needs `.mjs` and `.d.mts` output.

The shared config disables automatic package export generation. Existing
`package.json` `exports` fields remain the source of truth for publishable
entry contracts.

## Build Order

Use the root package build command for publishable packages:

```bash
pnpm run build:packages
```

The command delegates to Turborepo and filters to `packages/*`. Turbo runs
package tasks in dependency order because `build` has `dependsOn: ["^build"]`
in `turbo.json`. This avoids a race where a package build consumes another
workspace package before its `dist` files have been regenerated.

## Typecheck

Use the root typecheck command:

```bash
pnpm run typecheck
```

The command delegates to each package or app `typecheck` script. Those scripts
call `tsgo --noEmit`. Packages that typecheck sibling workspace source files
pass `--rootDir ../..` so the native compiler sees the monorepo source
boundary.

## Validation

For build-tool changes run:

```bash
pnpm run build:packages
pnpm run typecheck
pnpm run test
pnpm run lint
```

For framework CSS-injection changes, also build the three examples:

```bash
pnpm --filter @iconcat/example-next-app-router run build
pnpm --filter @iconcat/example-next-pages-router run build
pnpm --filter @iconcat/example-react-router-vite run build
```
