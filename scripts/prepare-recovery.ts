import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseBackup, recoverySql } from '../src/backup.ts'

const source = process.argv[2]
if (!source) throw new Error('Usage: npm run backup:prepare -- PATH_TO_BACKUP.json [--restore-empty]')
const backup = parseBackup(await readFile(resolve(source), 'utf8'))
const restore = process.argv.includes('--restore-empty')
await mkdir('.local', { recursive: true })
const output = resolve('.local', restore ? 'restore-empty.sql' : 'rehearse-recovery.sql')
await writeFile(output, recoverySql(backup, !restore), { encoding: 'utf8', mode: 0o600 })
console.log(`Prepared ${restore ? 'empty-account recovery' : 'temporary-table rehearsal'}: ${output}`)
console.log(`Categories: ${backup.categories.length}; tasks: ${backup.tasks.length}; notes: ${backup.notes.length}. File contents were not logged.`)
