---
title: Iconcat Documentation
description: Start here for Iconcat catalog extraction, framework loading, benchmarks, and package build docs.
---

# Iconcat Documentation

This directory is the single source of truth for Iconcat documentation. The
repository README, package docs, and documentation website should link to or
render these Markdown files instead of duplicating long-form content in
framework-specific pages.

## Start Here

- [Catalog extraction flow](./concepts/iconcat-flow.md): dependency graph extraction,
  catalog generation, CSS artifacts, framework build order, and page-mode
  loading.
- [Framework loading](./concepts/framework-loading.md): Next.js App Router, Next.js Pages
  Router, React Router/Vite, hashed CSS installation, and SSR link rendering.
- [Next.js App Router](./frameworks/next-app-router.md): route-driven page CSS loading for
  App Router applications.
- [Next.js Pages Router](./frameworks/next-pages-router.md): `_document`, SSG, and SSR page
  CSS integration for Pages Router applications.
- [React Router with Vite](./frameworks/react-router-vite.md): Vite plugin extraction and
  production stylesheet injection.
- [Performance](./concepts/performance.md): extractor benchmarks, graph reuse, memory
  notes, and persistent cache strategy.
- [Tailwind API migration](./reference/iconcat-tailwind-api-migration.md): migration from
  the old `add*IconSelectors` API names to Iconcat's current Tailwind API.
- [Package build](./reference/package-build.md): tsdown package build contract and
  repository typecheck conventions.

## Documentation Website

The Next.js documentation app under `apps/site` renders these Markdown files
through Fumadocs. Route demo pages can add live catalog panels, but their
explanatory copy should live here.

## Maintenance Rule

When behavior changes, update the closest Markdown file in this directory in
the same change as the code. Avoid adding framework explanations directly in
TSX pages unless they are short labels, buttons, or generated demo metadata.
