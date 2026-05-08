import { SettingsSheet } from '@/components/SettingsSheet'
import { TappableToken } from '@/components/TappableToken'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  fetchBookIndex,
  fetchChapter,
  fetchGrammar,
  fetchKanji,
  fetchMetadata,
  fetchVocab,
} from '@/lib/book-store'
import { getBookmark, setBookmark } from '@/lib/bookmarks'
import type { ChapterFormat, NormalizedParagraph } from '@/lib/chapter-decoder'
import {
  type JpFont,
  getReaderPrefs,
  setFontSize as persistFontSize,
  setFurigana as persistFurigana,
  setJpFont as persistJpFont,
} from '@/lib/reader-prefs'
import type { BookMetadata, GrammarEntry, KanjiEntry, VocabEntry } from '@/lib/types'
import { useMediaQuery } from '@/lib/use-media-query'
import { ChevronLeft, Settings as SettingsIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { version as APP_VERSION } from '../../package.json'

interface AnchoredRect {
  top: number
  height: number
}

function findAnchoredTarget<T>(
  entries: Iterable<[T, HTMLElement]>,
  anchorY: number,
): { key: T; rect: AnchoredRect } | null {
  let inside: { key: T; rect: AnchoredRect } | null = null
  let firstBelow: { key: T; rect: AnchoredRect } | null = null
  for (const [key, el] of entries) {
    const r = el.getBoundingClientRect()
    if (r.top <= anchorY && r.bottom > anchorY) {
      inside = { key, rect: { top: r.top, height: r.height } }
      break
    }
    if (r.top > anchorY && (!firstBelow || r.top < firstBelow.rect.top)) {
      firstBelow = { key, rect: { top: r.top, height: 0 } }
    }
  }
  return inside ?? firstBelow
}

function fractionalOffset(rect: AnchoredRect, anchorY: number): number {
  if (rect.height <= 0) return 0
  return Math.min(1, Math.max(0, (anchorY - rect.top) / rect.height))
}

export default function Reader() {
  const { slug } = useParams<{ slug: string }>()
  const [params, setParams] = useSearchParams()
  const urlChapter = params.get('chapter')
  const isWide = useMediaQuery('(min-width: 768px)')
  const [metadata, setMetadata] = useState<BookMetadata | null>(null)
  const chapterId =
    urlChapter ?? (slug ? getBookmark(slug)?.chapterId : null) ?? metadata?.chapters[0]?.id ?? null
  const [paragraphs, setParagraphs] = useState<NormalizedParagraph[] | null>(null)
  const [chapterFormat, setChapterFormat] = useState<ChapterFormat | null>(null)
  const [vocab, setVocab] = useState<Map<string, VocabEntry> | null>(null)
  const [kanjiMap, setKanjiMap] = useState<Map<string, KanjiEntry> | null>(null)
  const [kanjiRequested, setKanjiRequested] = useState(false)
  const initialPrefs = (() => getReaderPrefs())()
  const [showFurigana, setShowFurigana] = useState<boolean>(initialPrefs.furigana)
  const [fontSize, setFontSizeState] = useState<number>(initialPrefs.fontSize)
  const [jpFont, setJpFontState] = useState<JpFont>(initialPrefs.jpFont)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [libraryBookCount, setLibraryBookCount] = useState<number | null>(null)
  const [grammarMap, setGrammarMap] = useState<Map<string, GrammarEntry> | null>(null)
  const [openGrammarFor, setOpenGrammarFor] = useState<NormalizedParagraph | null>(null)
  const paragraphRefs = useRef(new Map<string, HTMLElement>())
  const sentenceRefs = useRef(new Map<string, { el: HTMLElement; paragraphId: string }>())
  const restoredForRef = useRef<string | null>(null)

  useEffect(() => {
    persistFurigana(showFurigana)
  }, [showFurigana])
  useEffect(() => {
    persistFontSize(fontSize)
  }, [fontSize])
  useEffect(() => {
    persistJpFont(jpFont)
  }, [jpFont])

  useEffect(() => {
    let cancelled = false
    fetchBookIndex()
      .then((slugs) => {
        if (!cancelled) setLibraryBookCount(slugs.length)
      })
      .catch(() => {
        if (!cancelled) setLibraryBookCount(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

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
    setChapterFormat(null)
    fetchChapter(slug, chapterId).then((c) => {
      if (!cancelled) {
        setParagraphs(c.paragraphs)
        setChapterFormat(c.format)
      }
    })
    return () => {
      cancelled = true
    }
  }, [slug, chapterId])

  const chapterIndex = metadata?.chapters.findIndex((c) => c.id === chapterId) ?? -1
  const chapterTitle = metadata?.chapters[chapterIndex]?.title
  const chapterCount = metadata?.chapters.length ?? 0
  const chapterNumber = chapterIndex >= 0 ? chapterIndex + 1 : 1

  useEffect(() => {
    if (chapterTitle) document.title = chapterTitle
  }, [chapterTitle])

  useEffect(() => {
    if (!slug || !chapterId || !paragraphs) return
    const key = `${slug}::${chapterId}`
    if (restoredForRef.current === key) return
    const saved = getBookmark(slug)
    if (saved && saved.chapterId === chapterId) {
      const sentenceTarget = saved.sentenceId
        ? sentenceRefs.current.get(saved.sentenceId)?.el
        : undefined
      const target = sentenceTarget ?? paragraphRefs.current.get(saved.paragraphId)
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
      if (!slug || !chapterId) return
      const anchorY = 0
      if (chapterFormat === 'v2') {
        const entries: Iterable<[{ sentenceId: string; paragraphId: string }, HTMLElement]> =
          Array.from(sentenceRefs.current, ([sentenceId, { el, paragraphId }]) => [
            { sentenceId, paragraphId },
            el,
          ])
        const found = findAnchoredTarget(entries, anchorY)
        if (!found) return
        setBookmark(slug, {
          chapterId,
          paragraphId: found.key.paragraphId,
          sentenceId: found.key.sentenceId,
          offset: fractionalOffset(found.rect, anchorY),
        })
        return
      }
      const found = findAnchoredTarget(paragraphRefs.current, anchorY)
      if (!found) return
      setBookmark(slug, {
        chapterId,
        paragraphId: found.key,
        offset: fractionalOffset(found.rect, anchorY),
      })
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
  }, [slug, chapterId, paragraphs, chapterFormat])

  function openGrammarSheet(paragraph: NormalizedParagraph) {
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

  const proseStyle = { fontFamily: `"${jpFont}", serif`, fontSize: `${fontSize}px` }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
        <Link
          to="/"
          aria-label="Back to library"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden md:inline font-mono text-xs uppercase tracking-wider">
            Library
          </span>
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="line-clamp-1 font-jp text-base">{metadata?.title ?? ''}</p>
          {chapterCount > 0 ? (
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Ch. {chapterNumber} / {chapterCount}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Reading settings"
          onClick={() => setSettingsOpen(true)}
          className="rounded p-1.5 text-muted-foreground hover:text-primary"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </header>

      <article className="mx-auto max-w-prose px-6 pb-16 pt-8 md:px-10">
        {chapterTitle ? (
          <div className="mb-10 border-b border-border pb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Chapter {chapterNumber}
            </p>
            <h2 className="mt-3 font-jp text-3xl font-medium leading-tight md:text-4xl">
              {chapterTitle}
            </h2>
          </div>
        ) : null}

        {paragraphs?.map((p) => (
          <p
            key={p.id}
            ref={(el) => {
              if (el) paragraphRefs.current.set(p.id, el)
              else paragraphRefs.current.delete(p.id)
            }}
            data-paragraph-id={p.id}
            style={proseStyle}
            className="mt-6 leading-loose"
          >
            {p.sentences.map((s) => (
              <span
                key={s.id}
                data-sentence-id={s.id}
                ref={(el) => {
                  if (el) sentenceRefs.current.set(s.id, { el, paragraphId: p.id })
                  else sentenceRefs.current.delete(s.id)
                }}
              >
                {s.tokens.map((t, i) => (
                  <TappableToken
                    key={`${s.id}-${i}`}
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
              </span>
            ))}
            {p.grammar && p.grammar.length > 0 ? (
              <>
                {' '}
                <button
                  type="button"
                  onClick={() => openGrammarSheet(p)}
                  aria-label={`Grammar notes for paragraph ${p.id}`}
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground align-middle shadow-sm hover:opacity-90"
                  style={{ fontSize: '0.7rem' }}
                >
                  <span aria-hidden className="font-jp leading-none">
                    文
                  </span>
                </button>
              </>
            ) : null}
          </p>
        ))}

        {metadata && chapterId ? (
          <nav className="mt-16 flex items-center justify-between border-t border-border pt-6 font-mono text-[11px] uppercase tracking-wider">
            <button
              type="button"
              disabled={chapterIndex <= 0}
              onClick={() => {
                const prev = metadata.chapters[chapterIndex - 1]
                if (prev) setParams({ chapter: prev.id, paragraph: 'p0' })
              }}
              className="text-muted-foreground hover:text-primary disabled:opacity-40 disabled:hover:text-muted-foreground"
            >
              ← Previous
            </button>
            <span className="text-muted-foreground">
              Chapter {chapterNumber} / {chapterCount}
            </span>
            <button
              type="button"
              disabled={chapterIndex < 0 || chapterIndex >= metadata.chapters.length - 1}
              onClick={() => {
                const next = metadata.chapters[chapterIndex + 1]
                if (next) setParams({ chapter: next.id, paragraph: 'p0' })
              }}
              className="text-muted-foreground hover:text-primary disabled:opacity-40 disabled:hover:text-muted-foreground"
            >
              Next →
            </button>
          </nav>
        ) : null}
      </article>

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        furigana={showFurigana}
        fontSize={fontSize}
        jpFont={jpFont}
        onFuriganaChange={setShowFurigana}
        onFontSizeChange={setFontSizeState}
        onJpFontChange={setJpFontState}
        appVersion={APP_VERSION}
        libraryBookCount={libraryBookCount}
      />

      <Sheet
        open={openGrammarFor !== null}
        onOpenChange={(open) => {
          if (!open) setOpenGrammarFor(null)
        }}
      >
        <SheetContent side={isWide ? 'right' : 'bottom'} className="overflow-y-auto bg-card">
          <SheetHeader>
            <SheetTitle className="font-jp text-2xl font-medium">Grammar notes</SheetTitle>
            <SheetDescription className="font-mono text-[11px] uppercase tracking-wider">
              Patterns appearing in this paragraph
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {openEntries.map((entry) => (
              <section key={entry.id} className="space-y-2">
                <header className="flex items-baseline justify-between gap-2">
                  <h3 className="font-jp text-lg font-medium">{entry.title}</h3>
                  {entry.jlpt ? (
                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {entry.jlpt}
                    </span>
                  ) : null}
                </header>
                <p className="text-sm">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Formation:{' '}
                  </span>
                  {entry.formation}
                </p>
                <p className="text-sm">{entry.explanation}</p>
                {entry.examples_in_book.length > 0 && openGrammarFor ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-mono text-[10px] uppercase tracking-wider">
                      In book:{' '}
                    </span>
                    {openGrammarFor.sentences
                      .flatMap((s) => s.tokens)
                      .map((t) => t.s)
                      .join('')}
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
