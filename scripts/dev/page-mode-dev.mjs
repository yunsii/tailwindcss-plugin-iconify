#!/usr/bin/env node
import { spawn } from 'node:child_process'
import net from 'node:net'
import process from 'node:process'

const root = new URL('../../', import.meta.url)
const targets = [
  {
    name: 'next-app-router-page-dev',
    cwd: 'examples/next-app-router',
    preferredPort: 4401,
    serve: (port) => ['pnpm', ['exec', 'next', 'dev', '-H', '127.0.0.1', '-p', String(port)]],
  },
  {
    name: 'next-pages-router-page-dev',
    cwd: 'examples/next-pages-router',
    preferredPort: 4402,
    serve: (port) => ['pnpm', ['exec', 'next', 'dev', '-H', '127.0.0.1', '-p', String(port)]],
  },
  {
    name: 'react-router-vite-page-dev',
    cwd: 'examples/react-router-vite',
    preferredPort: 4473,
    serve: (port) => ['pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', String(port), '--strictPort']],
  },
]

const children = []

for (const target of targets) {
  const cwd = new URL(`${target.cwd}/`, root)
  const port = await findPort(target.preferredPort)
  const [command, args] = target.serve(port)
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => {
    process.stdout.write(prefix(target.name, chunk))
  })
  child.stderr.on('data', (chunk) => {
    process.stderr.write(prefix(target.name, chunk))
  })
  child.on('exit', (code, signal) => {
    if (code && code !== 130) {
      process.stderr.write(`[${target.name}] exited with code ${code}, signal ${signal}\n`)
    }
  })
  children.push(child)

  console.log(`${target.name}: http://127.0.0.1:${port}/`)
  console.log(`${target.name} dashboard: http://127.0.0.1:${port}/dashboard`)
}

process.on('SIGINT', () => {
  children.forEach((child) => child.kill('SIGINT'))
  process.exit(130)
})

await new Promise((resolvePromise) => {
  process.on('SIGTERM', resolvePromise)
})

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
