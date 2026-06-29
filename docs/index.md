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

- [Catalog extraction flow](/docs/concepts/iconcat-flow): dependency graph extraction,
  catalog generation, CSS artifacts, framework build order, and page-mode
  loading.
- [Framework loading](/docs/concepts/framework-loading): Next.js App Router, Next.js Pages
  Router, React Router/Vite, hashed CSS installation, and SSR link rendering.
- [Next.js App Router](/docs/frameworks/next-app-router): route-driven page CSS loading for
  App Router applications.
- [Next.js Pages Router](/docs/frameworks/next-pages-router): `_document`, SSG, and SSR page
  CSS integration for Pages Router applications.
- [React Router with Vite](/docs/frameworks/react-router-vite): Vite plugin extraction and
  production stylesheet injection.
- [Performance](/docs/concepts/performance): extractor benchmarks, graph reuse, memory
  notes, and persistent cache strategy.
- [Custom icon libraries](/docs/reference/custom-icon-libraries): local SVG
  directories, local Iconify JSON files, and Figma component imports.
- [Legacy package migration](/docs/reference/iconcat-tailwind-api-migration): migrate
  `tailwindcss-plugin-iconify` projects to Iconcat packages, framework extraction,
  and the current Tailwind adapter API.
- [Package build](/docs/reference/package-build): tsdown package build contract and
  repository typecheck conventions.

## Documentation Website

The Next.js documentation app under `apps/site` renders these Markdown files
through Fumadocs. Route demo pages can add live catalog panels, but their
explanatory copy should live here.

## Maintenance Rule

When behavior changes, update the closest Markdown file in this directory in
the same change as the code. Avoid adding framework explanations directly in
TSX pages unless they are short labels, buttons, or generated demo metadata.
