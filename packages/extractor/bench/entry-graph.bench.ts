import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { resolve } from 'pathe'
import { afterAll, beforeAll, bench, describe } from 'vitest'

import {
  createEsbuildBundler,
  createMemoryIconcatExtractionCache,
  extractIconCatalog,
} from '../src'
import { createRolldownBundler } from '../src/rolldown'
import {
  getReachableModuleCount,
  getScenarioEntries,
  scenarios,
  writeScenario,
} from './scenarios'

import type { IconcatBundler, MemoryIconcatExtractionCache } from '../src'

const bundlers = [
  createEsbuildBundler(),
  createRolldownBundler(),
]

const root = resolve(tmpdir(), `iconcat-entry-graph-bench-${process.pid}`)

beforeAll(async () => {
  await rm(root, { recursive: true, force: true })

  for (const scenario of scenarios) {
    await writeScenario(resolve(root, scenario.name), scenario)
  }
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('entry graph extraction', () => {
  for (const scenario of scenarios) {
    const cwd = resolve(root, scenario.name)
    const entries = getScenarioEntries(scenario)
    const totalModules = getReachableModuleCount(scenario)

    describe(`${scenario.name}: ${scenario.entries} entries / ${totalModules} reachable modules`, () => {
      for (const bundler of bundlers) {
        const cache = createMemoryIconcatExtractionCache()

        bench(
          `${bundler.name}:cold`,
          async () => {
            await runExtraction(cwd, entries, bundler)
          },
          {
            iterations: 3,
            time: 100,
            warmupIterations: 1,
            warmupTime: 10,
          },
        )

        bench(
          `${bundler.name}:warm-cache`,
          async () => {
            await runExtraction(cwd, entries, bundler, cache)
          },
          {
            iterations: 3,
            time: 100,
            warmupIterations: 1,
            warmupTime: 10,
          },
        )
      }
    })
  }
})

async function runExtraction(
  cwd: string,
  entries: string[],
  bundler: IconcatBundler,
  cache?: MemoryIconcatExtractionCache,
) {
  const result = await extractIconCatalog({
    cwd,
    entries,
    bundler,
    cache,
  })

  if (!result.graph.modules.length) {
    throw new Error('Expected benchmark extraction to discover reachable modules.')
  }

  return result
}
