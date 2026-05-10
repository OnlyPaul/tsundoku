// Reader.jsx — reader screen.

function Reader({ book, paragraphs, vocabMap, grammarMap, prefs, onBack, onSettings }) {
  const [open, setOpen] = React.useState(null); // tapped token state
  const [openTrans, setOpenTrans] = React.useState({});

  const proseStyle = {
    fontFamily: `"${prefs.jpFont}", "Noto Serif JP", serif`,
    fontSize: prefs.fontSize, lineHeight: 1.95, color: '#1F1B16',
  };

  return (
    <div style={{ minHeight: '100%', background: '#F5EFE4', position: 'relative' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: 12,
        borderBottom: '1px solid #DDD3C2', background: 'rgba(245,239,228,0.92)',
        backdropFilter: 'blur(8px)', padding: '12px 18px',
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 4, color: '#736D66',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#BC5A2C'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#736D66'}>
          <IconChevronLeft/>
        </button>
        <div style={{ minWidth: 0, flex: 1, textAlign: 'center' }}>
          <p style={{ margin: 0, fontFamily: 'Noto Serif JP, serif', fontSize: 15, lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</p>
          <MetaLabel style={{ display: 'block', marginTop: 2, fontSize: 10 }}>
            Ch. {book.chapter.number} / {book.chapter.total}
          </MetaLabel>
        </div>
        <button onClick={onSettings} aria-label="Settings" style={{
          color: '#736D66', background: 'transparent', border: 'none', cursor: 'pointer', padding: 6,
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#BC5A2C'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#736D66'}>
          <IconSettings/>
        </button>
      </header>

      <article style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px 56px' }}>
        <div style={{ borderBottom: '1px solid #DDD3C2', paddingBottom: 18, marginBottom: 28 }}>
          <MetaLabel style={{ letterSpacing: '0.20em' }}>Chapter {book.chapter.number}</MetaLabel>
          <h2 style={{ margin: '10px 0 0', fontFamily: 'Noto Serif JP, serif', fontWeight: 500,
            fontSize: 28, lineHeight: 1.15 }}>{book.chapter.title}</h2>
        </div>

        {paragraphs.map((p) => (
          <p key={p.id} style={{ ...proseStyle, margin: '0 0 22px' }}>
            {p.sentences.map((s) => (
              <span key={s.id}>
                {s.tokens.map((t, i) => (
                  <TappableToken key={i} token={t} furigana={prefs.furigana}
                    active={open?.pid === p.id && open?.tIdx === i}
                    onTap={(token) => setOpen({ pid: p.id, tIdx: i, token })}/>
                ))}
                {s.help?.translation ? (
                  <>
                    {' '}
                    <button onClick={(e) => { e.stopPropagation();
                      setOpenTrans((m) => ({ ...m, [s.id]: !m[s.id] }));
                    }} aria-label="Show translation"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 20, height: 20, marginLeft: 4, marginRight: 2,
                        borderRadius: 3, border: '1px solid #DDD3C2', verticalAlign: 'middle',
                        background: openTrans[s.id] ? '#4A59A8' : 'rgba(31,27,22,0.04)',
                        color: openTrans[s.id] ? '#F8F4EA' : '#736D66',
                        cursor: 'pointer', padding: 0, transition: 'background 150ms, color 150ms',
                      }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" style={{
                        transform: openTrans[s.id] ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms cubic-bezier(0.2,0,0,1)' }}>
                        <path d="M3 2.5L9 6L3 9.5Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </>
                ) : null}
                {openTrans[s.id] && s.help ? (
                  <SentenceTranslationPanel help={s.help} grammarMap={grammarMap}/>
                ) : null}
              </span>
            ))}
          </p>
        ))}

        <nav style={{
          marginTop: 56, paddingTop: 18, borderTop: '1px solid #DDD3C2',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.12em', color: '#736D66',
        }}>
          <span style={{ opacity: 0.4 }}>← Previous</span>
          <span>Chapter {book.chapter.number} / {book.chapter.total}</span>
          <span style={{ cursor: 'pointer' }}>Next →</span>
        </nav>
      </article>

      {open ? (
        <Sheet open={true} onClose={() => setOpen(null)} side="bottom">
          <VocabPopup token={open.token} entry={vocabMap[open.token.v]}/>
        </Sheet>
      ) : null}
    </div>
  );
}

window.Reader = Reader;
