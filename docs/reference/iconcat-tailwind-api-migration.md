---
title: Legacy Package Migration
description: Move from tailwindcss-plugin-iconify to the Iconcat package family and framework extraction flow.
---

# Legacy Package Migration

This guide is for projects already using `tailwindcss-plugin-iconify`.
The migration is not just an API rename. The old package was a Tailwind plugin
that generated icon CSS from Tailwind class usage. Iconcat keeps that Tailwind
adapter, but adds a framework-level extraction pipeline:

- `@iconcat/tailwind` owns Tailwind icon CSS generation.
- `iconcat` owns catalog extraction from framework entries.
- `@iconcat/next` and `@iconcat/vite` own production stylesheet installation
  and rendering.
- `tailwindcss-plugin-iconify` remains a compatibility package that re-exports
  the current Tailwind adapter.

## Migration Path

| Phase | What changes                                                                      | Why                                                                                                  |
| ----- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1     | Keep `tailwindcss-plugin-iconify` if you only need Tailwind dynamic icon classes. | Lowest-risk compatibility path.                                                                      |
| 2     | Switch imports to `@iconcat/tailwind`.                                            | Makes the package boundary explicit and unlocks catalog CSS helpers.                                 |
| 3     | Move local and Figma icon import scripts to the new `@iconcat/tailwind` paths.    | Keeps custom Iconify JSON generation separate from Tailwind runtime plugins.                         |
| 4     | Add `iconcat` extraction for production builds.                                   | Extracts icons from reachable framework source instead of relying only on Tailwind content scanning. |
| 5     | Add `@iconcat/next` or `@iconcat/vite`.                                           | Lets the framework render hashed Iconcat CSS files in production.                                    |

Do not migrate every layer at once unless the app already has a production
stylesheet integration plan. The Tailwind adapter can move first; framework
extraction can follow when the build pipeline is ready.

## Tailwind-Only Compatibility

If the app only uses runtime arbitrary classes such as
`icon-[mdi-light--home]`, the compatibility package can stay in place while the
rest of the app is unchanged:

```ts
import { icons } from 'tailwindcss-plugin-iconify'

export default {
  plugins: [
    icons({
      prefix: 'icon',
    }),
  ],
}
```

This still uses the current Iconcat Tailwind adapter internally. It does not add
entry-driven extraction, hashed CSS artifacts, or framework stylesheet loading.

## Move To The Iconcat Tailwind Package

When the project is ready to use the new package family directly, change the
import source to `@iconcat/tailwind`:

```ts
import { icons } from '@iconcat/tailwind'

export default {
  plugins: [
    icons({
      prefix: 'icon',
      static: {
        'mdi-light': ['home', 'cog'],
      },
    }),
  ],
}
```

`icons()` is the normal Tailwind entry. It supports runtime classes like
`icon-[mdi-light--home]` and optional static classes from `static`.

Use the split APIs only when the project needs a narrower contract:

```ts
import { catalogIcons, dynamicIcons, staticIcons } from '@iconcat/tailwind'

export default {
  plugins: [
    dynamicIcons(),
    staticIcons(['mdi-light:home', 'mdi-light:cog']),
    catalogIcons({
      version: 1,
      icons: {
        'mdi-light': ['home', 'cog'],
      },
    }),
  ],
}
```

## Move Figma And Local Icon Inputs

The old package included helper entry points for local SVG directories and
Figma imports. Those capabilities still exist, but they are icon-set input
generation, not framework extraction itself.

Compatibility imports still work through the legacy package:

```ts
import { loadFigmaIconSets } from 'tailwindcss-plugin-iconify/figma-icon-sets/node'
import { getLocalIconSets } from 'tailwindcss-plugin-iconify/local-icon-sets'
```

Prefer the Iconcat package paths for new code:

```ts
import { loadFigmaIconSets } from '@iconcat/tailwind/figma-icon-sets/node'
import { getLocalIconSets } from '@iconcat/tailwind/local-icon-sets'
```

Tailwind plugins are synchronous, so Figma imports should run before Tailwind or
Iconcat extraction. See [Custom Icon Libraries](/docs/reference/custom-icon-libraries) for
the full local SVG, local Iconify JSON, and Figma import flow.

## Add Framework Extraction

Tailwind-only usage is still content-scan driven. Iconcat's framework flow starts
from app entries, follows the reachable dependency graph, extracts icon classes
and `defineIconcatIcons()` declarations, then writes a catalog and CSS artifact.

Install the extractor package used by the build:

```bash
pnpm add -D iconcat @iconcat/tailwind
```

Create an Iconcat config:

```ts
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'
import { defineIconcatConfig } from 'iconcat'

export default defineIconcatConfig({
  entries: [
    { file: 'src/app/layout.tsx', scope: 'global', priority: true },
    { file: 'src/app/page.tsx', scope: 'page' },
  ],
  artifacts: [
    createIconcatCSSArtifact({
      mode: 'page',
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
    }),
  ],
})
```

This is the point where the migration becomes more than a Tailwind plugin
rename: production icon CSS can be emitted as an independent, content-hashed
stylesheet owned by Iconcat.

## Add Framework Loading

After the catalog CSS artifact exists, the framework adapter is responsible for
making those files reachable by the app.

For Next.js App Router, use `@iconcat/next/app-router` to render stylesheet
links from the generated manifest:

```tsx
import { IconcatAppRouterStylesheets } from '@iconcat/next/app-router'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <IconcatAppRouterStylesheets manifest='.iconcat/manifest.json' />
        {children}
      </body>
    </html>
  )
}
```

For Pages Router, wrap `next/document`'s `Head` with the Pages adapter. For Vite,
use the `@iconcat/vite` plugin and public-path helper. See the framework docs
for the route-specific contracts.

## API Rename Map

The old names came from the original Iconify Tailwind plugin shape. Use the new
names when moving to `@iconcat/tailwind`:

| Before                                      | After                                       |
| ------------------------------------------- | ------------------------------------------- |
| `addDynamicIconSelectors(options)`          | `icons(options)` or `dynamicIcons(options)` |
| `addCleanIconSelectors(icons, options)`     | `staticIcons(icons, options)`               |
| `addCatalogIconSelectors(catalog, options)` | `catalogIcons(catalog, options)`            |
| `createTailwindIconcatCSSArtifact(options)` | `createIconcatCSSArtifact(options)`         |
| `preprocessSets`                            | `static`                                    |
| `DynamicIconifyPluginOptions`               | `DynamicIconsOptions`                       |
| `CleanIconifyPluginOptions`                 | `StaticIconsOptions`                        |
| `CatalogIconifyPluginOptions`               | `CatalogIconsOptions`                       |
| `IconifyPluginCatalogInput`                 | `IconCatalogInput`                          |
| `IconcatCSSOptions`                         | `IconcatCSSArtifactOptions`                 |

The compatibility package does not make old removed exports come back. If the
project imports `add*IconSelectors`, migrate those names before switching the
framework build to Iconcat extraction.

## What To Verify

- Tailwind development still renders `icon-[set--name]` classes.
- Static classes configured through `static` are present in generated CSS.
- The Iconcat build writes `.iconcat/catalog.json` and the configured CSS files.
- The framework adapter renders the generated stylesheet links only in
  production paths that need them.
- Pages that render icons from data or configuration declare those icons with
  `defineIconcatIcons()` so dependency extraction can see them.
