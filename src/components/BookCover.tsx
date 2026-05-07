import { useState } from 'react'

export const FALLBACK_PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ['#E8C9A1', '#B96B4B', '#3F2A1E'],
  ['#1F2742', '#3D5388', '#D4D2C8'],
  ['#F4D9DD', '#C97391', '#5A2A3D'],
  ['#E5D6B5', '#7A8C5C', '#2F3A22'],
  ['#EADBC8', '#5C7A8C', '#1F2A33'],
  ['#F0E1C9', '#C76B4F', '#3A1F1A'],
] as const

const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u

function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  }
  return h
}

function firstCjk(title: string): string | null {
  for (const ch of title) {
    if (CJK_RE.test(ch)) return ch
  }
  return null
}

export interface FallbackCover {
  paletteIndex: number
  glyph: string
}

export function pickFallbackCover(bookId: string, title: string): FallbackCover {
  const paletteIndex = djb2(bookId) % FALLBACK_PALETTES.length
  let glyph: string
  if (!title) glyph = '?'
  else glyph = firstCjk(title) ?? title.charAt(0) ?? '?'
  return { paletteIndex, glyph }
}

interface BookCoverProps {
  bookId: string
  title: string
  coverUrl?: string | null
  alt: string
  className?: string
}

export function BookCover({ bookId, title, coverUrl, alt, className }: BookCoverProps) {
  const [errored, setErrored] = useState(false)
  const showImage = Boolean(coverUrl) && !errored

  if (showImage) {
    return (
      <div
        className={`relative aspect-[2/3] w-full overflow-hidden rounded-sm shadow-sm ${className ?? ''}`}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/20 to-transparent"
        />
        <img
          src={coverUrl ?? undefined}
          alt={alt}
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  const { paletteIndex, glyph } = pickFallbackCover(bookId, title)
  const [bg, mid, fg] = FALLBACK_PALETTES[paletteIndex]
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-sm shadow-sm ${className ?? ''}`}
      style={{ background: `linear-gradient(160deg, ${bg} 0%, ${mid} 100%)` }}
    >
      <span aria-hidden className="font-jp text-5xl font-medium" style={{ color: fg }}>
        {glyph}
      </span>
    </div>
  )
}
