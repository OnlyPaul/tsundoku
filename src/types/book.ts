export interface Token {
  s: string;
  r?: string;
  v?: string;
  lemma?: string;
}

export interface Paragraph {
  id: string;
  tokens: Token[];
  grammar?: string[];
}

export type JLPT = "N5" | "N4" | "N3" | "N2" | "N1";

export interface ParagraphRef {
  chapter: string;
  paragraph: string;
}

export interface VocabEntry {
  id: string;
  lemma: string;
  reading: string;
  pos: string;
  jlpt: JLPT;
  meanings: string[];
  frequency: number;
  first_seen: ParagraphRef;
}

export interface KanjiEntry {
  kanji: string;
  onyomi: string[];
  kunyomi: string[];
  meanings: string[];
  jlpt: JLPT;
  stroke_count: number;
  frequency: number;
  example_words_in_book: string[];
}

export interface GrammarEntry {
  id: string;
  pattern: string;
  title: string;
  jlpt: JLPT;
  formation: string;
  explanation: string;
  examples_in_book: ParagraphRef[];
  see_also: string[];
}

export interface ChapterMeta {
  id: string;
  title: string;
}

export interface BookMetadata {
  id: string;
  title: string;
  author: string;
  cover: string;
  chapters: ChapterMeta[];
}
