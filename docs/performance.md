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
not part of the public cache key because they can change when content does not,
and they can stay misleading across generated files or filesystem syncs.

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
| small         |      36.19ms |            18.56ms |       37.09ms |             16.97ms |
| medium        |     208.13ms |           137.84ms |      267.41ms |            143.70ms |
| large         |     687.78ms |           512.09ms |      790.25ms |            467.42ms |
| x-large-pages |        1.87s |           859.75ms |         2.53s |            896.07ms |

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

| Bundler  |        Mode | Heap Delta |   RSS Delta | Cache Payload | Modules |
| -------- | ----------: | ---------: | ----------: | ------------: | ------: |
| esbuild  |        cold |   5.12 MiB |  102.68 MiB |      0.00 MiB |    6240 |
| esbuild  | cache-prime |  10.92 MiB |   -0.53 MiB |      5.45 MiB |    6240 |
| esbuild  |  warm-cache |  -0.05 MiB |   -0.31 MiB |      5.45 MiB |    6240 |
| rolldown |        cold |   7.56 MiB |  906.05 MiB |      0.00 MiB |    6240 |
| rolldown | cache-prime |  15.16 MiB | -190.38 MiB |      5.45 MiB |    6240 |
| rolldown |  warm-cache |   0.19 MiB |    0.63 MiB |      5.45 MiB |    6240 |

## Notes

The benchmark is intentionally not a CI threshold yet. Bundler timings vary by
CPU, filesystem, package manager cache state, and native allocator behavior.
Use it as a repeatable local baseline when changing dependency graph traversal,
source scanning, cache design, or bundler integration.

For real app validation, run the affected example build after the benchmark so
the framework-specific CSS injection path is covered as well.
