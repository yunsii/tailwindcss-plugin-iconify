import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'tsdown/config'

export function defineIconcatPackageConfig(options) {
  return defineConfig({
    cwd: options.dirname,
    entry: options.entries,
    format: options.formats || ['esm', 'cjs'],
    outDir: 'dist',
    clean: true,
    platform: options.platform || 'node',
    alias: options.alias,
    define: options.define,
    deps: {
      neverBundle: createExternal(options.dirname, options.external),
    },
    dts: {
      tsconfig: 'tsconfig.build.json',
    },
    exports: false,
    minify: false,
    outputOptions: {
      dynamicImportInCjs: true,
    },
    report: false,
    root: 'src',
    unbundle: true,
  })
}

export function packageDir(importMetaUrl) {
  return fileURLToPath(new URL('.', importMetaUrl))
}

function createExternal(dirname, explicitExternal = []) {
  const packageJson = JSON.parse(
    readFileSync(path.resolve(dirname, 'package.json'), 'utf8'),
  )
  const packageNames = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {}),
  ]
  const packagePatterns = packageNames.map(
    (packageName) => new RegExp(`^${escapeRegExp(packageName)}(/.*)?$`),
  )
  const patterns = [...explicitExternal, ...packagePatterns, /^node:.*$/]

  return (id) => {
    return patterns.some((pattern) => {
      return typeof pattern === 'string' ? id === pattern : pattern.test(id)
    })
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}
