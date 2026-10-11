// Downloads the curated Fluent Emoji 3D (Microsoft, MIT) and converts them to 96 px WebP in
// public/emoji/<key>.webp, plus the logo in public/brand/. Needs ImageMagick (`convert`).
// Run it after changing CATEGORY_EMOJIS in packages/core: `pnpm --filter @chanchito/web emojis`.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CATEGORY_EMOJIS } from '@chanchito/core'

const BASE = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets'
// Fluent's folder and file names when they don't follow the key ("t_shirt" → "T-shirt").
const SOURCE = { t_shirt: { folder: 'T-shirt', file: 't-shirt' } }

const publicDir = new URL('../public/', import.meta.url).pathname
const tmp = mkdtempSync(join(tmpdir(), 'chanchito-emoji-'))

async function fetchEmoji(key, out, size) {
  const name = key.replaceAll('_', ' ')
  const { folder, file } = SOURCE[key] ?? {
    folder: name[0].toUpperCase() + name.slice(1),
    file: key,
  }
  const url = `${BASE}/${encodeURIComponent(folder)}/3D/${file}_3d.png`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${key}: ${response.status} ${url}`)
  const png = join(tmp, `${key}.png`)
  writeFileSync(png, Buffer.from(await response.arrayBuffer()))
  execFileSync('convert', [png, '-resize', `${size}x${size}`, '-quality', '90', out])
}

try {
  mkdirSync(join(publicDir, 'emoji'), { recursive: true })
  mkdirSync(join(publicDir, 'brand'), { recursive: true })
  for (const { key } of CATEGORY_EMOJIS) {
    await fetchEmoji(key, join(publicDir, 'emoji', `${key}.webp`), 96)
  }
  await fetchEmoji('pig_face', join(publicDir, 'brand', 'chanchito.webp'), 128)
  console.log(`${CATEGORY_EMOJIS.length} emojis y el logo listos.`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
