import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getReaderPrefs, setFontSize, setFurigana, setJpFont } from './reader-prefs'

beforeEach(() => {
  try {
    localStorage.clear()
  } catch {
    // ignore
  }
})

afterEach(() => {
  try {
    localStorage.clear()
  } catch {
    // ignore
  }
})

describe('reader-prefs', () => {
  it('returns defaults when storage is empty', () => {
    expect(getReaderPrefs()).toEqual({
      furigana: true,
      fontSize: 18,
      jpFont: 'Noto Serif JP',
    })
  })

  it('round-trips furigana false', () => {
    setFurigana(false)
    expect(getReaderPrefs().furigana).toBe(false)
    setFurigana(true)
    expect(getReaderPrefs().furigana).toBe(true)
  })

  it('round-trips fontSize within 14..28', () => {
    setFontSize(20)
    expect(getReaderPrefs().fontSize).toBe(20)
  })

  it('clamps fontSize below 14 to 14', () => {
    setFontSize(8)
    expect(getReaderPrefs().fontSize).toBe(14)
  })

  it('clamps fontSize above 28 to 28', () => {
    setFontSize(64)
    expect(getReaderPrefs().fontSize).toBe(28)
  })

  it('falls back to default when stored fontSize is unparseable', () => {
    localStorage.setItem('tsundoku.fontSize', 'huge')
    expect(getReaderPrefs().fontSize).toBe(18)
  })

  it('round-trips jpFont from the allowlist', () => {
    setJpFont('Klee One')
    expect(getReaderPrefs().jpFont).toBe('Klee One')
  })

  it('rejects jpFont outside the allowlist on read', () => {
    localStorage.setItem('tsundoku.jpFont', 'Comic Sans')
    expect(getReaderPrefs().jpFont).toBe('Noto Serif JP')
  })

  it('does not write jpFont values outside the allowlist', () => {
    setJpFont('Comic Sans' as never)
    expect(localStorage.getItem('tsundoku.jpFont')).toBe(null)
  })

  it('returns defaults when localStorage throws on read', () => {
    const orig = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new Error('disabled')
    }
    try {
      expect(getReaderPrefs()).toEqual({
        furigana: true,
        fontSize: 18,
        jpFont: 'Noto Serif JP',
      })
    } finally {
      Storage.prototype.getItem = orig
    }
  })
})
