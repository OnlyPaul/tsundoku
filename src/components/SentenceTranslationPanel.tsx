import type { GrammarEntry } from '@/lib/types'
import { useState } from 'react'

interface JlptBadgeProps {
  level: string | null | undefined
}

function JlptBadge({ level }: JlptBadgeProps) {
  if (!level) return null
  return (
    <span className="rounded-full border border-border bg-muted/40 px-1.5 py-px font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
      {level}
    </span>
  )
}

interface SentenceTranslateButtonProps {
  open: boolean
  hasNote: boolean
  onClick: () => void
  ariaLabelSuffix?: string
}

export function SentenceTranslateButton({
  open,
  hasNote,
  onClick,
  ariaLabelSuffix,
}: SentenceTranslateButtonProps) {
  const label = open ? 'Hide translation' : 'Show translation'
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={ariaLabelSuffix ? `${label} for ${ariaLabelSuffix}` : label}
      title={label}
      aria-pressed={open}
      className={`relative ml-1 mr-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border align-middle transition-colors ${
        open
          ? 'bg-translation text-translation-foreground'
          : 'bg-muted/40 text-muted-foreground hover:text-translation'
      }`}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 12 12"
        aria-hidden="true"
        focusable="false"
        role="presentation"
        className={`block transition-transform duration-200 ${open ? 'rotate-90' : 'rotate-0'}`}
      >
        <title>{label}</title>
        <path d="M3 2.5L9 6L3 9.5Z" fill="currentColor" />
      </svg>
      {hasNote && !open ? (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary"
        />
      ) : null}
    </button>
  )
}

interface SentenceTranslationPanelProps {
  english: string
  note?: string | null
  grammarIds?: string[]
  grammarMap: Map<string, GrammarEntry> | null
  panelRef?: (el: HTMLElement | null) => void
  ariaLabel?: string
  showFurigana?: boolean
}

export function SentenceTranslationPanel({
  english,
  note,
  grammarIds,
  grammarMap,
  panelRef,
  ariaLabel,
  showFurigana,
}: SentenceTranslationPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const ids = grammarIds ?? []
  const expandedEntry = expanded ? (grammarMap?.get(expanded) ?? null) : null

  return (
    // biome-ignore lint/a11y/useSemanticElements: panel is nested inside a <p>, where <section> would be invalid HTML.
    <span
      role="region"
      aria-label={ariaLabel}
      ref={(el) => panelRef?.(el)}
      className={`mt-2 block animate-translation-in rounded-r-sm border-l-2 border-translation bg-card px-4 py-3 font-prose ${
        showFurigana ? 'mb-[0.65em]' : 'mb-1'
      }`}
    >
      <span className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/80">
        Translation
      </span>
      <span className="block text-[0.95em] italic leading-snug text-foreground">{english}</span>

      {note ? (
        <span className="mt-3 block border-t border-dashed border-border pt-2.5">
          <span className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-primary">
            Note
          </span>
          <span className="block text-[0.85em] leading-relaxed text-muted-foreground">{note}</span>
        </span>
      ) : null}

      {ids.length > 0 ? (
        <span className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-2.5">
          <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/80">
            Grammar
          </span>
          {ids.map((id) => {
            const entry = grammarMap?.get(id) ?? null
            const isOpen = expanded === id
            const ready = Boolean(entry)
            const label = entry?.pattern ?? '…'
            return (
              <button
                type="button"
                key={id}
                disabled={!ready}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!ready) return
                  setExpanded(isOpen ? null : id)
                }}
                aria-pressed={isOpen}
                aria-busy={!ready}
                aria-label={ready ? `Grammar pattern ${label}` : 'Grammar pattern (loading)'}
                className={`rounded-sm border px-2 py-px font-jp text-[13px] transition-colors ${
                  isOpen
                    ? 'border-translation bg-translation text-translation-foreground'
                    : ready
                      ? 'border-translation/30 bg-translation/10 text-translation hover:bg-translation/20'
                      : 'cursor-progress border-border bg-muted/40 text-muted-foreground opacity-70'
                }`}
              >
                {label}
              </button>
            )
          })}
        </span>
      ) : null}

      {expandedEntry ? (
        <span className="mt-2.5 block animate-translation-in rounded-sm bg-translation/5 px-3 py-2.5 font-prose">
          <span className="mb-1 flex flex-wrap items-baseline gap-2">
            <span className="font-jp text-[15px] font-medium">{expandedEntry.pattern}</span>
            <JlptBadge level={expandedEntry.jlpt} />
            <span className="text-[11.5px] italic text-muted-foreground">
              {expandedEntry.title}
            </span>
          </span>
          <span className="mb-1.5 block font-mono text-[11px] text-muted-foreground">
            {expandedEntry.formation}
          </span>
          <span className="block text-[0.85em] leading-relaxed text-foreground">
            {expandedEntry.explanation}
          </span>
        </span>
      ) : null}
    </span>
  )
}
