---
title: Custom Icon Libraries
description: Use local SVG directories, local Iconify JSON files, and Figma components as Iconcat icon sets.
---

# Custom Icon Libraries

Iconcat uses Iconify-compatible icon sets. Public packages such as
`@iconify-json/mdi` work out of the box, and project-owned icon libraries can be
loaded through the Tailwind adapter.

Custom icon libraries usually come from three sources:

- a local SVG directory;
- an existing local Iconify JSON file;
- Figma components exported into Iconify JSON before the build.

These inputs feed `@iconcat/tailwind`. After that, Iconcat framework extraction
can discover classes such as `icon-[product--home]` from reachable source and
emit the same hashed CSS artifacts as public Iconify packages.

## Local SVG Directory

Use `getLocalIconSets()` when the project owns raw SVG files:

```ts
import { icons } from '@iconcat/tailwind'
import { getLocalIconSets } from '@iconcat/tailwind/local-icon-sets'

export default {
  plugins: [
    icons({
      iconSets: getLocalIconSets({
        define: {
          product: 'src/icons/product',
        },
      }),
    }),
  ],
}
```

The key (`product`) becomes the icon set prefix. A file such as
`src/icons/product/search.svg` is used as `icon-[product--search]`.

Use the object form when import options or color preservation are needed:

```ts
getLocalIconSets({
  define: {
    product: {
      path: 'src/icons/product',
      preserveColors: ({ iconName }) => iconName.endsWith('-colored'),
    },
  },
})
```

By default Iconcat optimizes icons for `currentColor`. Preserve colors only for
icons that intentionally carry brand or multicolor artwork.

## Local Iconify JSON

If the icon set already exists as Iconify JSON, load the file directly:

```ts
import { icons } from '@iconcat/tailwind'
import { getLocalIconSets } from '@iconcat/tailwind/local-icon-sets'

export default {
  plugins: [
    icons({
      iconSets: getLocalIconSets({
        define: {
          product: {
            iconifyJsonPath: 'src/icons/product/icons.json',
          },
        },
      }),
    }),
  ],
}
```

This is also the handoff format used by the Figma importer.

## Figma Icon Import

Figma import is a pre-build step. Tailwind plugins are synchronous, so Iconcat
does not download Figma files inside the Tailwind plugin. Instead, run a Node
script that imports Figma components and writes local Iconify JSON files.

```ts
import { loadFigmaIconSets } from '@iconcat/tailwind/figma-icon-sets/node'

await loadFigmaIconSets({
  import: {
    token: process.env.FIGMA_TOKEN!,
    cache: true,
    preserveColorsGroup: 'colored',
    files: [
      {
        id: 'figma-file-id',
        nodeIds: ['111-8', '113-3'],
        prefix: 'product',
      },
    ],
  },
  write: {
    outputDir: 'src/icons/figma',
  },
})
```

For a file with `prefix: 'product'`, the writer creates:

```txt
src/icons/figma/product/icons.json
src/icons/figma/product/icons.html
```

Then load that generated JSON through `getLocalIconSets()`:

```ts
import { icons } from '@iconcat/tailwind'
import { getLocalIconSets } from '@iconcat/tailwind/local-icon-sets'

export default {
  plugins: [
    icons({
      iconSets: getLocalIconSets({
        define: {
          product: {
            iconifyJsonPath: 'src/icons/figma/product/icons.json',
          },
        },
      }),
    }),
  ],
}
```

## Figma Options

The importer accepts multiple files and merges icon sets with the same prefix.

| Option                         | Purpose                                                                    |
| ------------------------------ | -------------------------------------------------------------------------- |
| `token`                        | Figma access token. Keep it in environment variables, not source files.    |
| `files[].id`                   | Figma file ID.                                                             |
| `files[].nodeIds`              | Limits import to known nodes. Prefer this over broad page imports.         |
| `files[].prefix`               | Iconify set prefix used in classes such as `icon-[product--search]`.       |
| `cache`                        | Writes Figma API cache under `.figma-cache/<prefix>`.                      |
| `cacheOptions.ifModifiedSince` | Lets repeated imports skip unchanged Figma files.                          |
| `preserveColorsGroup`          | Preserves colors for icons under matching Figma group/frame/section names. |

Use `nodeIds` when possible. Figma page-level import can still download more
data than expected, and the upstream Iconify Figma importer has the same Figma
API and document-shape limitations.

## Write Modes

`writeIconifyJSONs()` defaults to `incremental-update`. This mode can add or
update icons, but refuses to delete existing local icons. Use it for daily
design-system syncs because it protects hand-maintained icon sets from
accidental Figma removals.

Use `full-update` only when the generated icon directory is fully owned by
Figma:

```ts
await loadFigmaIconSets({
  import: {
    token: process.env.FIGMA_TOKEN!,
    files: [{ id: 'figma-file-id', prefix: 'product' }],
  },
  write: {
    mode: 'full-update',
    outputDir: 'src/icons/figma',
  },
})
```

`full-update` can delete icons that no longer exist in Figma, so review the
generated diff before committing.

## Extraction Notes

Custom icon libraries are visible to Tailwind through `iconSets`. Iconcat
framework extraction still discovers usage from source code:

- static class names such as `icon-[product--search]` are extracted from
  reachable files;
- icons chosen from data or configuration should be declared with
  `defineIconcatIcons()`;
- the Figma import script should run before production extraction if generated
  JSON files are not already committed.

Generated `icons.html` preview files are useful for design review, but they are
not required by Iconcat runtime or framework adapters.
