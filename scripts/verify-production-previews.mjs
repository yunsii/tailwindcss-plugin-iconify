import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const apps = [
  {
    name: 'next-app-router',
    cwd: 'examples/next-app-router',
    command: ['pnpm', 'exec', 'next', 'start', '-H', '127.0.0.1', '-p', '0'],
    routes: ['/', '/dashboard', '/settings'],
    manifest: '.iconcat/manifest.json',
    cssDir: '.next/static/css',
  },
  {
    name: 'next-pages-router',
    cwd: 'examples/next-pages-router',
    command: ['pnpm', 'exec', 'next', 'start', '-H', '127.0.0.1', '-p', '0'],
    routes: ['/', '/dashboard', '/settings'],
    manifest: '.iconcat/manifest.json',
    cssDir: '.next/static/css',
  },
  {
    name: 'react-router-vite',
    cwd: 'examples/react-router-vite',
    command: ['pnpm', 'exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', '0'],
    routes: ['/', '/dashboard'],
    manifest: '.iconcat/manifest.json',
    cssDir: 'dist/assets',
  },
]

if (isDirectRun()) {
  await runCLI()
}

export async function collectProductionPreviewSnapshots(options = {}) {
  const root = options.root || process.cwd()
  const servers = []
  const actual = {}

  try {
    for (const app of apps) {
      const server = await startServer(app, root)
      servers.push(server)
      actual[app.name] = await collectSnapshot(app, server.url, root)
    }

    return actual
  } finally {
    await Promise.all(servers.map((server) => server.stop()))
  }
}

async function runCLI() {
  const root = process.cwd()
  const update = process.argv.includes('--update')
  const snapshotFile = resolve(root, 'scripts/production-preview.snapshots.json')
  const actual = await collectProductionPreviewSnapshots({ root })

  if (update) {
    await writeFile(snapshotFile, `${JSON.stringify(actual, null, 2)}\n`)
    console.log(`Updated ${snapshotFile}`)
    return
  }

  const expected = JSON.parse(await readFile(snapshotFile, 'utf8'))

  try {
    assert.deepEqual(actual, expected)
  } catch (error) {
    const actualFile = resolve(root, 'scripts/production-preview.actual.json')
    await writeFile(actualFile, `${JSON.stringify(actual, null, 2)}\n`)
    console.error(`Production preview snapshot mismatch. Actual snapshot written to ${actualFile}`)
    throw error
  }
}

async function startServer(app, root) {
  const [command, ...args] = app.command
  const child = spawn(command, args, {
    cwd: resolve(root, app.cwd),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  let settled = false

  const url = await new Promise((resolvePromise, reject) => {
    const timeout = setTimeout(() => {
      if (settled) {
        return
      }
      settled = true
      reject(new Error(`Timed out while starting ${app.name}.\n${output}`))
    }, 15000)

    const onData = (chunk) => {
      output += chunk.toString()
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/)
      if (!match || settled) {
        return
      }

      settled = true
      clearTimeout(timeout)
      resolvePromise(`http://127.0.0.1:${match[1]}`)
    }

    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('error', (error) => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timeout)
      reject(error)
    })
    child.on('exit', (code, signal) => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timeout)
      reject(new Error(`${app.name} exited before ready: code ${code}, signal ${signal}.\n${output}`))
    })
  })

  return {
    url,
    stop: () => stopServer(child),
  }
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return
  }

  await new Promise((resolvePromise) => {
    child.once('exit', resolvePromise)
    child.kill('SIGINT')
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGTERM')
      }
    }, 1000)
  })
}

async function collectSnapshot(app, baseUrl, root) {
  const manifest = await readManifest(app, root)

  return {
    routes: Object.fromEntries(await Promise.all(app.routes.map(async (route) => {
      const response = await fetch(`${baseUrl}${route}`)
      const html = await response.text()

      return [
        route,
        {
          status: response.status,
          iconcatLinks: extractIconcatLinks(html),
          hasConfigurableIconsCopy: html.includes('configurable icons'),
        },
      ]
    }))),
    manifest: summarizeManifest(manifest),
    cssSelectors: await collectCSSSelectors(app, manifest, root),
  }
}

async function readManifest(app, root) {
  return JSON.parse(await readFile(resolve(root, app.cwd, app.manifest), 'utf8'))
}

function summarizeManifest(manifest) {
  return {
    mode: manifest.mode || 'catalog',
    files: summarizeManifestFiles(manifest),
    entries: Object.fromEntries(
      Object.entries(manifest.entries || {})
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([entry, value]) => [
          entry,
          omitUndefined({
            file: value.file,
            href: value.href,
            icons: value.icons,
            priority: value.priority || undefined,
          }),
        ]),
    ),
    icons: manifest.icons,
  }
}

function summarizeManifestFiles(manifest) {
  if (!manifest.files) {
    return {}
  }

  const entries = manifest.mode === 'global'
    ? [
        ['priority', manifest.files.priority],
        ['normal', manifest.files.normal],
      ].filter(([, file]) => !!file)
    : Object.entries(manifest.files)
        .sort(([left], [right]) => left.localeCompare(right))

  return Object.fromEntries(
    entries.map(([key, file]) => [
      key,
      {
        file: file.file,
        href: file.href,
        icons: file.icons,
      },
    ]),
  )
}

async function collectCSSSelectors(app, manifest, root) {
  const files = Object.values(summarizeManifestFiles(manifest))
    .map((file) => file.file)
  const selectors = {}

  for (const file of files) {
    const css = await readFile(resolve(root, app.cwd, app.cssDir, basename(file)), 'utf8')
    selectors[basename(file)] = [
      ...new Set(css.split('icon-\\[')
        .slice(1)
        .map((part) => part.split('\\]')[0])
        .filter((value) => value.includes('--'))
        .sort()),
    ]
  }

  return selectors
}

function extractIconcatLinks(html) {
  return html.split('<link')
    .slice(1)
    .map((part) => `<link${part.split('>')[0]}>`)
    .filter((tag) => getAttribute(tag, 'href')?.includes('iconcat.'))
    .map((tag) => omitUndefined({
      href: getAttribute(tag, 'href'),
      rel: getAttribute(tag, 'rel'),
      as: getAttribute(tag, 'as'),
      precedence: getAttribute(tag, 'data-precedence'),
      nextHead: getAttribute(tag, 'data-next-head'),
    }))
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=(["'])(.*?)\\1`))
  if (!match) {
    return undefined
  }
  return match[2]
}

function isDirectRun() {
  return process.argv[1] === fileURLToPath(import.meta.url)
}

function omitUndefined(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  )
}
