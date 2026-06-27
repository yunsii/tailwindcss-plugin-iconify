import { copyFile, mkdir, rename } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'

const cwd = process.cwd()
const manifestFile = resolve(cwd, '.iconcat/manifest.json')
const manifest = await importJson(manifestFile)
const source = resolve(cwd, '.iconcat', manifest.file)
const target = resolve(cwd, '.next/static/css', basename(manifest.file))

await mkdir(dirname(target), { recursive: true })
const tempTarget = `${target}.${process.pid}.${Date.now()}.tmp`
await copyFile(source, tempTarget)
await rename(tempTarget, target)

async function importJson(file) {
  const { readFile } = await import('node:fs/promises')
  return JSON.parse(await readFile(file, 'utf8'))
}
