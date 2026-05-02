export interface Token {
  s: string
  r?: string
  v?: string
  lemma?: string
}

export interface Paragraph {
  id: string
  tokens: Token[]
  grammar?: string[]
}

export interface VocabEntry {
  id: string
  lemma: string
  reading: string
  pos: string
  jlpt: string | null
  meanings: string[]
  frequency: number
  first_seen: string
}

export interface KanjiEntry {
  kanji: string
  onyomi: string[]
  kunyomi: string[]
  meanings: string[]
  jlpt: string | null
  stroke_count: number
  frequency: number
  example_words_in_book: string[]
}

export interface GrammarEntry {
  id: string
  pattern: string
  title: string
  jlpt: string | null
  formation: string
  explanation: string
  examples_in_book: string[]
  see_also: string[]
}

export interface ChapterMeta {
  id: string
  title: string
}

export interface BookMetadata {
  id: string
  title: string
  author: string
  cover: string
  chapters: ChapterMeta[]
}
