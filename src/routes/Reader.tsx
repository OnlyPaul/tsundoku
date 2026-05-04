import { fetchChapter, fetchMetadata } from '@/lib/book-store'
import { getBookmark } from '@/lib/bookmarks'
import type { BookMetadata, Paragraph, Token } from '@/lib/types'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

const FURIGANA_KEY = 'tsundoku.furigana'

function readFuriganaPref(): boolean {
  try {
    return localStorage.getItem(FURIGANA_KEY) !== 'off'
  } catch {
    return true
  }
}

function TokenSpan({ token, showFurigana }: { token: Token; showFurigana: boolean }) {
  const inner =
    token.r && showFurigana ? (
      <ruby>
        <rb>{token.s}</rb>
        <rt>{token.r}</rt>
      </ruby>
    ) : (
      token.s
    )

  if (token.v) {
    return (
      <button
        type="button"
        aria-label={token.s}
        className="font-bold text-foreground hover:text-primary"
        onClick={() => {
          // Popup wired up in #8
        }}
      >
        {inner}
      </button>
    )
  }
  return <span className="opacity-50">{inner}</span>
}

export default function Reader() {
  const { slug } = useParams<{ slug: string }>()
  const [params, setParams] = useSearchParams()
  const urlChapter = params.get('chapter')
  const [metadata, setMetadata] = useState<BookMetadata | null>(null)
  const chapterId =
    urlChapter ?? (slug ? getBookmark(slug)?.chapterId : null) ?? metadata?.chapters[0]?.id ?? null
  const [paragraphs, setParagraphs] = useState<Paragraph[] | null>(null)
  const [showFurigana, setShowFurigana] = useState<boolean>(() => readFuriganaPref())

  useEffect(() => {
    try {
      localStorage.setItem(FURIGANA_KEY, showFurigana ? 'on' : 'off')
    } catch {
      // ignore
    }
  }, [showFurigana])

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    fetchMetadata(slug).then((m) => {
      if (!cancelled) setMetadata(m)
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!slug || !chapterId) return
    let cancelled = false
    setParagraphs(null)
    fetchChapter(slug, chapterId).then((p) => {
      if (!cancelled) setParagraphs(p)
    })
    return () => {
      cancelled = true
    }
  }, [slug, chapterId])

  const chapterIndex = metadata?.chapters.findIndex((c) => c.id === chapterId) ?? -1
  const chapterTitle = metadata?.chapters[chapterIndex]?.title

  useEffect(() => {
    if (chapterTitle) document.title = chapterTitle
  }, [chapterTitle])

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
          ← Library
        </Link>
        <button
          type="button"
          aria-pressed={showFurigana}
          onClick={() => setShowFurigana((v) => !v)}
          className="rounded border border-border px-3 py-1 text-sm"
        >
          Furigana: {showFurigana ? 'on' : 'off'}
        </button>
      </div>
      {paragraphs?.map((p) => (
        <p key={p.id} data-paragraph-id={p.id} className="mt-4 leading-loose">
          {p.tokens.map((t, i) => (
            <TokenSpan key={`${p.id}-${i}`} token={t} showFurigana={showFurigana} />
          ))}
        </p>
      ))}
      {metadata && chapterId ? (
        <nav className="mt-8 flex justify-between">
          <button
            type="button"
            disabled={chapterIndex <= 0}
            onClick={() => {
              const prev = metadata.chapters[chapterIndex - 1]
              if (prev) setParams({ chapter: prev.id, paragraph: 'p0' })
            }}
            className="rounded border border-border px-3 py-1 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={chapterIndex < 0 || chapterIndex >= metadata.chapters.length - 1}
            onClick={() => {
              const next = metadata.chapters[chapterIndex + 1]
              if (next) setParams({ chapter: next.id, paragraph: 'p0' })
            }}
            className="rounded border border-border px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      ) : null}
    </main>
  )
}
