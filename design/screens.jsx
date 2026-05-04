// screens.jsx — Home, Reader, Settings screens. Each is parameterized by
// `mode` (phone/tablet) for layout differences.

const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

// ─────────────────────────────────────────────────────────────
// Book cover — drawn from palette + glyph, no images required
// ─────────────────────────────────────────────────────────────
function BookCover({ book, width = 120, height = 178 }) {
  const [c1, c2, c3] = book.cover.palette;
  // Width may be a number OR "100%" — use height to derive font sizes since
  // grid columns size by content + height is always numeric here.
  const numericRef = typeof width === 'number' ? width : (typeof height === 'number' ? height * 0.68 : 120);
  return (
    <div style={{
      width, height,
      position: 'relative',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 4px 14px rgba(31,27,22,0.18), inset -2px 0 4px rgba(0,0,0,0.15)',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(165deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)`,
      }} />
      {/* texture lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(95deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)',
        mixBlendMode: 'overlay',
      }} />
      {/* glyph */}
      <div style={{
        position: 'absolute',
        top: '14%',
        left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'Noto Serif JP, serif',
        fontSize: numericRef * 0.5,
        color: c3,
        opacity: 0.75,
        lineHeight: 1,
        fontWeight: 500,
      }}>{book.cover.glyph}</div>
      {/* title at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 10, left: 10, right: 10,
        fontFamily: 'Noto Serif JP, serif',
        fontSize: Math.max(10, numericRef * 0.085),
        color: '#FBF7EE',
        lineHeight: 1.25,
        fontWeight: 500,
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}>{book.title}</div>
      {/* spine shadow */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: 'linear-gradient(90deg, rgba(0,0,0,0.25), transparent)',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Home Screen
// ─────────────────────────────────────────────────────────────
function HomeScreen({ books, onOpen, mode = 'phone' }) {
  const continueBook = books.find(b => b.bookmark);
  const isPhone = mode === 'phone';

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#F5EFE4',
      overflowY: 'auto',
      fontFamily: 'Source Serif 4, Georgia, serif',
      color: '#1F1B16',
    }}>
      {/* Header */}
      <div style={{
        padding: isPhone ? '14px 22px 8px' : '32px 56px 20px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: isPhone ? 9.5 : 11,
            textTransform: 'uppercase',
            letterSpacing: 1.4,
            color: 'rgba(31,27,22,0.5)',
            marginBottom: 4,
          }}>つんどく ・ tsundoku</div>
          <h1 style={{
            margin: 0,
            fontFamily: 'Noto Serif JP, serif',
            fontSize: isPhone ? 26 : 36,
            fontWeight: 500,
            letterSpacing: -0.3,
          }}>本棚</h1>
        </div>
        <button style={{
          background: 'transparent',
          border: '1px solid rgba(31,27,22,0.18)',
          borderRadius: 999,
          padding: isPhone ? '6px 12px' : '8px 16px',
          fontSize: isPhone ? 11 : 12.5,
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          color: 'rgba(31,27,22,0.7)',
          cursor: 'pointer',
        }}>+ Import</button>
      </div>

      {/* Continue reading — large card */}
      {continueBook && (
        <div style={{ padding: isPhone ? '12px 22px 0' : '12px 56px 0' }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9.5,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: 'rgba(31,27,22,0.45)',
            marginBottom: 10,
          }}>Continue reading</div>
          <div
            onClick={() => onOpen(continueBook)}
            style={{
              display: 'flex',
              gap: isPhone ? 16 : 28,
              padding: isPhone ? '16px' : '22px 24px',
              background: '#FBF7EE',
              border: '1px solid rgba(31,27,22,0.1)',
              borderRadius: 6,
              cursor: 'pointer',
              alignItems: 'center',
            }}
          >
            <BookCover book={continueBook}
              width={isPhone ? 78 : 110}
              height={isPhone ? 116 : 164}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                margin: 0,
                fontFamily: 'Noto Serif JP, serif',
                fontSize: isPhone ? 17 : 22,
                fontWeight: 500,
                lineHeight: 1.25,
              }}>{continueBook.title}</h2>
              <div style={{
                fontSize: isPhone ? 12 : 13,
                color: 'rgba(31,27,22,0.55)',
                marginTop: 2,
                fontStyle: 'italic',
              }}>{continueBook.author}</div>
              <div style={{
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'rgba(31,27,22,0.45)',
                marginTop: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                Ch. 1 ・ ¶ 3
              </div>
              {/* progress bar */}
              <div style={{
                marginTop: 12,
                height: 2,
                background: 'rgba(31,27,22,0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${continueBook.progress * 100}%`,
                  background: 'oklch(0.55 0.12 30)',
                }} />
              </div>
              <div style={{
                marginTop: 5,
                fontSize: 10.5,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'rgba(31,27,22,0.5)',
              }}>{Math.round(continueBook.progress * 100)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Library */}
      <div style={{ padding: isPhone ? '24px 22px 32px' : '36px 56px 56px' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9.5,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: 'rgba(31,27,22,0.45)',
          }}>Library ・ {books.length} books</div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isPhone ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
          gap: isPhone ? 16 : 28,
        }}>
          {books.map((b) => (
            <div
              key={b.id}
              onClick={() => onOpen(b)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              <BookCover book={b}
                width="100%"
                height={isPhone ? 142 : 230}
              />
              <div style={{
                marginTop: 8,
                fontFamily: 'Noto Serif JP, serif',
                fontSize: isPhone ? 12.5 : 14,
                fontWeight: 500,
                lineHeight: 1.3,
                color: '#1F1B16',
              }}>{b.title}</div>
              <div style={{
                marginTop: 1,
                fontSize: isPhone ? 10.5 : 11.5,
                color: 'rgba(31,27,22,0.5)',
                fontStyle: 'italic',
              }}>{b.author}</div>
              {b.progress > 0 && (
                <div style={{
                  marginTop: 6,
                  fontSize: 9.5,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'rgba(31,27,22,0.45)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>{Math.round(b.progress * 100)}% read</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Reader Screen
// ─────────────────────────────────────────────────────────────
function ReaderScreen({
  book, chapter, onBack, onSettings,
  furigana, fontSize, lineHeight, jpFont,
  vocabMap, kanjiMap, grammarMap,
  mode = 'phone',
  initialBookmark,
}) {
  const isPhone = mode === 'phone';
  const [popup, setPopup] = useS(null); // { token, anchorRect } or null
  const [grammarOpen, setGrammarOpen] = useS(null); // patternIds[] or null
  const [activeTokenIdx, setActiveTokenIdx] = useS({ pid: null, idx: null });
  const containerRef = useR(null);
  const scrollRef = useR(null);

  const currentParagraph = (initialBookmark && initialBookmark.paragraph) || 'p003';

  const handleTap = (token, el, idx) => {
    if (!token.v) return;
    const pid = el.closest('[data-pid]')?.dataset.pid;
    setActiveTokenIdx({ pid, idx });
    if (isPhone) {
      setPopup({ token });
    } else {
      const anchorRect = el.getBoundingClientRect();
      setPopup({ token, anchorRect });
    }
  };

  const closePopup = () => {
    setPopup(null);
    setActiveTokenIdx({ pid: null, idx: null });
  };

  const containerRect = containerRef.current?.getBoundingClientRect();
  const vocab = popup ? vocabMap[popup.token.v] : null;

  return (
    <div ref={containerRef} style={{
      width: '100%', height: '100%',
      background: '#F5EFE4',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        flexShrink: 0,
        padding: isPhone ? '8px 16px 10px' : '20px 56px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(31,27,22,0.06)',
        background: '#F5EFE4',
        zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 6, marginLeft: -6,
          color: 'rgba(31,27,22,0.7)',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'Source Serif 4, Georgia, serif',
          fontSize: 14,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isPhone && 'Library'}
        </button>
        <div style={{ textAlign: 'center', flex: 1, minWidth: 0, padding: '0 12px' }}>
          <div style={{
            fontFamily: 'Noto Serif JP, serif',
            fontSize: isPhone ? 13 : 15,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{book.title}</div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'rgba(31,27,22,0.45)',
            marginTop: 1,
          }}>Ch. 1 ・ p. 3 of 18</div>
        </div>
        <button onClick={onSettings} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 6, marginRight: -6,
          color: 'rgba(31,27,22,0.7)',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9 1.5v2M9 14.5v2M16.5 9h-2M3.5 9h-2M14.3 14.3l-1.4-1.4M5.1 5.1L3.7 3.7M14.3 3.7l-1.4 1.4M5.1 12.9l-1.4 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Reader scroll area */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: isPhone ? '24px 30px 80px' : '40px 96px 100px',
      }}>
        {/* Chapter title */}
        <div style={{
          marginBottom: isPhone ? 28 : 40,
          paddingBottom: isPhone ? 18 : 24,
          borderBottom: '1px solid rgba(31,27,22,0.12)',
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: 'rgba(31,27,22,0.45)',
            marginBottom: 8,
          }}>Chapter 1</div>
          <h1 style={{
            margin: 0,
            fontFamily: 'Noto Serif JP, serif',
            fontSize: isPhone ? 22 : 28,
            fontWeight: 500,
            letterSpacing: -0.2,
          }}>{chapter.title}</h1>
        </div>

        {/* Paragraphs */}
        <div style={{ paddingLeft: isPhone ? 8 : 18 }}>
          {chapter.paragraphs.map((p) => (
            <Paragraph
              key={p.id}
              para={p}
              furigana={furigana}
              fontSize={fontSize}
              lineHeight={lineHeight}
              jpFont={jpFont}
              isCurrent={p.id === currentParagraph}
              activeTokenIdx={activeTokenIdx.pid === p.id ? activeTokenIdx.idx : null}
              onTokenTap={handleTap}
              onGrammar={(ids) => setGrammarOpen(ids)}
            />
          ))}
        </div>

        {/* Chapter end footer */}
        <div style={{
          marginTop: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 20,
          borderTop: '1px solid rgba(31,27,22,0.1)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          color: 'rgba(31,27,22,0.5)',
        }}>
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 0, color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', textTransform: 'inherit', letterSpacing: 'inherit',
          }}>← Prev</button>
          <span>Chapter 1 / 4</span>
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 0, color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', textTransform: 'inherit', letterSpacing: 'inherit',
          }}>Next →</button>
        </div>
      </div>

      {/* Vocab popup — phone uses sheet, tablet uses popover */}
      {isPhone ? (
        <BottomSheet open={!!popup} onClose={closePopup}>
          {popup && <VocabContent token={popup.token} vocab={vocab} kanjiMap={kanjiMap} compact />}
        </BottomSheet>
      ) : (
        <AnchoredPopover
          open={!!popup}
          anchorRect={popup?.anchorRect}
          containerRect={containerRect}
          onClose={closePopup}
        >
          {popup && <VocabContent token={popup.token} vocab={vocab} kanjiMap={kanjiMap} />}
        </AnchoredPopover>
      )}

      {/* Grammar sheet */}
      <BottomSheet open={!!grammarOpen} onClose={() => setGrammarOpen(null)}>
        {grammarOpen && <GrammarSheetContent patternIds={grammarOpen} grammarMap={grammarMap} />}
      </BottomSheet>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Settings Screen (phone-only sheet style)
// ─────────────────────────────────────────────────────────────
function SettingsScreen({ onClose, tweaks, setTweak, mode = 'phone' }) {
  const isPhone = mode === 'phone';
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#F5EFE4',
      fontFamily: 'Source Serif 4, Georgia, serif',
      color: '#1F1B16',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        flexShrink: 0,
        padding: isPhone ? '12px 16px' : '20px 56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(31,27,22,0.08)',
      }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'Source Serif 4, Georgia, serif', fontSize: 14,
          color: 'rgba(31,27,22,0.7)', padding: 0,
        }}>Done</button>
        <div style={{ fontFamily: 'Noto Serif JP, serif', fontSize: 14, fontWeight: 500 }}>設定</div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: isPhone ? '20px 16px' : '32px 56px' }}>
        {/* Reading section */}
        <SettingsSection title="Reading">
          <SettingsRow label="Furigana"
            value={tweaks.furigana ? 'On' : 'Off'}
            control={
              <Toggle on={tweaks.furigana} onChange={(v) => setTweak('furigana', v)} />
            }
          />
          <SettingsRow label="Font size"
            value={`${tweaks.fontSize}px`}
            control={
              <div style={{ display: 'flex', gap: 8 }}>
                <StepBtn onClick={() => setTweak('fontSize', Math.max(14, tweaks.fontSize - 1))}>−</StepBtn>
                <StepBtn onClick={() => setTweak('fontSize', Math.min(28, tweaks.fontSize + 1))}>+</StepBtn>
              </div>
            }
          />
          <SettingsRow label="Japanese font"
            control={
              <select
                value={tweaks.jpFont}
                onChange={(e) => setTweak('jpFont', e.target.value)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(31,27,22,0.18)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontFamily: 'Source Serif 4, Georgia, serif',
                  fontSize: 13,
                  color: '#1F1B16',
                }}
              >
                <option value="Noto Serif JP">Noto Serif JP</option>
                <option value="Shippori Mincho">Shippori Mincho</option>
                <option value="Klee One">Klee One</option>
                <option value="Noto Sans JP">Noto Sans JP</option>
              </select>
            }
          />
        </SettingsSection>

        {/* Preview */}
        <div style={{ marginTop: 28 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9.5,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: 'rgba(31,27,22,0.45)',
            marginBottom: 8,
          }}>Preview</div>
          <div style={{
            padding: '18px 20px',
            background: '#FBF7EE',
            border: '1px solid rgba(31,27,22,0.1)',
            borderRadius: 4,
            fontFamily: `${tweaks.jpFont}, "Noto Serif JP", serif`,
            fontSize: tweaks.fontSize,
            lineHeight: 1.85,
            color: '#1F1B16',
          }}>
            {tweaks.furigana ? (
              <span>
                <ruby>放課後<rt style={{ fontSize: '0.48em', color: 'rgba(31,27,22,0.55)' }}>ほうかご</rt></ruby>
                <span>の</span>
                <ruby>教室<rt style={{ fontSize: '0.48em', color: 'rgba(31,27,22,0.55)' }}>きょうしつ</rt></ruby>
                <span>は、</span>
                <ruby>窓<rt style={{ fontSize: '0.48em', color: 'rgba(31,27,22,0.55)' }}>まど</rt></ruby>
                <span>から</span>
                <ruby>夕陽<rt style={{ fontSize: '0.48em', color: 'rgba(31,27,22,0.55)' }}>ゆうひ</rt></ruby>
                <span>が差し込んでいた。</span>
              </span>
            ) : (
              <span>放課後の教室は、窓から夕陽が差し込んでいた。</span>
            )}
          </div>
        </div>

        <SettingsSection title="About" style={{ marginTop: 32 }}>
          <SettingsRow label="Version" value="0.1.0 · prototype" />
          <SettingsRow label="Books in library" value="3" />
          <SettingsRow label="Storage used" value="2.4 MB" />
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, children, style }) {
  return (
    <div style={style}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9.5,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: 'rgba(31,27,22,0.45)',
        marginBottom: 8,
      }}>{title}</div>
      <div style={{
        background: '#FBF7EE',
        border: '1px solid rgba(31,27,22,0.1)',
        borderRadius: 6,
        overflow: 'hidden',
      }}>{children}</div>
    </div>
  );
}

function SettingsRow({ label, value, control }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      borderTop: '1px solid rgba(31,27,22,0.08)',
      gap: 12,
    }} className="settings-row">
      <div style={{ fontSize: 14 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {value && <span style={{
          fontSize: 12.5,
          color: 'rgba(31,27,22,0.55)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>{value}</span>}
        {control}
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 24, borderRadius: 999,
        background: on ? 'oklch(0.55 0.12 30)' : 'rgba(31,27,22,0.18)',
        border: 'none', cursor: 'pointer',
        position: 'relative', padding: 0,
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2, left: on ? 18 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: '#FBF7EE',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

function StepBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 28, height: 28,
      borderRadius: 4,
      border: '1px solid rgba(31,27,22,0.18)',
      background: '#FBF7EE',
      cursor: 'pointer',
      fontSize: 14,
      color: '#1F1B16',
      padding: 0,
      lineHeight: 1,
    }}>{children}</button>
  );
}

// First-line-of-row separator removal for the first child
const _styles = document.createElement('style');
_styles.textContent = `.settings-row:first-child { border-top: none !important; }`;
document.head.appendChild(_styles);

Object.assign(window, { HomeScreen, ReaderScreen, SettingsScreen, BookCover });
