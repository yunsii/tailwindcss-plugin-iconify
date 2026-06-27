# Iconcat Tailwind API Migration

Iconcat no longer exports the old `add*IconSelectors` API names. Those names
came from the original Iconify Tailwind plugin shape, but the Iconcat adapter now
has a broader role: it supports runtime arbitrary icon classes, static icon class
export, and catalog-driven static export.

## Rename Map

| Before                                      | After                               |
| ------------------------------------------- | ----------------------------------- |
| `addDynamicIconSelectors(options)`          | `icons(options)`                    |
| dynamic-only usage                          | `dynamicIcons(options)`             |
| `addCleanIconSelectors(icons, options)`     | `staticIcons(icons, options)`       |
| `addCatalogIconSelectors(catalog, options)` | `catalogIcons(catalog, options)`    |
| `createTailwindIconcatCSSArtifact(options)` | `createIconcatCSSArtifact(options)` |
| `preprocessSets`                            | `static`                            |
| `DynamicIconifyPluginOptions`               | `DynamicIconsOptions`               |
| `CleanIconifyPluginOptions`                 | `StaticIconsOptions`                |
| `CatalogIconifyPluginOptions`               | `CatalogIconsOptions`               |
| `IconifyPluginCatalogInput`                 | `IconCatalogInput`                  |
| `IconcatCSSOptions`                         | `IconcatCSSArtifactOptions`         |

## Main Plugin

Before:

```ts
import { addDynamicIconSelectors } from '@iconcat/tailwind'

export default {
  plugins: [
    addDynamicIconSelectors({
      prefix: 'icon',
      preprocessSets: {
        'mdi-light': ['home', 'cog'],
      },
    }),
  ],
}
```

After:

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

`icons()` is the recommended Tailwind entry. It always supports runtime classes
such as `icon-[mdi-light--home]`. The optional `static` field exports static
classes such as `icon-mdi-light--home`.

## Split APIs

Use `dynamicIcons()` only when static class export must be impossible:

```ts
import { dynamicIcons } from '@iconcat/tailwind'

export default {
  plugins: [dynamicIcons()],
}
```

Use `staticIcons()` when the icon list is already known and you want fixed CSS
selectors:

```ts
import { staticIcons } from '@iconcat/tailwind'

export default {
  plugins: [
    staticIcons(['mdi-light:home', 'mdi-light:cog']),
  ],
}
```

Use `catalogIcons()` when consuming an Iconcat catalog directly inside Tailwind:

```ts
import { catalogIcons } from '@iconcat/tailwind'

export default {
  plugins: [
    catalogIcons({
      version: 1,
      icons: {
        'mdi-light': ['home', 'cog'],
      },
    }),
  ],
}
```

Production examples usually prefer the independent CSS artifact instead of
loading catalog CSS through Tailwind.

## Catalog CSS Artifact

Before:

```ts
import { createTailwindIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'

export default defineIconcatConfig({
  artifacts: [
    createTailwindIconcatCSSArtifact({
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
    }),
  ],
})
```

After:

```ts
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'

export default defineIconcatConfig({
  artifacts: [
    createIconcatCSSArtifact({
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
    }),
  ],
})
```
