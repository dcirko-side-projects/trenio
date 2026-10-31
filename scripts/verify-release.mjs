import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const origin = new URL(process.argv[2] ?? 'https://trenio.pages.dev/')
if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') {
  throw new Error('Use an HTTPS site origin without credentials, a path, or query parameters.')
}

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? files(path) : [path]
  }))
  return nested.flat()
}

const paths = await files('dist')
if (!paths.some(path => relative('dist', path) === 'index.html')) throw new Error('Build the app before checking the release.')
for (const path of paths) {
  const name = relative('dist', path).replaceAll('\\', '/')
  const response = await fetch(new URL(name, origin), { signal: AbortSignal.timeout(20_000), cache: 'no-store' })
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${name}`)
  const published = Buffer.from(await response.arrayBuffer())
  if (!published.equals(await readFile(path))) throw new Error(`Published content differs from the local build: ${name}`)
  console.log(`PASS HTTPS and content: ${name}`)
}
console.log(`Verified ${paths.length} published files.`)
