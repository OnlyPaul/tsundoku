import type { Token } from './types'

export interface Sentence {
  id: string
  tokens: Token[]
}

export interface NormalizedParagraph {
  id: string
  sentences: Sentence[]
  grammar?: string[]
}

export type ChapterFormat = 'v1' | 'v2'

export interface ChapterContent {
  format: ChapterFormat
  paragraphs: NormalizedParagraph[]
}

interface LegacyParagraphRow {
  id: string
  tokens: Token[]
  grammar?: string[]
}

interface MigratedSentenceRow {
  id: string
  tokens: Token[]
}

interface MigratedParagraphRow {
  id: string
  sentences: MigratedSentenceRow[]
  grammar?: string[]
}

interface FormatHeader {
  format: string
}

function isFormatHeader(row: unknown): row is FormatHeader {
  return typeof row === 'object' && row !== null && 'format' in row
}

function parseJsonl(text: string): unknown[] {
  const out: unknown[] = []
  let start = 0
  let rowIndex = 0
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      const line = text.slice(start, i).trim()
      if (line) {
        out.push(parseRow(line, rowIndex))
        rowIndex++
      }
      start = i + 1
    }
  }
  const tail = text.slice(start).trim()
  if (tail) out.push(parseRow(tail, rowIndex))
  return out
}

function parseRow(line: string, rowIndex: number): unknown {
  try {
    return JSON.parse(line)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to parse chapter row ${rowIndex}: ${msg}`)
  }
}

export function decodeChapter(text: string): ChapterContent {
  const rows = parseJsonl(text)
  if (rows.length > 0 && isFormatHeader(rows[0])) {
    const header = rows[0]
    if (header.format === 'v2') {
      return decodeMigrated(rows.slice(1))
    }
    throw new Error(`Unsupported chapter format: ${header.format}`)
  }
  for (const row of rows) {
    if (looksLikeMigratedParagraph(row)) {
      throw new Error(
        'Chapter content has migrated-shape rows but no explicit format header. Add `{"format":"v2"}` as the first line.',
      )
    }
  }
  return decodeLegacy(rows as LegacyParagraphRow[])
}

function looksLikeMigratedParagraph(row: unknown): boolean {
  return typeof row === 'object' && row !== null && 'sentences' in row
}

function decodeMigrated(rows: unknown[]): ChapterContent {
  const seenParagraphs = new Set<string>()
  const seen = new Set<string>()
  const paragraphs: NormalizedParagraph[] = rows.map((raw) => {
    if (typeof raw !== 'object' || raw === null || !('id' in raw)) {
      throw new Error('Migrated paragraph is missing id')
    }
    if (!('sentences' in raw) || !Array.isArray((raw as MigratedParagraphRow).sentences)) {
      throw new Error('Migrated paragraph is missing sentences array')
    }
    const row = raw as MigratedParagraphRow
    if (seenParagraphs.has(row.id)) {
      throw new Error(`Duplicate paragraph id in migrated chapter: ${row.id}`)
    }
    seenParagraphs.add(row.id)
    const sentences: Sentence[] = row.sentences.map((s) => {
      if (typeof s !== 'object' || s === null || typeof (s as Sentence).id !== 'string') {
        throw new Error('Migrated sentence is missing id')
      }
      if (!Array.isArray((s as Sentence).tokens)) {
        throw new Error('Migrated sentence is missing tokens')
      }
      if (seen.has(s.id)) {
        throw new Error(`Duplicate sentence id in migrated chapter: ${s.id}`)
      }
      seen.add(s.id)
      return { id: s.id, tokens: s.tokens }
    })
    return {
      id: row.id,
      sentences,
      ...(row.grammar ? { grammar: row.grammar } : {}),
    }
  })
  return { format: 'v2', paragraphs }
}

function decodeLegacy(rows: LegacyParagraphRow[]): ChapterContent {
  const paragraphs: NormalizedParagraph[] = rows.map((row) => ({
    id: row.id,
    sentences: [{ id: `${row.id}-s00`, tokens: row.tokens }],
    ...(row.grammar ? { grammar: row.grammar } : {}),
  }))
  return { format: 'v1', paragraphs }
}
