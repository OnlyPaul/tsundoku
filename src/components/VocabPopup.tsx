import type { KanjiEntry, Token, VocabEntry } from '@/lib/types'
import { useState } from 'react'

interface VocabPopupProps {
  token: Token
  entry: VocabEntry | undefined
  kanjiMap?: Map<string, KanjiEntry> | null
  onOpenKanjiTab?: () => void
}

const KANJI_RE = /[㐀-䶿一-鿿]/

export function extractKanji(text: string): string[] {
  const out: string[] = []
  for (const ch of text) {
    if (KANJI_RE.test(ch)) out.push(ch)
  }
  return out
}

export function VocabPopup({ token, entry, kanjiMap, onOpenKanjiTab }: VocabPopupProps) {
  const [tab, setTab] = useState<'meanings' | 'kanji'>('meanings')
  if (!token.v || !entry) return null
  const headWord = token.lemma ?? token.s
  const kanjiChars = extractKanji(headWord)
  const hasKanji = kanjiChars.length > 0

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-jp text-lg font-semibold">{headWord}</h3>
        {entry.jlpt ? (
          <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {entry.jlpt}
          </span>
        ) : null}
      </div>
      {hasKanji ? (
        <div role="tablist" className="flex gap-2 border-b border-border">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'meanings'}
            onClick={() => setTab('meanings')}
            className={`px-2 py-1 text-xs ${tab === 'meanings' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          >
            Meanings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'kanji'}
            onClick={() => {
              setTab('kanji')
              onOpenKanjiTab?.()
            }}
            className={`px-2 py-1 text-xs ${tab === 'kanji' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          >
            Kanji
          </button>
        </div>
      ) : null}
      {tab === 'meanings' ? (
        <>
          <div className="font-jp text-muted-foreground">{entry.reading}</div>
          <div className="text-xs italic text-muted-foreground">{entry.pos}</div>
          <ul className="list-disc pl-5">
            {entry.meanings.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </>
      ) : (
        <KanjiTab chars={kanjiChars} kanjiMap={kanjiMap} />
      )}
    </div>
  )
}

function KanjiTab({
  chars,
  kanjiMap,
}: {
  chars: string[]
  kanjiMap: Map<string, KanjiEntry> | null | undefined
}) {
  return (
    <div className="flex flex-col gap-3">
      {chars.map((ch) => {
        const entry = kanjiMap?.get(ch)
        return <KanjiCard key={ch} char={ch} entry={entry} />
      })}
    </div>
  )
}

function KanjiCard({ char, entry }: { char: string; entry: KanjiEntry | undefined }) {
  return (
    <article className="rounded border border-border p-2" data-testid={`kanji-card-${char}`}>
      <header className="flex items-baseline gap-2">
        <span className="font-jp text-2xl font-semibold">{char}</span>
        {entry?.jlpt ? (
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {entry.jlpt}
          </span>
        ) : null}
      </header>
      {entry ? (
        <dl className="mt-2 space-y-1 text-xs">
          {entry.onyomi.length > 0 ? (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground">On</dt>
              <dd className="font-jp">{entry.onyomi.join('、')}</dd>
            </div>
          ) : null}
          {entry.kunyomi.length > 0 ? (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground">Kun</dt>
              <dd className="font-jp">{entry.kunyomi.join('、')}</dd>
            </div>
          ) : null}
          {entry.meanings.length > 0 ? (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground">Meaning</dt>
              <dd>{entry.meanings.join(', ')}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
      )}
    </article>
  )
}
