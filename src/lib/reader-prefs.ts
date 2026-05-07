export const JP_FONTS = ['Noto Serif JP', 'Shippori Mincho', 'Klee One', 'Noto Sans JP'] as const
export type JpFont = (typeof JP_FONTS)[number]

export interface ReaderPrefs {
  furigana: boolean
  fontSize: number
  jpFont: JpFont
}

export const DEFAULT_PREFS: ReaderPrefs = {
  furigana: true,
  fontSize: 18,
  jpFont: 'Noto Serif JP',
}

const FURIGANA_KEY = 'tsundoku.furigana'
const FONT_SIZE_KEY = 'tsundoku.fontSize'
const JP_FONT_KEY = 'tsundoku.jpFont'

const MIN_FONT = 14
const MAX_FONT = 28

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function clampFontSize(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_PREFS.fontSize
  return Math.min(MAX_FONT, Math.max(MIN_FONT, Math.round(n)))
}

function isJpFont(value: string): value is JpFont {
  return (JP_FONTS as readonly string[]).includes(value)
}

export function getReaderPrefs(): ReaderPrefs {
  const furiganaRaw = safeGet(FURIGANA_KEY)
  const furigana = furiganaRaw === null ? DEFAULT_PREFS.furigana : furiganaRaw !== 'off'

  const fontRaw = safeGet(FONT_SIZE_KEY)
  let fontSize = DEFAULT_PREFS.fontSize
  if (fontRaw !== null) {
    const parsed = Number(fontRaw)
    fontSize = Number.isFinite(parsed) ? clampFontSize(parsed) : DEFAULT_PREFS.fontSize
  }

  const jpFontRaw = safeGet(JP_FONT_KEY)
  const jpFont: JpFont = jpFontRaw && isJpFont(jpFontRaw) ? jpFontRaw : DEFAULT_PREFS.jpFont

  return { furigana, fontSize, jpFont }
}

export function setFurigana(value: boolean): void {
  safeSet(FURIGANA_KEY, value ? 'on' : 'off')
}

export function setFontSize(value: number): void {
  safeSet(FONT_SIZE_KEY, String(clampFontSize(value)))
}

export function setJpFont(value: JpFont): void {
  if (!isJpFont(value)) return
  safeSet(JP_FONT_KEY, value)
}

export { MIN_FONT, MAX_FONT }
