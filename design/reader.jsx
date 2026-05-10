// reader.jsx — Reader UI primitives: Token, Paragraph, VocabPopup, GrammarSheet
//
// Tokens with `v` are tappable (full opacity). Particles/inflections without
// `v` are dimmed and inert. Furigana shows above kanji when enabled.

// (hooks accessed via React.* — top-level destructure causes collisions across babel scripts)

// ─────────────────────────────────────────────────────────────
// JLPT badge — small monospace chip
// ─────────────────────────────────────────────────────────────
function JlptBadge({ level, size = 'sm' }) {
  if (!level) return null;
  const dims = size === 'lg'
    ? { fontSize: 11, padding: '3px 7px', letterSpacing: 0.4 }
    : { fontSize: 9.5, padding: '2px 6px', letterSpacing: 0.3 };
  return (
    <span style={{
      ...dims,
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      fontWeight: 500,
      borderRadius: 999,
      border: '1px solid rgba(31,27,22,0.18)',
      color: 'rgba(31,27,22,0.7)',
      background: 'rgba(31,27,22,0.03)',
      textTransform: 'uppercase',
    }}>{level}</span>
  );
}

// ─────────────────────────────────────────────────────────────
// Single token — renders <ruby> when reading + furigana enabled.
// ─────────────────────────────────────────────────────────────
function Token({ token, furigana, onTap, active }) {
  const tappable = !!token.v;
  const showRuby = furigana && token.r;

  const baseStyle = {
    color: tappable ? '#1F1B16' : 'rgba(31,27,22,0.42)',
    cursor: tappable ? 'pointer' : 'default',
    borderRadius: 3,
    padding: '0 1px',
    transition: 'background 0.15s',
    background: active ? 'rgba(74,89,168,0.12)' : 'transparent',
    boxShadow: active ? 'inset 0 -2px 0 #4A59A8' : 'none',
    fontWeight: tappable ? 500 : 400,
  };

  const handle = (e) => {
    if (!tappable) return;
    e.stopPropagation();
    onTap(token, e.currentTarget);
  };

  if (showRuby) {
    return (
      <ruby
        onClick={handle}
        style={baseStyle}
        data-tappable={tappable ? '1' : '0'}
      >
        {token.s}
        <rt style={{
          fontSize: '0.48em',
          fontWeight: 400,
          color: tappable ? 'rgba(31,27,22,0.55)' : 'rgba(31,27,22,0.3)',
          letterSpacing: 0,
        }}>{token.r}</rt>
      </ruby>
    );
  }
  return <span onClick={handle} style={baseStyle}>{token.s}</span>;
}

// ─────────────────────────────────────────────────────────────
// Grammar badge — small vermillion seal-like stamp
// ─────────────────────────────────────────────────────────────
function GrammarBadge({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        left: -34,
        top: 4,
        width: 24,
        height: 24,
        borderRadius: 4,
        border: 'none',
        cursor: 'pointer',
        background: 'oklch(0.55 0.12 30)',
        color: '#F5EFE4',
        fontFamily: 'Noto Serif JP, serif',
        fontSize: 13,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(150,50,20,0.3)',
        padding: 0,
        lineHeight: 1,
      }}
      title={`${count} grammar pattern${count > 1 ? 's' : ''}`}
    >文</button>
  );
}

// ─────────────────────────────────────────────────────────────
// Sentence translation affordance — tiny inline button at end of sentence.
// Quiet by default. When the sentence has been "translated", a soft dot
// remains so the user can re-find translated lines.
// ─────────────────────────────────────────────────────────────
function TranslateBtn({ open, hasNote, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={open ? 'Hide translation' : 'Show translation'}
      style={{
        // Stays in the text flow — does not push line height.
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        marginLeft: 4,
        marginRight: 2,
        width: 22,
        height: 22,
        borderRadius: 4,
        border: '1px solid rgba(31,27,22,0.16)',
        background: open ? '#4A59A8' : 'rgba(31,27,22,0.04)',
        color: open ? '#FBF7EE' : 'rgba(31,27,22,0.55)',
        cursor: 'pointer',
        padding: 0,
        transition: 'background 0.15s, color 0.15s, transform 0.15s',
        position: 'relative',
        flexShrink: 0,
      }}
      title={open ? 'Hide translation' : 'Show translation'}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" style={{ display: 'block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>
        <path d="M3 2.5L9 6L3 9.5Z" fill="currentColor" />
      </svg>
      {hasNote && !open && (
        <span style={{
          position: 'absolute',
          top: -2, right: -2,
          width: 5, height: 5, borderRadius: '50%',
          background: 'oklch(0.55 0.12 30)',
        }} />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline translation panel — appears beneath the sentence when expanded
// ─────────────────────────────────────────────────────────────
function TranslationPanel({ english, note, grammarIds, grammarMap, fontSize }) {
  const grammar = (grammarIds || []).map((id) => grammarMap[id]).filter(Boolean);
  const [expanded, setExpanded] = React.useState(null); // pattern id
  return (
    <div
      style={{
        marginTop: 8,
        marginBottom: 4,
        padding: '12px 14px 12px 16px',
        background: '#FBF7EE',
        borderLeft: '2px solid #4A59A8',
        borderRadius: '0 4px 4px 0',
        fontFamily: 'Source Serif 4, Georgia, serif',
        animation: 'tsx-tr-in 0.18s ease-out',
      }}
    >
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9.5,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: 'rgba(31,27,22,0.4)',
        marginBottom: 4,
      }}>Translation</div>
      <div style={{
        fontSize: Math.max(13, fontSize - 3),
        lineHeight: 1.45,
        color: '#1F1B16',
        fontStyle: 'italic',
      }}>{english}</div>

      {note && (
        <div style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px dashed rgba(31,27,22,0.15)',
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9.5,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'oklch(0.55 0.12 30)',
            marginBottom: 4,
          }}>Note</div>
          <div style={{
            fontSize: Math.max(12, fontSize - 4),
            lineHeight: 1.5,
            color: 'rgba(31,27,22,0.78)',
          }}>{note}</div>
        </div>
      )}

      {grammar.length > 0 && (
        <div style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px dashed rgba(31,27,22,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9.5,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'rgba(31,27,22,0.4)',
          }}>Grammar</span>
          {grammar.map((g) => {
            const isOpen = expanded === g.pattern;
            return (
              <button
                key={g.pattern}
                onClick={(e) => { e.stopPropagation(); setExpanded(isOpen ? null : g.pattern); }}
                style={{
                  fontFamily: 'Noto Serif JP, serif',
                  fontSize: 13,
                  background: isOpen ? '#4A59A8' : 'rgba(74,89,168,0.08)',
                  border: '1px solid rgba(74,89,168,0.25)',
                  color: isOpen ? '#FBF7EE' : '#2E3A78',
                  borderRadius: 4,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >{g.pattern}</button>
            );
          })}
        </div>
      )}
      {expanded && grammarMap[expanded] && (() => {
        const g = grammarMap[expanded];
        return (
          <div style={{
            marginTop: 10,
            padding: '10px 12px',
            background: 'rgba(74,89,168,0.05)',
            borderRadius: 4,
            fontFamily: 'Source Serif 4, Georgia, serif',
            animation: 'tsx-tr-in 0.18s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{
                fontFamily: 'Noto Serif JP, serif',
                fontSize: 15, fontWeight: 500,
              }}>{g.pattern}</span>
              <JlptBadge level={g.jlpt} />
              <span style={{
                fontSize: 11.5,
                color: 'rgba(31,27,22,0.55)',
                fontStyle: 'italic',
              }}>{g.title}</span>
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: 'rgba(31,27,22,0.6)',
              marginBottom: 6,
            }}>{g.formation}</div>
            <div style={{
              fontSize: Math.max(12, fontSize - 4),
              lineHeight: 1.5,
              color: '#1F1B16',
            }}>{g.explanation}</div>
          </div>
        );
      })()}
    </div>
  );
}

// One-time CSS injection for translation panel animation
if (typeof document !== 'undefined' && !document.getElementById('tsx-anim-styles')) {
  const _s = document.createElement('style');
  _s.id = 'tsx-anim-styles';
  _s.textContent = '@keyframes tsx-tr-in { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }';
  document.head.appendChild(_s);
}

// ─────────────────────────────────────────────────────────────
// Paragraph — renders all tokens, with inline translation toggle.
// ─────────────────────────────────────────────────────────────
function Paragraph({ para, furigana, onTokenTap, activeTokenIdx, fontSize, lineHeight, jpFont, isCurrent, translationOpen, onToggleTranslation, grammarMap, autoTranslated }) {
  const hasGrammar = para.grammar && para.grammar.length > 0;
  const hasNote = !!(para.note || hasGrammar);
  return (
    <div
      data-pid={para.id}
      style={{
        position: 'relative',
        margin: '0 0 1.25em 0',
        padding: 0,
        boxShadow: isCurrent ? 'inset 3px 0 0 oklch(0.55 0.12 30)' : 'none',
        paddingLeft: isCurrent ? 12 : 0,
        transition: 'padding-left 0.2s',
      }}
    >
      <p
        style={{
          margin: 0,
          padding: 0,
          fontFamily: `${jpFont}, "Noto Serif JP", serif`,
          fontSize,
          lineHeight,
          color: '#1F1B16',
          fontFeatureSettings: '"palt"',
        }}
      >
        {para.tokens.map((t, i) => (
          <Token
            key={i}
            token={t}
            furigana={furigana}
            active={activeTokenIdx === i}
            onTap={(tok, el) => onTokenTap(tok, el, i)}
          />
        ))}
        {para.english && (
          <TranslateBtn
            open={translationOpen}
            hasNote={hasNote}
            onClick={() => onToggleTranslation(para.id)}
          />
        )}
      </p>
      {translationOpen && para.english && (
        <TranslationPanel
          english={para.english}
          note={para.note}
          grammarIds={para.grammar}
          grammarMap={grammarMap}
          fontSize={fontSize}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Vocab popup CONTENT — used inside Sheet (mobile) or Popover (tablet)
// ─────────────────────────────────────────────────────────────
function VocabContent({ token, vocab, kanjiMap, compact = false }) {
  if (!vocab) return null;
  const lemma = token.lemma || vocab.lemma;
  // Find kanji chars in lemma
  const kanjiChars = [...lemma].filter(c => /[\u4e00-\u9faf]/.test(c) && kanjiMap[c]);

  return (
    <div style={{ fontFamily: 'Source Serif 4, Georgia, serif', color: '#1F1B16' }}>
      {/* Primary section — meanings */}
      <div style={{ padding: compact ? '20px 22px 18px' : '18px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <span style={{
            fontFamily: 'Noto Serif JP, serif',
            fontSize: compact ? 30 : 26,
            fontWeight: 500,
            lineHeight: 1.1,
          }}>{lemma}</span>
          <JlptBadge level={vocab.jlpt} />
        </div>
        <div style={{
          fontFamily: 'Noto Serif JP, serif',
          fontSize: 14,
          color: 'rgba(31,27,22,0.6)',
          marginBottom: 10,
        }}>{vocab.reading}</div>
        <div style={{
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          color: 'rgba(31,27,22,0.5)',
          marginBottom: 8,
        }}>{vocab.pos}</div>
        <ol style={{
          margin: 0, padding: 0, listStyle: 'none',
          fontSize: 15.5, lineHeight: 1.5,
        }}>
          {vocab.meanings.map((m, i) => (
            <li key={i} style={{
              display: 'flex', gap: 10, marginBottom: 2,
            }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: 'rgba(31,27,22,0.4)',
                marginTop: 4,
                minWidth: 14,
              }}>{i + 1}.</span>
              <span>{m}</span>
            </li>
          ))}
        </ol>
        {token.lemma && token.lemma !== token.s && (
          <div style={{
            marginTop: 12,
            fontSize: 12,
            color: 'rgba(31,27,22,0.55)',
            fontStyle: 'italic',
            paddingTop: 10,
            borderTop: '1px dashed rgba(31,27,22,0.15)',
          }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontStyle: 'normal', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(31,27,22,0.4)', marginRight: 6 }}>conjugated</span>
            <span style={{ fontFamily: 'Noto Serif JP, serif' }}>{token.s}</span>
            <span style={{ margin: '0 6px', color: 'rgba(31,27,22,0.3)' }}>→</span>
            <span style={{ fontFamily: 'Noto Serif JP, serif' }}>{token.lemma}</span>
          </div>
        )}
      </div>

      {/* Secondary section — kanji breakdown (stacked, no tabs) */}
      {kanjiChars.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(31,27,22,0.1)',
          background: 'rgba(31,27,22,0.025)',
          padding: '14px 20px 18px',
        }}>
          <div style={{
            fontSize: 10.5,
            fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'rgba(31,27,22,0.5)',
            marginBottom: 12,
          }}>Kanji breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {kanjiChars.map((c, idx) => {
              const k = kanjiMap[c];
              return (
                <div key={idx} style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    flexShrink: 0,
                    width: 52, height: 52,
                    background: '#F5EFE4',
                    border: '1px solid rgba(31,27,22,0.12)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Noto Serif JP, serif',
                    fontSize: 32,
                    fontWeight: 500,
                    lineHeight: 1,
                  }}>{c}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginBottom: 4,
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {k.meanings.slice(0, 2).join(', ')}
                      </span>
                      <JlptBadge level={k.jlpt} />
                      <span style={{
                        fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                        color: 'rgba(31,27,22,0.45)',
                      }}>{k.stroke_count} strokes</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, lineHeight: 1.4 }}>
                      {k.onyomi.length > 0 && (
                        <div>
                          <span style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 9.5,
                            textTransform: 'uppercase',
                            color: 'rgba(31,27,22,0.45)',
                            marginRight: 4,
                          }}>on</span>
                          <span style={{ fontFamily: 'Noto Serif JP, serif' }}>{k.onyomi.join('・')}</span>
                        </div>
                      )}
                      {k.kunyomi.length > 0 && (
                        <div>
                          <span style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 9.5,
                            textTransform: 'uppercase',
                            color: 'rgba(31,27,22,0.45)',
                            marginRight: 4,
                          }}>kun</span>
                          <span style={{ fontFamily: 'Noto Serif JP, serif' }}>{k.kunyomi.join('・')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom Sheet (mobile) — slides up from bottom
// ─────────────────────────────────────────────────────────────
function BottomSheet({ open, onClose, children, maxHeight = '78%' }) {
  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: open ? 'rgba(31,27,22,0.32)' : 'transparent',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'background 0.2s',
          zIndex: 50,
        }}
      />
      <div style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        background: '#F5EFE4',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 24px rgba(31,27,22,0.15)',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        maxHeight,
        overflowY: 'auto',
        zIndex: 51,
      }}>
        {/* drag handle */}
        <div style={{
          display: 'flex', justifyContent: 'center', padding: '8px 0 4px',
        }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(31,27,22,0.18)',
          }} />
        </div>
        {children}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Popover (tablet) — anchored to a token element
// ─────────────────────────────────────────────────────────────
function AnchoredPopover({ open, anchorRect, onClose, children, containerRect }) {
  if (!open || !anchorRect || !containerRect) return null;

  const POPOVER_WIDTH = 360;
  const MAX_HEIGHT = 480;
  const GAP = 8;

  // Anchor coords relative to container
  const ax = anchorRect.left - containerRect.left;
  const ay = anchorRect.top - containerRect.top;
  const aw = anchorRect.width;
  const ah = anchorRect.height;

  // Position below anchor by default
  let left = ax + aw / 2 - POPOVER_WIDTH / 2;
  let top = ay + ah + GAP;
  // Clamp horizontally
  left = Math.max(12, Math.min(left, containerRect.width - POPOVER_WIDTH - 12));
  // Flip above if not enough space below
  const spaceBelow = containerRect.height - (ay + ah);
  if (spaceBelow < MAX_HEIGHT + 24) {
    top = ay - GAP - MAX_HEIGHT;
    if (top < 12) top = 12;
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'transparent',
          zIndex: 50,
        }}
      />
      <div style={{
        position: 'absolute',
        left, top,
        width: POPOVER_WIDTH,
        maxHeight: MAX_HEIGHT,
        background: '#FBF7EE',
        borderRadius: 10,
        border: '1px solid rgba(31,27,22,0.12)',
        boxShadow: '0 12px 40px rgba(31,27,22,0.18), 0 2px 8px rgba(31,27,22,0.08)',
        overflowY: 'auto',
        zIndex: 51,
      }}>
        {children}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Grammar Sheet — explanation of patterns in a paragraph
// ─────────────────────────────────────────────────────────────
function GrammarSheetContent({ patternIds, grammarMap }) {
  return (
    <div style={{ padding: '8px 22px 28px', fontFamily: 'Source Serif 4, Georgia, serif' }}>
      <div style={{
        fontSize: 10.5,
        fontFamily: 'JetBrains Mono, monospace',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: 'oklch(0.55 0.12 30)',
        marginBottom: 6,
        marginTop: 8,
      }}>Grammar in this paragraph</div>
      {patternIds.map((pid) => {
        const g = grammarMap[pid];
        if (!g) return null;
        return (
          <div key={pid} style={{
            paddingTop: 18,
            paddingBottom: 18,
            borderTop: '1px solid rgba(31,27,22,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
              <h3 style={{
                margin: 0,
                fontFamily: 'Noto Serif JP, serif',
                fontSize: 22,
                fontWeight: 500,
              }}>{g.pattern}</h3>
              <JlptBadge level={g.jlpt} />
            </div>
            <div style={{
              fontSize: 13,
              color: 'rgba(31,27,22,0.65)',
              marginBottom: 12,
              fontStyle: 'italic',
            }}>{g.title}</div>

            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              padding: '8px 12px',
              background: 'rgba(31,27,22,0.04)',
              border: '1px solid rgba(31,27,22,0.08)',
              borderRadius: 4,
              marginBottom: 12,
              color: 'rgba(31,27,22,0.75)',
            }}>{g.formation}</div>

            <p style={{
              margin: '0 0 14px',
              fontSize: 14.5,
              lineHeight: 1.55,
              color: '#1F1B16',
            }}>{g.explanation}</p>

            <div style={{
              fontSize: 10.5,
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              color: 'rgba(31,27,22,0.45)',
              marginBottom: 6,
            }}>From this book</div>
            {g.examples_in_book.map((ex, i) => (
              <div key={i} style={{
                padding: '10px 12px',
                background: 'rgba(74,89,168,0.05)',
                borderLeft: '2px solid #4A59A8',
                borderRadius: '0 4px 4px 0',
                marginBottom: 6,
              }}>
                <div style={{
                  fontFamily: 'Noto Serif JP, serif',
                  fontSize: 16,
                  marginBottom: 4,
                }}>{ex.snippet}</div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(31,27,22,0.6)',
                  fontStyle: 'italic',
                }}>{ex.gloss}</div>
              </div>
            ))}

            {g.see_also && g.see_also.length > 0 && (
              <div style={{
                marginTop: 12,
                fontSize: 12,
                color: 'rgba(31,27,22,0.55)',
              }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: 'rgba(31,27,22,0.4)',
                  marginRight: 6,
                }}>see also</span>
                {g.see_also.map((s, i) => (
                  <span key={i} style={{ fontFamily: 'Noto Serif JP, serif' }}>
                    {s}{i < g.see_also.length - 1 ? '、 ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  Token, Paragraph, VocabContent, BottomSheet, AnchoredPopover,
  GrammarSheetContent, JlptBadge, GrammarBadge,
});
