#!/usr/bin/env node
import { spawn } from 'node:child_process'
import net from 'node:net'
import { resolve } from 'node:path'
import process from 'node:process'

const root = new URL('../../', import.meta.url)
const pageModeEnv = {
  ...process.env,
  ICONCAT_MODE: 'page',
  ICONCAT_MANIFEST: '.iconcat/page-mode/manifest.json',
  ICONCAT_SOURCE_DIR: '.iconcat/page-mode',
}
const targets = [
  {
    name: 'next-app-router-page',
    cwd: 'examples/next-app-router',
    preferredPort: 4301,
    build: [
      ['pnpm', ['run', 'extract']],
      ['pnpm', ['exec', 'next', 'build']],
      ['pnpm', ['run', 'install-iconcat-css']],
    ],
    serve: (port) => ['pnpm', ['exec', 'next', 'start', '-H', '127.0.0.1', '-p', String(port)]],
    env: pageModeEnv,
  },
  {
    name: 'next-pages-router-page',
    cwd: 'examples/next-pages-router',
    preferredPort: 4302,
    build: [
      ['pnpm', ['run', 'extract']],
      ['pnpm', ['exec', 'next', 'build']],
      ['pnpm', ['run', 'install-iconcat-css']],
    ],
    serve: (port) => ['pnpm', ['exec', 'next', 'start', '-H', '127.0.0.1', '-p', String(port)]],
    env: pageModeEnv,
  },
  {
    name: 'react-router-vite-page',
    cwd: 'examples/react-router-vite',
    preferredPort: 4373,
    build: [
      ['pnpm', ['exec', 'vite', 'build']],
    ],
    serve: (port) => ['pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort']],
    env: pageModeEnv,
  },
]

const children = []

for (const target of targets) {
  const cwd = new URL(`${target.cwd}/`, root)
  console.log(`[${target.name}] building page-mode preview`)

  for (const [command, args] of target.build) {
    await run(command, args, cwd, target.env, target.name)
  }

  const port = await findPort(target.preferredPort)
  const [command, args] = target.serve(port)
  const child = spawn(command, args, {
    cwd,
    env: target.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => {
    process.stdout.write(prefix(target.name, chunk))
  })
  child.stderr.on('data', (chunk) => {
    process.stderr.write(prefix(target.name, chunk))
  })
  children.push(child)

  console.log(`${target.name}: http://127.0.0.1:${port}/`)
  if (target.name.startsWith('next-')) {
    console.log(`${target.name} dashboard: http://127.0.0.1:${port}/dashboard`)
  }
}

process.on('SIGINT', () => {
  children.forEach((child) => child.kill('SIGINT'))
  process.exit(130)
})

await new Promise((resolvePromise) => {
  process.on('SIGTERM', resolvePromise)
})

function run(command, args, cwd, env, name) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    child.stdout.on('data', (chunk) => {
      process.stdout.write(prefix(name, chunk))
    })
    child.stderr.on('data', (chunk) => {
      process.stderr.write(prefix(name, chunk))
    })
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} failed in ${resolve(cwd.pathname)}: code ${code}, signal ${signal}`))
    })
  })
}

function prefix(name, chunk) {
  return chunk
    .toString()
    .split('\n')
    .filter(Boolean)
    .map((line) => `[${name}] ${line}`)
    .join('\n')
    .concat('\n')
}

async function findPort(start) {
  for (let port = start; port < start + 100; port += 1) {
    if (await isFree(port)) {
      return port
    }
  }
  throw new Error(`No free port found from ${start}`)
}

function isFree(port) {
  return new Promise((resolvePromise) => {
    const server = net.createServer()
    server.once('error', () => resolvePromise(false))
    server.once('listening', () => {
      server.close(() => resolvePromise(true))
    })
    server.listen(port, '127.0.0.1')
  })
}
