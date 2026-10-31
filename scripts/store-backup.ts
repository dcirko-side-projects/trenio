import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { parseBackup } from '../src/backup.ts'

const source = process.argv[2]
if (!source) throw new Error('Usage: npm run backup:store -- PATH_TO_BACKUP.json')
const consumer = process.env.OneDriveConsumer
if (!consumer) throw new Error('Private OneDrive is not configured. OneDriveCommercial is never used as a fallback.')
const root = await realpath(consumer)
if (process.env.OneDriveCommercial && root.toLowerCase() === resolve(process.env.OneDriveCommercial).toLowerCase()) {
  throw new Error('Private and institutional OneDrive paths must differ.')
}

const original = await readFile(resolve(source))
const backup = parseBackup(original.toString('utf8'))
const parts = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
}).formatToParts(new Date(backup.exportedAt))
const part = (type: string) => parts.find(item => item.type === type)!.value
const name = `trenio-${part('year')}-${part('month')}-${part('day')}-${part('hour')}${part('minute')}${part('second')}.json`
const directory = join(root, 'Trenio', 'Sigurnosne kopije')
await mkdir(directory, { recursive: true })
const destination = join(directory, name)
try {
  await writeFile(destination, original, { flag: 'wx' })
} catch (error) {
  if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error
  if (!original.equals(await readFile(destination))) throw new Error('A different backup already uses this filename. No file was overwritten.', { cause: error })
}
const stored = await readFile(destination)
if (!original.equals(stored)) throw new Error('The stored copy differs from the source. Verify the destination file.')
parseBackup(stored.toString('utf8'))
console.log(`Validated and stored in private OneDrive: ${destination}`)
console.log(`Exported at: ${backup.exportedAt}. This confirms the local copy, not completed cloud synchronization.`)
