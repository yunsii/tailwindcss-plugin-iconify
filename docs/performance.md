# Performance

Iconcat extracts icon catalogs from framework entry points by asking a bundler
for the reachable dependency graph, then scanning only the modules that belong
to that graph. This follows the same direction as Lingui's experimental
extractor work in PR #2572: keep the extractor bundler pluggable, support a
Rolldown-backed path, and traverse shared chunks so code-splitting does not hide
reachable modules.

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

- `reachableModules`: modules discovered from the emitted entry and shared
  chunks.
- `icons`: extracted catalog size.
- `hz`, `mean`, and `samples`: tinybench statistics for each bundler and
  scenario.

## Notes

The benchmark is intentionally not a CI threshold yet. Bundler timings vary by
CPU, filesystem, and package manager cache state. Use it as a repeatable local
baseline when changing dependency graph traversal, source scanning, or bundler
integration.

For real app validation, run the affected example build after the benchmark so
the framework-specific CSS injection path is covered as well.
