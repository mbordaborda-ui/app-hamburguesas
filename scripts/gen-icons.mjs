import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public')
mkdirSync(OUT, { recursive: true })

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]

function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4)
  const s = size / 512
  // Identidad v2: azul eléctrico + crema + naranja + verde ácido
  const RED = hex('#E4002B')
  const BLACK = hex('#0B0B0D')
  const DARK = hex('#0B0B0D')
  const CREAM = hex('#F4F0E8')
  const ORANGE = hex('#FF6A00')
  const YELLOWY = hex('#FFD21F')
  const YELLOW = CREAM
  const WHITE = BLACK

  const inEllipse = (x, y, cx, cy, rx, ry) =>
    ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x / s
      const py = y / s
      let col = RED
      // top bun (dome) — crema
      if (py >= 150 && py <= 258 && inEllipse(px, py, 256, 258, 156, 108)) col = CREAM
      // patty — negro
      if (px >= 104 && px <= 408 && py >= 268 && py <= 308) col = DARK
      // lettuce — verde ácido
      if (px >= 100 && px <= 412 && py >= 312 && py <= 330) col = YELLOWY
      // bottom bun — naranja
      if (px >= 108 && px <= 404 && py >= 334 && py <= 388) col = CREAM
      // sesame seeds
      const seeds = [
        [200, 200],
        [256, 186],
        [312, 202],
        [232, 224],
        [288, 226],
      ]
      for (const [sx, sy] of seeds) if (inEllipse(px, py, sx, sy, 9, 5)) col = WHITE
      const i = (y * size + x) * 4
      buf[i] = col[0]
      buf[i + 1] = col[1]
      buf[i + 2] = col[2]
      buf[i + 3] = 255
    }
  }
  return encodePng(size, size, buf)
}

for (const size of [192, 512]) {
  writeFileSync(resolve(OUT, `pwa-${size}x${size}.png`), makeIcon(size))
}
writeFileSync(resolve(OUT, 'apple-touch-icon.png'), makeIcon(180))
writeFileSync(resolve(OUT, 'mask-icon.svg'), maskable())
writeFileSync(resolve(OUT, 'favicon.svg'), favicon())

function maskable() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#E4002B"/><path d="M256 120c86 0 156 48 156 108H100c0-60 70-108 156-108z" fill="#F4F0E8"/><rect x="104" y="268" width="304" height="40" rx="8" fill="#0B0B0D"/><rect x="108" y="334" width="296" height="54" rx="16" fill="#F4F0E8"/></svg>`
}

function favicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#E4002B"/><path d="M256 148c84 0 152 47 152 106H104c0-59 68-106 152-106z" fill="#F4F0E8"/><rect x="100" y="266" width="312" height="34" rx="10" fill="#FFD21F"/><rect x="106" y="312" width="300" height="40" rx="12" fill="#0B0B0D"/><rect x="110" y="364" width="292" height="56" rx="18" fill="#F4F0E8"/></svg>`
}

console.log('icons generated')
