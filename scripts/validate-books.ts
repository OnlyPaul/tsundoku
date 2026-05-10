import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { decodeChapter } from '../src/lib/chapter-decoder'

export interface BookFixture {
  bookId: string
  vocabulary: Map<string, unknown>
  grammar: Map<string, unknown>
  chapters: { chapterId: string; text: string }[]
}

export interface ValidationResult {
  failures: string[]
  warnings: string[]
}

export function validateBooks(books: BookFixture[]): ValidationResult {
  const failures: string[] = []
  const warnings: string[] = []
  for (const book of books) {
    for (const chapter of book.chapters) {
      let decoded
      try {
        decoded = decodeChapter(chapter.text)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        failures.push(`${book.bookId}/${chapter.chapterId}: ${msg}`)
        continue
      }
      if (decoded.format === 'v1') {
        warnings.push(
          `${book.bookId}/${chapter.chapterId}: legacy v1 chapter format is deprecated; migrate to v2`,
        )
        continue
      }
      for (const paragraph of decoded.paragraphs) {
        for (const sentence of paragraph.sentences) {
          if (!sentence.help || !sentence.help.translation.trim()) {
            failures.push(
              `${book.bookId}/${chapter.chapterId}/${sentence.id}: missing translation`,
            )
          }
          if (sentence.help?.grammar) {
            for (const ref of sentence.help.grammar) {
              if (!book.grammar.has(ref)) {
                failures.push(
                  `${book.bookId}/${chapter.chapterId}/${sentence.id}: unresolved grammar id ${ref}`,
                )
              }
            }
          }
          for (const token of sentence.tokens) {
            if (token.v && !book.vocabulary.has(token.v)) {
              failures.push(
                `${book.bookId}/${chapter.chapterId}/${sentence.id}: unresolved vocabulary id ${token.v}`,
              )
            }
          }
        }
      }
    }
  }
  return { failures, warnings }
}

export function loadBooksFromDisk(booksDir: string): BookFixture[] {
  const entries = readdirSync(booksDir).filter((name) =>
    statSync(join(booksDir, name)).isDirectory(),
  )
  return entries.map((bookId) => {
    const root = join(booksDir, bookId)
    const vocabulary = loadJsonl(join(root, 'vocabulary.jsonl'))
    const grammar = loadJsonl(join(root, 'grammar.jsonl'))
    const chaptersDir = join(root, 'chapters')
    const chapterFiles = (() => {
      try {
        return readdirSync(chaptersDir)
          .filter((f) => f.endsWith('.jsonl'))
          .sort()
      } catch {
        return []
      }
    })()
    const chapters = chapterFiles.map((file) => ({
      chapterId: basename(file, '.jsonl'),
      text: readFileSync(join(chaptersDir, file), 'utf8'),
    }))
    return { bookId, vocabulary, grammar, chapters }
  })
}

function loadJsonl(path: string): Map<string, unknown> {
  const map = new Map<string, unknown>()
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    return map
  }
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const row = JSON.parse(trimmed) as { id?: unknown }
    if (typeof row.id === 'string') map.set(row.id, row)
  }
  return map
}

function isMain(): boolean {
  return process.argv[1] === fileURLToPath(import.meta.url)
}

if (isMain()) {
  const booksDir = resolve(process.cwd(), 'books')
  const books = loadBooksFromDisk(booksDir)
  const { failures, warnings } = validateBooks(books)
  for (const w of warnings) console.warn(`warning: ${w}`)
  for (const f of failures) console.error(`error: ${f}`)
  if (failures.length > 0) {
    console.error(`\nvalidate:books failed with ${failures.length} error(s).`)
    process.exit(1)
  }
  console.log(
    `validate:books: ${books.length} book(s) ok` +
      (warnings.length ? ` (${warnings.length} warning(s))` : ''),
  )
}
