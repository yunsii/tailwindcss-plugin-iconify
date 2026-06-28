#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import process from 'node:process'

import {
  createEsbuildBundler,
  writeIconCatalog,
} from '@iconcat/extractor'
import { createJiti } from 'jiti'
import { resolve } from 'pathe'

import type { IconcatConfig } from '@iconcat/extractor'

const args = process.argv.slice(2)
const command = args[0] && !args[0].startsWith('-') ? args[0] : 'extract'
const commandArgs = args[0] === command ? args.slice(1) : args
const logger = {
  error(message: string) {
    process.stderr.write(`${message}\n`)
  },
  info(message = '') {
    process.stdout.write(`${message}\n`)
  },
}

if (command === 'init') {
  await init()
} else if (command === 'extract') {
  await extract()
} else if (command === 'watch') {
  logger.error('iconcat watch is not implemented yet.')
  process.exit(1)
} else {
  logger.error(`Unknown iconcat command: ${command}`)
  process.exit(1)
}

async function init() {
  const configFile = resolve(process.cwd(), 'iconcat.config.ts')
  if (existsSync(configFile)) {
    logger.info('iconcat.config.ts already exists.')
    return
  }

  await writeFile(
    configFile,
    `import { defineIconcatConfig } from 'iconcat'\n\nexport default defineIconcatConfig({\n  entries: ['src/**/*.{js,jsx,ts,tsx,mdx}'],\n})\n`,
  )
  logger.info('Created iconcat.config.ts')
}

async function extract() {
  logger.info('Iconcat v0.1.0')
  logger.info()
  logger.info('Bundling entries...')
  const config = await loadConfig(commandArgs)
  const result = await writeIconCatalog({
    ...config,
    bundler: config.bundler || createEsbuildBundler(),
  })

  logger.info(`  entries: ${result.entries.length}`)
  logger.info(`  modules: ${result.modules.length}`)
  logger.info()
  logger.info('Extracting icons...')
  const iconCount = Object.values(result.catalog.icons).reduce(
    (sum, names) => sum + names.length,
    0,
  )
  logger.info(`  icons: ${iconCount}`)
  logger.info(`  warnings: ${result.diagnostics.filter((item) => item.severity === 'warning').length}`)
  logger.info()
  logger.info('Writing catalog...')
  logger.info(`  ${result.output}`)
}

async function loadConfig(args: string[]): Promise<IconcatConfig> {
  const configPath = readOption(args, '--config') || process.env.ICONCAT_CONFIG || 'iconcat.config.ts'
  const configFile = resolve(process.cwd(), configPath)
  if (!existsSync(configFile)) {
    return {}
  }

  const jiti = createJiti(import.meta.url)
  const mod = await jiti.import<{ default?: IconcatConfig }>(configFile)
  return mod.default || (mod as IconcatConfig)
}

function readOption(args: string[], name: string) {
  const equalsPrefix = `${name}=`
  const equalsArg = args.find((arg) => arg.startsWith(equalsPrefix))

  if (equalsArg) {
    return equalsArg.slice(equalsPrefix.length)
  }

  const index = args.indexOf(name)

  return index === -1 ? undefined : args[index + 1]
}
