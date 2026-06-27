import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

export function getIconcatCSSHref() {
  const manifestFile = resolve(process.cwd(), '.iconcat/manifest.json')
  if (!existsSync(manifestFile)) {
    return
  }

  return JSON.parse(readFileSync(manifestFile, 'utf8')).href as string
}
