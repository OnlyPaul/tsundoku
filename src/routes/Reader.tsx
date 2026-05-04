import { fetchChapter, fetchMetadata } from '@/lib/book-store'
import { getBookmark, setBookmark } from '@/lib/bookmarks'
import type { Paragraph } from '@/lib/types'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

export default function Reader() {
  const { slug } = useParams<{ slug: string }>()
  const [params] = useSearchParams()
  const chapterParam = params.get('chapter')
  const [chapterId, setChapterId] = useState<string | null>(chapterParam)
  const [paragraphs, setParagraphs] = useState<Paragraph[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const paragraphRefs = useRef(new Map<string, HTMLElement>())
  const restoredRef = useRef(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      let cid = chapterParam
      if (!cid) {
        const meta = await fetchMetadata(slug as string)
        cid = meta.chapters[0]?.id ?? null
      }
      if (!cid) return
      const ps = await fetchChapter(slug as string, cid)
      if (cancelled) return
      setChapterId(cid)
      setParagraphs(ps)
    }
    load().catch((err: unknown) => {
      if (!cancelled) setError(err instanceof Error ? err.message : String(err))
    })
    return () => {
      cancelled = true
    }
  }, [slug, chapterParam])

  useEffect(() => {
    if (!slug || !chapterId || !paragraphs || restoredRef.current) return
    const saved = getBookmark(slug)
    if (saved && saved.chapterId === chapterId) {
      const target = paragraphRefs.current.get(saved.paragraphId)
      if (target) {
        target.scrollIntoView({ block: 'start' })
        restoredRef.current = true
      }
    } else {
      restoredRef.current = true
    }
  }, [slug, chapterId, paragraphs])

  useEffect(() => {
    if (!slug || !chapterId || !paragraphs) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue
          const pid = (entry.target as HTMLElement).dataset.paragraphId
          if (!pid) continue
          setBookmark(slug, { chapterId, paragraphId: pid })
        }
      },
      { threshold: [0.5] },
    )

    for (const el of paragraphRefs.current.values()) observer.observe(el)
    return () => observer.disconnect()
  }, [slug, chapterId, paragraphs])

  function registerParagraph(id: string) {
    return (el: HTMLElement | null) => {
      if (el) paragraphRefs.current.set(id, el)
      else paragraphRefs.current.delete(id)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
        ← Library
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{slug}</h1>
      {error && <p className="mt-2 text-destructive">Failed to load: {error}</p>}
      {paragraphs && (
        <div className="mt-6 space-y-4" data-chapter-id={chapterId ?? ''}>
          {paragraphs.map((p) => (
            <p
              key={p.id}
              ref={registerParagraph(p.id)}
              data-testid={`paragraph-${p.id}`}
              data-paragraph-id={p.id}
            >
              {p.tokens.map((t, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: tokens lack stable ids
                <span key={i}>{t.s}</span>
              ))}
            </p>
          ))}
        </div>
      )}
    </main>
  )
}
