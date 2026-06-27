#!/usr/bin/env node
import { spawn } from 'node:child_process'
import net from 'node:net'
import process from 'node:process'

const targets = [
  {
    name: 'site',
    cwd: 'apps/site',
    preferredPort: 3000,
    command: (port) => ['pnpm', ['exec', 'next', 'dev', '-p', String(port)]],
    path: '/',
  },
  {
    name: 'next-app-router',
    cwd: 'examples/next-app-router',
    preferredPort: 3001,
    command: (port) => ['pnpm', ['exec', 'next', 'dev', '-p', String(port)]],
    path: '/',
  },
  {
    name: 'next-pages-router',
    cwd: 'examples/next-pages-router',
    preferredPort: 3002,
    command: (port) => ['pnpm', ['exec', 'next', 'dev', '-p', String(port)]],
    path: '/',
  },
  {
    name: 'react-router-vite',
    cwd: 'examples/react-router-vite',
    preferredPort: 5173,
    command: (port) => ['pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', String(port)]],
    path: '/',
  },
]

const children = []

for (const target of targets) {
  const port = await findPort(target.preferredPort)
  const [cmd, args] = target.command(port)
  const child = spawn(cmd, args, {
    cwd: new URL(`../../${target.cwd}`, import.meta.url),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => {
    process.stdout.write(prefix(target.name, chunk))
  })
  child.stderr.on('data', (chunk) => {
    process.stderr.write(prefix(target.name, chunk))
  })
  children.push(child)

  console.log(`${target.name}: http://127.0.0.1:${port}${target.path}`)
}

process.on('SIGINT', () => {
  children.forEach((child) => child.kill('SIGINT'))
  process.exit(130)
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
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port, '127.0.0.1')
  })
}
