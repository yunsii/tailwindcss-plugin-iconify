import { rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { performance } from 'node:perf_hooks'
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

import type { IconcatBundler } from '../src'

interface PersistentSample {
  bundler: string
  mode: string
  durationMs: number
  modules: number
  bundleHits?: number
  bundleMisses?: number
  fileHashHits?: number
  fileHashMisses?: number
  moduleHits?: number
}

const scenario = scenarios.find((item) => item.name === 'x-large-pages')!
const root = resolve(tmpdir(), `iconcat-persistent-cache-bench-${process.pid}`)
const entries = getScenarioEntries(scenario)

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`)
  process.exitCode = 1
})

async function main() {
  const samples: PersistentSample[] = []

  for (const bundler of [createEsbuildBundler(), createRolldownBundler()]) {
    samples.push(await measureCold(bundler))
    samples.push(await measureMemoryWarm(bundler))
    samples.push(await measurePersistentWarm(bundler))
    samples.push(await measurePersistentRewriteSameContent(bundler))
    samples.push(await measurePersistentLeafChange(bundler))
  }

  await rm(root, { recursive: true, force: true })
  printSamples(samples)
}

async function measureCold(bundler: IconcatBundler) {
  const cwd = await prepareScenario(bundler, 'cold')

  return timedSample(bundler, 'cold', cwd)
}

async function measureMemoryWarm(bundler: IconcatBundler) {
  const cwd = await prepareScenario(bundler, 'memory-warm')
  const cache = createMemoryIconcatExtractionCache()

  await runExtraction(cwd, bundler, cache)

  return timedSample(bundler, 'memory-warm', cwd, cache)
}

async function measurePersistentWarm(bundler: IconcatBundler) {
  const cwd = await prepareScenario(bundler, 'persistent-warm')
  const cacheFile = '.iconcat/cache/bench.json'

  await runExtraction(cwd, bundler, await createPersistentIconcatExtractionCache({
    cwd,
    file: cacheFile,
  }))

  const cache = await createPersistentIconcatExtractionCache({
    cwd,
    file: cacheFile,
  })

  return timedSample(bundler, 'persistent-warm', cwd, cache)
}

async function measurePersistentRewriteSameContent(bundler: IconcatBundler) {
  const cwd = await prepareScenario(bundler, 'persistent-same-content')
  const cacheFile = '.iconcat/cache/bench.json'

  await runExtraction(cwd, bundler, await createPersistentIconcatExtractionCache({
    cwd,
    file: cacheFile,
  }))
  await writeLeafModule(cwd, 'export const icon = \'mdi-light:entry0-0\'\n')

  const cache = await createPersistentIconcatExtractionCache({
    cwd,
    file: cacheFile,
  })

  return timedSample(bundler, 'persistent-same-content', cwd, cache)
}

async function measurePersistentLeafChange(bundler: IconcatBundler) {
  const cwd = await prepareScenario(bundler, 'persistent-leaf-change')
  const cacheFile = '.iconcat/cache/bench.json'

  await runExtraction(cwd, bundler, await createPersistentIconcatExtractionCache({
    cwd,
    file: cacheFile,
  }))
  await writeLeafModule(cwd, 'export const icon = \'mdi-light:entry0-changed\'\n')

  const cache = await createPersistentIconcatExtractionCache({
    cwd,
    file: cacheFile,
  })

  return timedSample(bundler, 'persistent-leaf-change', cwd, cache)
}

async function timedSample(
  bundler: IconcatBundler,
  mode: string,
  cwd: string,
  cache?: Awaited<ReturnType<typeof createPersistentIconcatExtractionCache>> | ReturnType<typeof createMemoryIconcatExtractionCache>,
): Promise<PersistentSample> {
  const start = performance.now()
  const result = await runExtraction(cwd, bundler, cache)
  const durationMs = performance.now() - start
  const stats = 'stats' in (cache || {}) ? cache?.stats() : undefined

  return {
    bundler: bundler.name,
    mode,
    durationMs,
    modules: result.graph.modules.length,
    bundleHits: 'bundleHits' in (stats || {}) ? stats?.bundleHits : undefined,
    bundleMisses: 'bundleMisses' in (stats || {}) ? stats?.bundleMisses : undefined,
    fileHashHits: 'fileHashHits' in (stats || {}) ? stats?.fileHashHits : undefined,
    fileHashMisses: 'fileHashMisses' in (stats || {}) ? stats?.fileHashMisses : undefined,
    moduleHits: 'moduleHits' in (stats || {}) ? stats?.moduleHits : undefined,
  }
}

async function runExtraction(
  cwd: string,
  bundler: IconcatBundler,
  cache?: Parameters<typeof extractIconCatalog>[0]['cache'],
) {
  return extractIconCatalog({
    cwd,
    entries,
    bundler,
    cache,
  })
}

async function prepareScenario(bundler: IconcatBundler, mode: string) {
  const cwd = resolve(root, `${bundler.name}-${mode}`)

  await rm(cwd, { recursive: true, force: true })
  await writeScenario(cwd, scenario)

  return cwd
}

async function writeLeafModule(cwd: string, content: string) {
  await writeFile(resolve(cwd, 'src/entry-0/module-0.tsx'), content)
}

function printSamples(samples: PersistentSample[]) {
  const lines = [
    `Scenario: ${scenario.name}`,
    `Reachable modules: ${getReachableModuleCount(scenario)}`,
    '',
    '| Bundler | Mode | Duration | Bundle Hits | Bundle Misses | File Hash Hits | File Hash Misses | Module Hits | Modules |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]

  samples.forEach((sample) => {
    lines.push([
      `| ${sample.bundler}`,
      sample.mode,
      `${sample.durationMs.toFixed(2)}ms`,
      formatOptional(sample.bundleHits),
      formatOptional(sample.bundleMisses),
      formatOptional(sample.fileHashHits),
      formatOptional(sample.fileHashMisses),
      formatOptional(sample.moduleHits),
      String(sample.modules),
    ].join(' | ').concat(' |'))
  })

  process.stdout.write(`${lines.join('\n')}\n`)
}

function formatOptional(value: number | undefined) {
  return value === undefined ? '-' : String(value)
}
