import { TappableToken } from '@/components/TappableToken'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { fetchChapter, fetchGrammar, fetchKanji, fetchMetadata, fetchVocab } from '@/lib/book-store'
import { getBookmark, setBookmark } from '@/lib/bookmarks'
import type { BookMetadata, GrammarEntry, KanjiEntry, Paragraph, VocabEntry } from '@/lib/types'
import { BookOpen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

const FURIGANA_KEY = 'tsundoku.furigana'

function readFuriganaPref(): boolean {
  try {
    return localStorage.getItem(FURIGANA_KEY) !== 'off'
  } catch {
    return true
  }
}

export default function Reader() {
  const { slug } = useParams<{ slug: string }>()
  const [params, setParams] = useSearchParams()
  const urlChapter = params.get('chapter')
  const [metadata, setMetadata] = useState<BookMetadata | null>(null)
  const chapterId =
    urlChapter ?? (slug ? getBookmark(slug)?.chapterId : null) ?? metadata?.chapters[0]?.id ?? null
  const [paragraphs, setParagraphs] = useState<Paragraph[] | null>(null)
  const [vocab, setVocab] = useState<Map<string, VocabEntry> | null>(null)
  const [kanjiMap, setKanjiMap] = useState<Map<string, KanjiEntry> | null>(null)
  const [kanjiRequested, setKanjiRequested] = useState(false)
  const [showFurigana, setShowFurigana] = useState<boolean>(() => readFuriganaPref())
  const [grammarMap, setGrammarMap] = useState<Map<string, GrammarEntry> | null>(null)
  const [openGrammarFor, setOpenGrammarFor] = useState<Paragraph | null>(null)
  const paragraphRefs = useRef(new Map<string, HTMLElement>())
  const restoredForRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(FURIGANA_KEY, showFurigana ? 'on' : 'off')
    } catch {
      // ignore
    }
  }, [showFurigana])

  useEffect(() => {
    setKanjiMap(null)
    setKanjiRequested(false)
    if (!slug) return
    let cancelled = false
    fetchVocab(slug)
      .then((v) => {
        if (!cancelled) setVocab(v)
      })
      .catch(() => {
        if (!cancelled) setVocab(new Map())
      })
    return () => {
      cancelled = true
    }
  }, [slug])

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

  useEffect(() => {
    if (!slug || !chapterId || !paragraphs) return
    const key = `${slug}::${chapterId}`
    if (restoredForRef.current === key) return
    const saved = getBookmark(slug)
    if (saved && saved.chapterId === chapterId) {
      const target = paragraphRefs.current.get(saved.paragraphId)
      if (target) {
        const rect = target.getBoundingClientRect()
        const docTop = window.scrollY + rect.top
        const offset = saved.offset ?? 0
        window.scrollTo({ top: docTop + offset * rect.height, behavior: 'instant' })
      }
    }
    restoredForRef.current = key
  }, [slug, chapterId, paragraphs])

  useEffect(() => {
    if (!slug || !chapterId || !paragraphs) return
    if (restoredForRef.current !== `${slug}::${chapterId}`) return

    let frame: number | null = null
    function save() {
      frame = null
      const anchorY = 0
      let inside: { id: string; top: number; height: number } | null = null
      let firstBelow: { id: string; top: number } | null = null
      for (const [id, el] of paragraphRefs.current) {
        const rect = el.getBoundingClientRect()
        if (rect.top <= anchorY && rect.bottom > anchorY) {
          inside = { id, top: rect.top, height: rect.height }
          break
        }
        if (rect.top > anchorY && (!firstBelow || rect.top < firstBelow.top)) {
          firstBelow = { id, top: rect.top }
        }
      }
      const chosen = inside ?? (firstBelow ? { ...firstBelow, height: 0 } : null)
      if (!chosen || !slug || !chapterId) return
      const offset =
        chosen.height > 0 ? Math.min(1, Math.max(0, (anchorY - chosen.top) / chosen.height)) : 0
      setBookmark(slug, { chapterId, paragraphId: chosen.id, offset })
    }
    function onScroll() {
      if (frame !== null) return
      frame = requestAnimationFrame(save)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [slug, chapterId, paragraphs])

  function openGrammarSheet(paragraph: Paragraph) {
    setOpenGrammarFor(paragraph)
    if (!grammarMap && slug) {
      fetchGrammar(slug).then(setGrammarMap)
    }
  }

  const openEntries: GrammarEntry[] =
    openGrammarFor && grammarMap
      ? (openGrammarFor.grammar ?? [])
          .map((id) => grammarMap.get(id))
          .filter((e): e is GrammarEntry => Boolean(e))
      : []

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
        <p
          key={p.id}
          ref={(el) => {
            if (el) paragraphRefs.current.set(p.id, el)
            else paragraphRefs.current.delete(p.id)
          }}
          data-paragraph-id={p.id}
          className="mt-4 leading-loose"
        >
          {p.tokens.map((t, i) => (
            <TappableToken
              key={`${p.id}-${i}`}
              token={t}
              vocab={vocab}
              kanjiMap={kanjiMap}
              onOpenKanjiTab={() => {
                if (kanjiRequested || !slug) return
                setKanjiRequested(true)
                fetchKanji(slug)
                  .then(setKanjiMap)
                  .catch(() => setKanjiMap(new Map()))
              }}
              showFurigana={showFurigana}
            />
          ))}
          {p.grammar && p.grammar.length > 0 ? (
            <>
              {' '}
              <button
                type="button"
                onClick={() => openGrammarSheet(p)}
                aria-label={`Grammar notes for paragraph ${p.id}`}
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              >
                <BookOpen className="h-3 w-3" />
              </button>
            </>
          ) : null}
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
      <Sheet
        open={openGrammarFor !== null}
        onOpenChange={(open) => {
          if (!open) setOpenGrammarFor(null)
        }}
      >
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Grammar notes</SheetTitle>
            <SheetDescription>Patterns appearing in this paragraph</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {openEntries.map((entry) => (
              <section key={entry.id} className="space-y-2">
                <header className="flex items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold">{entry.title}</h3>
                  {entry.jlpt ? (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {entry.jlpt}
                    </span>
                  ) : null}
                </header>
                <p className="text-sm">
                  <span className="font-medium">Formation: </span>
                  {entry.formation}
                </p>
                <p className="text-sm">{entry.explanation}</p>
                {entry.examples_in_book.length > 0 && openGrammarFor ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">In book: </span>
                    {openGrammarFor.tokens.map((t) => t.s).join('')}
                  </p>
                ) : null}
              </section>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  )
}
