import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { JP_FONTS, type JpFont, MAX_FONT, MIN_FONT } from '@/lib/reader-prefs'
import { useMediaQuery } from '@/lib/use-media-query'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  furigana: boolean
  fontSize: number
  jpFont: JpFont
  onFuriganaChange: (next: boolean) => void
  onFontSizeChange: (next: number) => void
  onJpFontChange: (next: JpFont) => void
  appVersion: string
  libraryBookCount: number | null
}

export function SettingsSheet({
  open,
  onOpenChange,
  furigana,
  fontSize,
  jpFont,
  onFuriganaChange,
  onFontSizeChange,
  onJpFontChange,
  appVersion,
  libraryBookCount,
}: SettingsSheetProps) {
  const isWide = useMediaQuery('(min-width: 768px)')
  const side = isWide ? 'right' : 'bottom'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="overflow-y-auto bg-card">
        <SheetHeader>
          <SheetTitle className="font-jp text-2xl font-medium">設定</SheetTitle>
          <SheetDescription className="font-mono text-[11px] uppercase tracking-wider">
            Reading preferences
          </SheetDescription>
        </SheetHeader>

        <section className="mt-6 space-y-5">
          <div className="flex items-center justify-between">
            <label htmlFor="furigana-toggle" className="text-sm">
              Furigana
            </label>
            <button
              id="furigana-toggle"
              type="button"
              role="switch"
              aria-checked={furigana}
              aria-pressed={furigana}
              onClick={() => onFuriganaChange(!furigana)}
              className="rounded border border-border px-3 py-1 font-mono text-xs uppercase tracking-wider"
            >
              {furigana ? 'On' : 'Off'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Font size</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease font size"
                onClick={() => onFontSizeChange(Math.max(MIN_FONT, fontSize - 1))}
                disabled={fontSize <= MIN_FONT}
                className="h-7 w-7 rounded border border-border font-mono text-sm disabled:opacity-40"
              >
                −
              </button>
              <span className="w-8 text-center font-mono text-sm tabular-nums">{fontSize}</span>
              <button
                type="button"
                aria-label="Increase font size"
                onClick={() => onFontSizeChange(Math.min(MAX_FONT, fontSize + 1))}
                disabled={fontSize >= MAX_FONT}
                className="h-7 w-7 rounded border border-border font-mono text-sm disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <label htmlFor="jp-font-select" className="text-sm">
              Japanese font
            </label>
            <select
              id="jp-font-select"
              value={jpFont}
              onChange={(e) => onJpFontChange(e.target.value as JpFont)}
              className="rounded border border-border bg-background px-2 py-1 text-sm"
            >
              {JP_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-8 border-t border-border pt-4">
          <p
            className="font-jp text-base leading-relaxed"
            style={{ fontFamily: `"${jpFont}", serif`, fontSize: `${fontSize}px` }}
          >
            {furigana ? (
              <ruby>
                本<rt>ほん</rt>
              </ruby>
            ) : (
              '本'
            )}
            を
            {furigana ? (
              <ruby>
                読<rt>よ</rt>
              </ruby>
            ) : (
              '読'
            )}
            みます。
          </p>
        </section>

        <section
          aria-label="About"
          className="mt-8 space-y-2 border-t border-border pt-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
        >
          <p className="text-foreground/80">About</p>
          <div className="flex items-center justify-between">
            <span>Version</span>
            <span className="tabular-nums">{appVersion}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Books in library</span>
            <span className="tabular-nums">
              {libraryBookCount === null ? '—' : libraryBookCount}
            </span>
          </div>
        </section>
      </SheetContent>
    </Sheet>
  )
}
