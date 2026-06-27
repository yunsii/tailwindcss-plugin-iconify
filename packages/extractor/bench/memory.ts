import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import process from 'node:process'

import { resolve } from 'pathe'

import {
  createEsbuildBundler,
  createMemoryIconcatExtractionCache,
  createPersistentIconcatExtractionCache,
  extractIconCatalog,
} from '../src'
import { createRolldownBundler } from '../src/rolldown'
import {
  getReachableModuleCount,
  getScenarioEntries,
  scenarios,
  writeScenario,
} from './scenarios'

import type {
  IconcatBundler,
  IconcatExtractionCache,
} from '../src'

type MemoryMode = 'cold' | 'cache-prime' | 'warm-cache' | 'persistent-warm'

interface MemorySample {
  bundler: string
  mode: MemoryMode
  heapDelta: number
  rssDelta: number
  cachePayload: number
  modules: number
}

const scenario = scenarios.find((item) => item.name === 'x-large-pages')!
const entries = getScenarioEntries(scenario)
const root = resolve(tmpdir(), `iconcat-memory-bench-${process.pid}`)

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`)
  process.exitCode = 1
})

async function main() {
  const samples: MemorySample[] = []

  for (const bundler of [createEsbuildBundler(), createRolldownBundler()]) {
    samples.push(await measure(bundler, 'cold'))
    samples.push(await measure(bundler, 'cache-prime'))
    samples.push(await measure(bundler, 'warm-cache'))
    samples.push(await measure(bundler, 'persistent-warm'))
  }

  await rm(root, { recursive: true, force: true })
  printSamples(samples)
}

async function measure(
  bundler: IconcatBundler,
  mode: MemoryMode,
): Promise<MemorySample> {
  const cwd = resolve(root, `${bundler.name}-${mode}`)
  const cache = await createCache(cwd, mode)

  await rm(cwd, { recursive: true, force: true })
  await writeScenario(cwd, scenario)

  if (mode === 'warm-cache') {
    await runExtraction(cwd, bundler, cache)
  }
  if (mode === 'persistent-warm') {
    await runExtraction(cwd, bundler, cache)
  }

  forceGC()
  const before = process.memoryUsage()
  const result = await runExtraction(cwd, bundler, cache)
  forceGC()
  const after = process.memoryUsage()

  if (!result.graph.modules.length) {
    throw new Error('Expected memory benchmark extraction to discover modules.')
  }

  return {
    bundler: bundler.name,
    mode,
    heapDelta: after.heapUsed - before.heapUsed,
    rssDelta: after.rss - before.rss,
    cachePayload: cache ? getCachePayloadBytes(cache) : 0,
    modules: result.graph.modules.length,
  }
}

async function runExtraction(
  cwd: string,
  bundler: IconcatBundler,
  cache?: IconcatExtractionCache,
) {
  return extractIconCatalog({
    cwd,
    entries,
    bundler,
    cache,
  })
}

async function createCache(
  cwd: string,
  mode: MemorySample['mode'],
) {
  if (mode === 'cold') {
    return undefined
  }

  if (mode === 'persistent-warm') {
    return createPersistentIconcatExtractionCache({ cwd })
  }

  return createMemoryIconcatExtractionCache()
}

function getCachePayloadBytes(cache: NonNullable<Awaited<ReturnType<typeof createCache>>>) {
  const stats = cache.stats()

  return stats.bundleCodeBytes + stats.moduleIconBytes
}

function forceGC() {
  globalThis.gc?.()
}

function printSamples(samples: MemorySample[]) {
  const lines = [
    `Scenario: ${scenario.name}`,
    `Reachable modules: ${getReachableModuleCount(scenario)}`,
    '',
    '| Bundler | Mode | Heap Delta | RSS Delta | Cache Payload | Modules |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  ]

  samples.forEach((sample) => {
    lines.push([
      `| ${sample.bundler}`,
      sample.mode,
      formatBytes(sample.heapDelta),
      formatBytes(sample.rssDelta),
      formatBytes(sample.cachePayload),
      String(sample.modules),
    ].join(' | ').concat(' |'))
  })

  process.stdout.write(`${lines.join('\n')}\n`)
}

function formatBytes(bytes: number) {
  const sign = bytes < 0 ? '-' : ''
  const absolute = Math.abs(bytes)

  return `${sign}${(absolute / 1024 / 1024).toFixed(2)} MiB`
}
