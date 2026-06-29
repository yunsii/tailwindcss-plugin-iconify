---
title: Commit Message Standard
description: Repository commit message shape for Conventional Commits and AI Coding validation notes.
---

# Commit Message Standard

This repository uses Conventional Commits plus the existing `commit-msg` hook.
The subject may be written with the correct emoji prefix or as a plain
Conventional Commit header. `@jannajs/lint emojify` adds or corrects the emoji
after commitlint passes.

## Shape

```text
[emoji] <type>(<scope>): <subject>

<why and what changed. Keep this compact, but include the real hard parts.>

<if the change improves future AI Coding quality or speed, explain the concrete mechanism: stronger type checks, tests, agent docs, observability, or earlier failure signals.>
```

## Rules

- Use Conventional Commit `type(scope): subject`, optionally prefixed by the
  matching emoji.
- Keep emoji handling in the hook; it adds missing emoji and corrects mismatched
  emoji.
- Put AI Coding quality or efficiency gains in the body when the change
  materially improves future agent work.
- Write the hard parts explicitly: architecture boundaries, API migration,
  framework quirks, validation gaps, or debugging paths that changed the
  implementation.
- Explain the concrete mechanism when it matters: what type validation, tests,
  agent instructions, docs, observability, or warning cleanup were added, and
  how that makes later AI Coding safer or faster.
- Avoid one sentence per paragraph. Use a small number of focused paragraphs.

## Examples

Feature with a breaking API change:

```text
feat(iconcat): rebuild monorepo catalog architecture

Upgrade the single-package Tailwind plugin into the Iconcat monorepo, split core, extractor, adapters, and example apps, and move icon extraction to entry-driven dependency graph scanning. The hard part was keeping the public API, framework CSS injection contract, and package output boundaries stable at the same time.

This change includes a breaking API migration: remove the old add*IconSelectors names and preprocessSets option, then migrate to icons, dynamicIcons, staticIcons, catalogIcons, and createIconcatCSSArtifact. The migration notes live in docs/reference/iconcat-tailwind-api-migration.md.

This improves future AI Coding quality by adding a tighter validation loop: tsdown package builds, tsgo type checks, Vitest, and three production example builds now cover declaration output, Next/Vite injection, and icon CSS artifact issues before manual preview.
```

Build tooling change:

```text
build(packages): consolidate package builds on tsdown

Replace per-package `rolldown && tsc` scripts with the shared tsdown config, keep the default `.d.mts/.d.cts` declaration output, and align ESM/CJS type resolution through conditional exports.

This build migration improves future AI Coding feedback speed: a single-package probe first validated the output shape, then the check expanded to the full Turborepo package build and tsgo typecheck so declaration suffix, rootDir, and worker warning issues were easier to isolate.
```

Test warning fix:

```text
test(tailwind): defer Figma integration test dependencies

Move the skipped Figma test node entry to a dynamic import inside the test body, avoiding Vitest collection-time loading of the old cross-fetch dependency chain and its Node punycode deprecation warning.

This improves future AI Coding judgment quality: `NODE_OPTIONS=--trace-deprecation` and a require hook identified whatwg-url/tr46 as the top-level load source, then the smallest test change removed the noise so unrelated warnings stop masking real failure signals.
```
