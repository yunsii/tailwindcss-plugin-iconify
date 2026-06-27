# Performance

Iconcat extracts icon catalogs from framework entry points by asking a bundler
for the reachable dependency graph, then scanning only the modules that belong
to that graph. This follows the same direction as Lingui's experimental
extractor work in PR #2572: keep the extractor bundler pluggable, support a
Rolldown-backed path, and traverse shared chunks so code-splitting does not hide
reachable modules.

## Graph Reuse And Cache

The dependency graph traversal is exposed as reusable extractor primitives:

- `traverseIconcatChunkGraph()` walks entry chunks, static imports, dynamic
  imports, and shared chunks once, then returns per-entry module ownership.
- `buildIconcatBundleFromGraph()` builds on that traversal and reads the
  reachable source modules for catalog extraction.

Bundler adapters should convert their native graph shape into
`IconcatChunkGraphNode[]` and call these helpers instead of reimplementing
chunk traversal. This keeps esbuild, Rolldown, and future framework integrations
on the same graph semantics.

Repeated extraction can pass `cache: createMemoryIconcatExtractionCache()` or a
custom `IconcatExtractionCache` implementation. The cache has two levels:

- Bundle cache: keyed by cwd, entries, exclude rules, and `bundler.cacheKey`.
  It stores the previous reachable bundle and validates it with content hashes
  for every reachable module before reusing it. If a module is changed or
  removed, Iconcat reruns the bundler and refreshes the graph.
- Module cache: keyed by file, source content hash, and extractor options. It
  reuses icon scanning results when a file is rewritten with identical content.

Content hash is the correctness boundary. mtime and file size are intentionally
not part of the public cache key because they can change when content does not.
The persistent cache may still use mtime and size internally as a fast path to
skip rereading unchanged files; if either value changes, Iconcat rereads the
file and compares the content hash.

The persistent cache uses a Merkle dependency graph. Each module stores:

```text
selfHash = hash(source content)
subtreeHash = hash(selfHash + sorted(direct child subtreeHash))
```

When a cached file changes but the old dependency graph still exists, Iconcat
updates the changed module code, refreshes the Merkle hashes, and reuses the
bundle graph. If an import graph change is not represented by the cached graph,
the next bundler miss refreshes the graph.

## Entry Graph Benchmark

Run:

```bash
pnpm run bench:extractor
```

The benchmark uses Vitest benchmark mode. It generates temporary synthetic
React/TypeScript projects and runs the same `extractIconCatalog()` pipeline with
both bundlers:

- `createEsbuildBundler()`
- `createRolldownBundler()`

Scenarios:

| Scenario      | Entries |             Entry-local modules | Shared modules |
| ------------- | ------: | ------------------------------: | -------------: |
| small         |       1 |                             100 |             20 |
| medium        |       4 |                   250 per entry |            100 |
| large         |       8 |                   500 per entry |            200 |
| x-large-pages |     120 | 45 per entry + 1 dynamic module |            600 |

The output is Vitest/tinybench benchmark output:

- `:cold`: first-pass extraction that asks the bundler for a fresh dependency
  graph.
- `:warm-cache`: repeated extraction with an already-warmed in-memory
  `IconcatExtractionCache`.
- `icons`: extracted catalog size.
- `hz`, `mean`, and `samples`: tinybench statistics for each bundler and
  scenario.

Example local result from this repository on June 27, 2026:

| Scenario      | esbuild cold | esbuild warm-cache | Rolldown cold | Rolldown warm-cache |
| ------------- | -----------: | -----------------: | ------------: | ------------------: |
| small         |      27.43ms |            12.98ms |       27.19ms |             11.20ms |
| medium        |     158.85ms |           116.02ms |      180.70ms |            129.71ms |
| large         |     655.47ms |           602.99ms |      580.75ms |            456.98ms |
| x-large-pages |        1.75s |           765.17ms |         1.84s |            821.43ms |

## Persistent Cache Benchmark

Run:

```bash
pnpm run bench:extractor:persistent
```

The persistent benchmark uses the `x-large-pages` scenario and compares:

- `cold`: no cache.
- `memory-warm`: in-process memory cache.
- `persistent-warm`: a new process-style cache instance reading
  `.iconcat/cache/extractor-v1.json`.
- `persistent-same-content`: one file is rewritten with identical content.
- `persistent-leaf-change`: one leaf module changes its icon string without
  changing imports.

Example local result from this repository on June 27, 2026:

| Bundler  |                    Mode | Duration | Bundle Hits | Bundle Misses | File Hash Hits | File Hash Misses | Module Hits | Modules |
| -------- | ----------------------: | -------: | ----------: | ------------: | -------------: | ---------------: | ----------: | ------: |
| esbuild  |                    cold |    2.45s |           - |             - |              - |                - |           - |    6240 |
| esbuild  |             memory-warm | 952.26ms |           - |             - |              - |                - |           - |    6240 |
| esbuild  |         persistent-warm | 677.99ms |           1 |             0 |           6240 |                0 |        6240 |    6240 |
| esbuild  | persistent-same-content | 716.52ms |           1 |             0 |           6239 |                1 |        6240 |    6240 |
| esbuild  |  persistent-leaf-change | 658.94ms |           1 |             0 |           6239 |                1 |        6239 |    6240 |
| rolldown |                    cold |    2.55s |           - |             - |              - |                - |           - |    6240 |
| rolldown |             memory-warm | 974.91ms |           - |             - |              - |                - |           - |    6240 |
| rolldown |         persistent-warm | 624.22ms |           1 |             0 |           6240 |                0 |        6240 |    6240 |
| rolldown | persistent-same-content | 641.44ms |           1 |             0 |           6239 |                1 |        6240 |    6240 |
| rolldown |  persistent-leaf-change | 647.24ms |           1 |             0 |           6239 |                1 |        6239 |    6240 |

## Memory Benchmark

Run:

```bash
pnpm run bench:extractor:memory
```

The memory script uses the `x-large-pages` scenario and runs Node with
`--expose-gc`. It reports:

- `Heap Delta` and `RSS Delta`: local runtime observations around one
  extraction. RSS can move with native bundler allocators and should be treated
  as a rough signal, not a stable threshold.
- `Cache Payload`: the retained cache payload owned by Iconcat's in-memory
  cache, including cached bundle source text and serialized module icon results.
  This is the stable number to compare when changing cache design.

Example local result from this repository on June 27, 2026:

| Bundler  |            Mode | Heap Delta |   RSS Delta | Cache Payload | Modules |
| -------- | --------------: | ---------: | ----------: | ------------: | ------: |
| esbuild  |            cold |   5.16 MiB |  115.88 MiB |      0.00 MiB |    6240 |
| esbuild  |     cache-prime |  15.23 MiB |   13.61 MiB |      5.45 MiB |    6240 |
| esbuild  |      warm-cache |   0.21 MiB |    1.25 MiB |      5.45 MiB |    6240 |
| esbuild  | persistent-warm |   0.38 MiB |    0.36 MiB |      5.45 MiB |    6240 |
| rolldown |            cold |   7.54 MiB |  918.27 MiB |      0.00 MiB |    6240 |
| rolldown |     cache-prime |  15.35 MiB |   73.19 MiB |      5.45 MiB |    6240 |
| rolldown |      warm-cache |   0.19 MiB | -197.07 MiB |      5.45 MiB |    6240 |
| rolldown | persistent-warm |   0.18 MiB |    0.10 MiB |      5.45 MiB |    6240 |

## Notes

The benchmark is intentionally not a CI threshold yet. Bundler timings vary by
CPU, filesystem, package manager cache state, and native allocator behavior.
Use it as a repeatable local baseline when changing dependency graph traversal,
source scanning, cache design, or bundler integration.

For real app validation, run the affected example build after the benchmark so
the framework-specific CSS injection path is covered as well.
