// Local source preparation only. Does not link, upload, deploy or read credentials.
import { createHash } from 'node:crypto'
import { copyFile, lstat, mkdir, mkdtemp, readdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'))
const exact = [
  'index.html', 'package.json', 'package-lock.json', 'vite.config.js', 'vercel.json',
  '.vercelignore', '.gitignore', '.oxlintrc.json', '.python-version', 'requirements.txt', 'api/index.py',
  'src/main.jsx', 'src/App.jsx', 'src/App.css', 'src/index.css',
  'src/backend/requirements.txt', 'src/backend/requirements-tested.lock',
]
const trees = [
  ['src/Component', ['.jsx', '.css']], ['src/lib', ['.js']],
  ['src/data', ['.js', '.json']], ['src/assets', ['.png', '.webp', '.jpg', '.jpeg', '.svg']],
  ['public', ['.svg', '.png', '.webp', '.jpg', '.ico', '.woff2', '.txt', '.xml']],
  ['src/backend/migrations', ['.sql']],
]
const files = [...exact]
async function collect(folder, extensions, recursive = true) {
  for (const item of await readdir(join(root, folder), { withFileTypes: true })) {
    if (item.isSymbolicLink()) throw new Error('Hosting preparation refuses symbolic links.')
    if (item.name.startsWith('.')) continue
    const path = `${folder}/${item.name}`
    if (item.isDirectory() && recursive) await collect(path, extensions)
    else if (item.isFile() && extensions.includes(extname(item.name))) files.push(path)
  }
}
for (const [folder, extensions] of trees) await collect(folder, extensions)
await collect('src/backend', ['.py'], false)
const destination = await mkdtemp(join(tmpdir(), 'astro-hosting-source.'))
const manifest = []
for (const file of [...new Set(files)].sort()) {
  const source = join(root, file)
  if (await realpath(source) !== source) throw new Error('Hosting preparation refuses indirect source paths.')
  if (!(await lstat(source)).isFile()) throw new Error(`Not a regular source file: ${file}`)
  const content = await readFile(source)
  // Reject known credential/database artifacts by name; this is not a full secret scan.
  if (/(?:^|\/)(?:\.env|service_account|local_bookings|local_queries|calendar_config|sheets_config)/.test(file)) {
    throw new Error('Private configuration cannot enter the hosting package.')
  }
  const target = join(destination, file)
  await mkdir(dirname(target), { recursive: true })
  await copyFile(source, target)
  manifest.push({ path: relative(root, source), bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') })
}
// Retain the manifest beside, not inside, the deployable directory.
await writeFile(`${destination}.manifest.json`, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ destination, manifest: `${destination}.manifest.json`, files: manifest.length,
  bytes: manifest.reduce((sum, file) => sum + file.bytes, 0), deployed: false }))
