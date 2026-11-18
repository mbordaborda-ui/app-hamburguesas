import { existsSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const targets = ['dist', 'node_modules/.vite', 'node_modules/.tmp', '.vite']

for (const target of targets) {
  const full = resolve(root, target)
  if (!existsSync(full)) continue
  rmSync(full, { recursive: true, force: true })
  console.log(`removed ${target}`)
}

console.log('\nListo. Ahora: npm run dev')
