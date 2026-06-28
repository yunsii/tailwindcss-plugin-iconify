# Iconcat Catalog Extraction Flow

Iconcat follows the same high-level idea as Lingui catalog extraction: start
from framework entries, traverse the reachable dependency graph, then emit a
small catalog for the assets that are actually used.

## Build Pipeline

```mermaid
flowchart TD
  A[Framework entries] --> B[Iconcat extractor]
  B --> C[Bundle dependency graph]
  C --> D[Reachable modules]
  D --> E[Static icon references]
  E --> F[.iconcat/catalog.json]
  F --> G[Tailwind adapter artifact]
  G --> H[.iconcat/iconcat.hash.css]
  H --> I[.iconcat/manifest.json]
  I --> J[Framework build output]
  J --> K[HTML link hashed icon CSS href]
  K --> L[Browser icon styles]
```

## Development vs Production

```mermaid
flowchart LR
  subgraph Dev[Development]
    A1[Source files] --> A2[Tailwind content scan]
    A2 --> A3[icons]
    A3 --> A4[Dev CSS receives icon rules on demand]
  end

  subgraph Prod[Production]
    B1[Framework entries] --> B2[Iconcat dependency extraction]
    B2 --> B3[Catalog JSON]
    B3 --> B4[Independent icon CSS artifact]
    B4 --> B5[Framework static output]
    B5 --> B8[Hashed icon CSS link]
    B6[Tailwind build] --> B7[Main CSS without icon payload]
  end
```

## Sequence

```mermaid
sequenceDiagram
  participant App as App build
  participant Iconcat as Iconcat extractor
  participant Bundler as Bundler graph
  participant Catalog as catalog.json
  participant Artifact as Tailwind artifact
  participant CSS as iconcat.hash.css
  participant Browser as Browser

  App->>Iconcat: run extract
  Iconcat->>Bundler: bundle framework entries
  Bundler-->>Iconcat: reachable modules per entry
  Iconcat->>Iconcat: scan icon-[set--name] references
  Iconcat->>Catalog: write .iconcat/catalog.json
  Iconcat->>Artifact: pass extracted catalog
  Artifact->>CSS: write .iconcat/iconcat.hash.css
  Artifact->>CSS: atomically write .iconcat/manifest.json last
  App->>App: build Tailwind main CSS
  App->>CSS: install icon CSS into framework static output
  Browser->>App: request page
  Browser->>CSS: request hashed icon CSS from framework assets
```

## Artifact Layout

```text
app build
├─ Tailwind main CSS
│  └─ application utilities, layout, and component styles
├─ framework static output
│  ├─ Next.js: .next/static/css/iconcat.[hash].css
│  └─ Vite: dist/assets/iconcat.[hash].css
├─ .iconcat/iconcat.[hash].css
│  └─ catalog-limited icon-[set--name] selectors
│     └─ SVG data URIs live in this separate stylesheet
├─ .iconcat/manifest.json
│  └─ current hashed icon CSS href
└─ .iconcat/catalog.json
   └─ normalized icon catalog and per-entry metadata
```

## Build Ordering

Iconcat keeps a deterministic manifest handoff even when a framework can run
extraction in parallel with its own compilation. The CSS file name is
content-hashed, and both CSS and manifest writes use same-directory temporary
files followed by atomic rename. The manifest is written last, so the framework
never observes a manifest that points at a half-written stylesheet.

- Next.js examples link `assetPrefix + /_next/static/css/iconcat.[hash].css`
  and install the extracted CSS into `.next/static/css` after `next build`.
- Vite examples link `base + /assets/iconcat.[hash].css` and emit the extracted
  CSS as a Rollup asset during `vite build`.
- Development keeps using Tailwind's dynamic icon selectors and does not run
  catalog extraction on every page interaction.

### Hashed CSS Handoff

The stable handoff between extraction and the framework build is the iconcat
manifest:

```mermaid
flowchart LR
  A[Scan reachable modules] --> B[Generate icon CSS]
  B --> C[Hash generated CSS content]
  C --> D[Write iconcat.hash.css]
  D --> E[Atomically write manifest.json last]
  E --> F[Adapter reads href and file]
  F --> G[Framework output receives CSS asset and link]
```

The hash is derived from the generated icon CSS content, not from a framework
bundle id. This keeps icon CSS cache invalidation independent from application
JavaScript and Tailwind output. A framework adapter should only read the
manifest after extraction finishes.

### Vite Build Integration

Vite is the cleanest plugin boundary for Iconcat because it exposes both the
build lifecycle and HTML transform hooks. `@iconcat/vite` starts
`writeIconCatalog()` in `buildStart()` without awaiting it, allowing Iconcat
dependency extraction to run in parallel with the Vite application bundle.

The later Vite hooks are the synchronization barrier:

1. `generateBundle()` awaits the extraction promise, reads the final manifest,
   and emits `iconcat.[hash].css` as a Vite asset.
2. `transformIndexHtml()` awaits the same promise, reads the same manifest, and
   injects the stylesheet link into `index.html`.

That makes Vite integration parallel during compilation but serial at the
manifest handoff. The CSS file name remains content-addressed, and the HTML
link always points at the exact emitted asset.

The recommended Vite public path is:

```ts
import { createViteIconcatPublicPath, iconcat } from '@iconcat/vite'

export default {
  plugins: [
    iconcat({
      publicPath: createViteIconcatPublicPath('/', 'assets'),
    }),
  ],
}
```

Use the app's configured Vite `base` and `build.assetsDir` values when calling
`createViteIconcatPublicPath()`. The generated CSS is emitted through the Vite
bundle, so it behaves like a build asset rather than a file copied into
`public`.

### Next.js Build Integration

Next.js does not currently provide a Vite-like, cross-router plugin boundary
that can both run a global dependency-tree extraction and inject an external
stylesheet into App Router, Pages Router, and Turbopack builds with one stable
API. Iconcat therefore keeps Next.js integration explicit and serial for now:

```mermaid
flowchart TD
  A[iconcat extract] --> B[.iconcat manifest and hashed CSS]
  B --> C[next build]
  C --> D[installNextIconcatCSS copies CSS into .next/static/css]
  D --> E[App Router layout or Pages Document reads manifest href]
  E --> F[HTML links assetPrefix + /_next/static/css/iconcat.hash.css]
```

The recommended Next.js public path is:

```ts
import { createNextIconcatPublicPath } from '@iconcat/next'

const publicPath = createNextIconcatPublicPath({
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
})
```

The CSS should be installed into `.next/static/css` because Next's
`assetPrefix` is designed around `/_next/static` assets. It should not be put
under `public/iconcat` for production output: files in `public` require callers
to add any CDN prefix themselves, while `/_next/static` matches the asset shape
that users already configure for Next build artifacts.

TODO: investigate a Next.js build wrapper that starts Iconcat extraction in
parallel with `next build`, then blocks manifest reads before App Router layout
or Pages Router `_document` emits the stylesheet link. The wrapper must protect
against stale manifests, expose a stable await boundary for both routers, and
still install the final CSS into `.next/static/css`.

### Why Not Loader, SWC, or Turbopack Rules

Iconcat extraction is a global build task:

- start from framework entries;
- traverse the reachable dependency graph;
- merge icon references across modules;
- generate one content-hashed CSS artifact;
- write the manifest only after the CSS is complete;
- inject or render the final stylesheet href.

Webpack loaders, Turbopack rules, and SWC plugins are module transformation
boundaries. They can transform the current file, but they are not the right
owner for a whole-app graph traversal plus stable asset emission and HTML
injection. This matters more for Next.js because App Router, Pages Router, and
Turbopack have different rendering and build pipelines.

For Turbopack specifically, `turbopack.rules` currently maps files to supported
webpack loaders. That can cover single-file transforms, but it does not provide
the same full plugin surface as Vite/Rollup for emitting a cross-route
content-hashed CSS asset and injecting the final link. Keeping Next.js as
`extract -> next build -> install -> render link` is simpler, deterministic,
and works across both router implementations.

## CSS Injection Strategy

Iconcat emits an independent icon stylesheet. It is not concatenated into the
application Tailwind CSS file because the catalog CSS has a separate lifecycle:
it is generated from the extracted icon catalog and is content-hashed on its own.

```mermaid
flowchart TD
  A[iconcat extract] --> B[.iconcat/iconcat.hash.css]
  B --> C[Framework static assets]
  C --> D[HTML stylesheet link]
  D --> E[Browser applies icon selectors]

  subgraph NextApp[Next.js App Router]
    NA[Layout reads manifest] --> NB[link rel stylesheet precedence next]
    NB --> NC[React outputs data-precedence]
  end

  subgraph NextPages[Next.js Pages Router]
    NP[_document reads manifest] --> NQ[preload style hint]
    NQ --> NR[link rel stylesheet]
  end

  subgraph Vite[Vite / React Router]
    VA[Vite build emits asset] --> VB[index.html stylesheet link]
  end
```

### Next.js App Router

Next.js App Router has a managed stylesheet pipeline for CSS that belongs to the
route module graph. Internally, `renderCssResource` renders external CSS as a
stylesheet link with a React `precedence` prop. React then serializes that prop
as `data-precedence` in HTML and uses it to hoist, dedupe, and order stylesheet
resources.

The important distinction is input vs output:

- Use `precedence` in React JSX when opting into React's managed stylesheet
  handling.
- Treat `data-precedence` as the rendered HTML output.
- Do not add a separate `rel="preload" as="style"` link for this path.

Next also registers style preload hints for its own App Router CSS during
server rendering. A manual CSS preload link would only fetch the resource; it
would not apply the stylesheet or participate in React's stylesheet ordering and
deduplication model. That is why App Router CSS usually appears as:

```html
<link rel="stylesheet" href="/_next/static/css/app.css" data-precedence="next" />
```

instead of a hand-written preload link.

Iconcat CSS is outside Next's route CSS manifest, so Next cannot discover it
automatically. The App Router example reads `.iconcat/manifest.json` during the
server render and emits a stylesheet link with `precedence="next"`. This makes
the generated HTML line up with App Router's stylesheet model while keeping the
icon CSS independently generated:

```tsx
const stylesheetProps = {
  href: iconcatCSSHref,
  precedence: 'next',
  rel: 'stylesheet',
} as const

return <link {...stylesheetProps} />
```

### Pages Router and Vite

Pages Router uses Next's legacy document head pipeline. Next emits preload hints
for CSS files that are part of its build manifest, but iconcat CSS is generated
outside that manifest. To keep the same loading shape, the Pages Router example
reads the iconcat manifest in `_document.tsx` and writes both links:

```tsx
<>
  <link as='style' href={iconcatCSSHref} rel='preload' />
  <link href={iconcatCSSHref} rel='stylesheet' />
</>
```

Vite owns HTML transformation during `vite build`, so the React Router example
emits the icon CSS as a Rollup asset and injects a normal stylesheet link into
the generated `index.html`.

## Router Coverage

Iconcat ships presets for the common React app entry shapes:

- Next.js App Router
- Next.js Pages Router
- React Router / Vite

For multi-entry frameworks such as Next.js App Router and Pages Router, the
catalog records per-entry usage. Shared components are still counted through
the dependency graph, but unrelated page modules are not pulled in when imports
stay direct and tree-shakable.

For single-entry client routers such as React Router, the catalog represents
the app entry and the routes reachable from that entry.
