import { cp, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = resolve(rootDir, 'books')
const targetDir = resolve(rootDir, 'public', 'books')

await rm(targetDir, { force: true, recursive: true })
await cp(sourceDir, targetDir, { recursive: true })
