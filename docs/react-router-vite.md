---
title: React Router With Vite
description: Vite plugin extraction and production stylesheet injection for React Router applications.
---

# React Router With Vite

React Router examples use the Vite adapter. The Vite plugin starts Iconcat
extraction during `buildStart`, waits for the generated manifest before
emitting assets, and injects stylesheet links into the production HTML.

```ts
import { iconcat } from '@iconcat/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    iconcat({
      entries: ['src/App.tsx'],
    }),
  ],
})
```

## Build Flow

1. Vite starts the application build.
2. The Iconcat plugin starts catalog extraction from configured entries.
3. The Tailwind artifact writes content-hashed icon CSS files and
   `.iconcat/manifest.json`.
4. Vite emits the Iconcat CSS asset under `dist/assets`.
5. `transformIndexHtml` injects the stylesheet link into production HTML.

This keeps development fast while production HTML only links icon CSS that was
reachable from the configured application entries.

## Page Mode

React Router page-mode support currently treats configured entries as catalog
boundaries and globally injects the generated CSS through the Vite HTML output.
More granular route-level loading can be layered on top of the same manifest
helpers when a router-specific route manifest is available.

See [framework loading](./framework-loading.md) for the Vite adapter loading
model and [performance](./performance.md) for extraction benchmarks.
