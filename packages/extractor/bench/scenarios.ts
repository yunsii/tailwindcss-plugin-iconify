import { mkdir, writeFile } from 'node:fs/promises'

import { resolve } from 'pathe'

export interface Scenario {
  dynamicModulesPerEntry?: number
  name: string
  entries: number
  modulesPerEntry: number
  sharedModules: number
}

export const scenarios: Scenario[] = [
  {
    name: 'small',
    entries: 1,
    modulesPerEntry: 100,
    sharedModules: 20,
  },
  {
    name: 'medium',
    entries: 4,
    modulesPerEntry: 250,
    sharedModules: 100,
  },
  {
    name: 'large',
    entries: 8,
    modulesPerEntry: 500,
    sharedModules: 200,
  },
  {
    name: 'x-large-pages',
    entries: 120,
    modulesPerEntry: 45,
    sharedModules: 600,
    dynamicModulesPerEntry: 1,
  },
]

export function getScenarioEntries(scenario: Scenario) {
  return Array.from({ length: scenario.entries }, (_, index) =>
    `src/entry-${index}.tsx`)
}

export function getReachableModuleCount(scenario: Scenario) {
  return scenario.entries
    * (scenario.modulesPerEntry + (scenario.dynamicModulesPerEntry || 0))
    + scenario.sharedModules
    + scenario.entries
}

export async function writeScenario(cwd: string, scenario: Scenario) {
  await mkdir(resolve(cwd, 'src/shared'), { recursive: true })

  for (let index = 0; index < scenario.sharedModules; index += 1) {
    await writeFile(
      resolve(cwd, `src/shared/shared-${index}.tsx`),
      moduleSource('shared', index),
    )
  }

  for (let entryIndex = 0; entryIndex < scenario.entries; entryIndex += 1) {
    await mkdir(resolve(cwd, `src/entry-${entryIndex}`), { recursive: true })

    const entryImports: string[] = []
    const entryCalls: string[] = []
    const dynamicCalls: string[] = []

    for (let moduleIndex = 0; moduleIndex < scenario.modulesPerEntry; moduleIndex += 1) {
      const moduleName = `module-${moduleIndex}`
      await writeFile(
        resolve(cwd, `src/entry-${entryIndex}/${moduleName}.tsx`),
        moduleSource(`entry${entryIndex}`, moduleIndex),
      )
      entryImports.push(`import { icon as icon${moduleIndex} } from './entry-${entryIndex}/${moduleName}'`)
      entryCalls.push(`icon${moduleIndex}`)
    }

    for (
      let dynamicIndex = 0;
      dynamicIndex < (scenario.dynamicModulesPerEntry || 0);
      dynamicIndex += 1
    ) {
      const moduleName = `lazy-${dynamicIndex}`
      await writeFile(
        resolve(cwd, `src/entry-${entryIndex}/${moduleName}.tsx`),
        moduleSource(`entry${entryIndex}Lazy`, dynamicIndex),
      )
      dynamicCalls.push(`import('./entry-${entryIndex}/${moduleName}').then((module) => module.icon)`)
    }

    for (let sharedIndex = 0; sharedIndex < scenario.sharedModules; sharedIndex += 1) {
      entryImports.push(`import { icon as shared${sharedIndex} } from './shared/shared-${sharedIndex}'`)
      entryCalls.push(`shared${sharedIndex}`)
    }

    await writeFile(
      resolve(cwd, `src/entry-${entryIndex}.tsx`),
      `${entryImports.join('\n')}\n\nexport const icons = [${[...entryCalls, ...dynamicCalls].join(', ')}]\n`,
    )
  }

  await writeFile(
    resolve(cwd, 'package.json'),
    '{"type":"module","private":true}\n',
  )
}

function moduleSource(group: string, index: number) {
  return `export const icon = '${iconFor(group, index)}'\n`
}

function iconFor(group: string, index: number) {
  return index % 2 === 0
    ? `mdi-light:${group}-${index}`
    : `line-md:${group}-${index}`
}
