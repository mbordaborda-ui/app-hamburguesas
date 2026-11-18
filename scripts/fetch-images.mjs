/**
 * Descarga las fotos de Unsplash a `public/img/` para que la app no dependa
 * de un CDN externo (que limita ráfagas y hacía desaparecer imágenes).
 *
 * Uso:  node scripts/fetch-images.mjs
 * Es idempotente: si el archivo ya existe, no lo vuelve a descargar.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'public/img')
mkdirSync(out, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* --- Recolecta todos los IDs usados en los datos --- */
const sources = ['src/data/catalog.ts', 'src/data/marketing.ts']
const ids = new Set()
for (const file of sources) {
  const text = readFileSync(resolve(root, file), 'utf8')
  for (const match of text.matchAll(/photo-[0-9a-f]+-[0-9a-f]+/g)) ids.add(match[0])
}

async function download(id, name, w, q) {
  const dest = resolve(out, name)
  if (existsSync(dest)) {
    console.log(`skip  ${name}`)
    return true
  }
  const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 2000) throw new Error('archivo muy pequeño')
      writeFileSync(dest, buf)
      console.log(`OK    ${name}  ${Math.round(buf.length / 1024)}KB`)
      return true
    } catch (error) {
      console.log(`      reintento ${attempt} de ${name}: ${error.message}`)
      await sleep(1500 * attempt)
    }
  }
  console.log(`FALLO ${name}`)
  return false
}

let ok = 0
let fail = 0

for (const id of ids) {
  const done = await download(id, `${id}.jpg`, 800, 75)
  done ? ok++ : fail++
  await sleep(350)
}

// Versión en alta para el hero
const hero = await download('photo-1568901346375-23c9450c58cd', 'hero-burger.jpg', 1400, 80)
hero ? ok++ : fail++

console.log(`\nResultado: ${ok} descargadas, ${fail} fallidas`)
if (fail > 0) {
  console.log('Vuelve a correr el script: reintenta solo las que faltan.')
}
