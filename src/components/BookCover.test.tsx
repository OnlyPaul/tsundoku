import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BookCover, FALLBACK_PALETTES, pickFallbackCover } from './BookCover'

describe('pickFallbackCover', () => {
  it('returns the same palette index and glyph for the same id+title', () => {
    const a = pickFallbackCover('yuugure', '夕暮れの図書室')
    const b = pickFallbackCover('yuugure', '夕暮れの図書室')
    expect(a).toEqual(b)
  })

  it('produces a palette index inside FALLBACK_PALETTES bounds', () => {
    const { paletteIndex } = pickFallbackCover('whatever-id', '春が来る前に')
    expect(paletteIndex).toBeGreaterThanOrEqual(0)
    expect(paletteIndex).toBeLessThan(FALLBACK_PALETTES.length)
  })

  it('uses the first CJK character of the title as the glyph', () => {
    expect(pickFallbackCover('a', '夕暮れの図書室').glyph).toBe('夕')
    expect(pickFallbackCover('b', 'Hello 春が来る').glyph).toBe('春')
  })

  it('falls back to the first character when the title has no CJK', () => {
    expect(pickFallbackCover('c', 'Tsundoku').glyph).toBe('T')
  })

  it('returns "?" glyph when title is empty', () => {
    expect(pickFallbackCover('d', '').glyph).toBe('?')
  })

  it('returns different palette indices for different ids (probabilistically; sample two known)', () => {
    const a = pickFallbackCover('yuugure', 'X')
    const b = pickFallbackCover('tsukiakari', 'X')
    expect(a.paletteIndex === b.paletteIndex && a.glyph === b.glyph).toBe(false)
  })
})

describe('<BookCover>', () => {
  it('renders an <img> with the supplied src and alt when coverUrl is provided', () => {
    render(<BookCover bookId="x" title="春" coverUrl="/cover.jpg" alt="Cover of 春" />)
    const img = screen.getByAltText('Cover of 春') as HTMLImageElement
    expect(img.tagName).toBe('IMG')
    expect(img.getAttribute('src')).toBe('/cover.jpg')
  })

  it('renders the fallback glyph (in role=img with aria-label) when coverUrl is absent', () => {
    render(<BookCover bookId="x" title="春が来る前に" alt="Cover of 春が来る前に" />)
    expect(screen.queryByRole('img', { name: 'Cover of 春が来る前に' })).not.toBeNull()
    expect(screen.getByText('春')).toBeInTheDocument()
  })

  it('switches to the fallback glyph when the image fails to load', () => {
    render(
      <BookCover bookId="x" title="春が来る" coverUrl="/missing.jpg" alt="Cover of 春が来る" />,
    )
    const img = screen.getByAltText('Cover of 春が来る') as HTMLImageElement
    fireEvent.error(img)
    expect(screen.getByText('春')).toBeInTheDocument()
  })
})
