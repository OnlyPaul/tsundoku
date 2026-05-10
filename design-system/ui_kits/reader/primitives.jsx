// primitives.jsx — small, reusable atoms. Shares globals via window.

function MetaLabel({ children, style, as: Tag = 'span' }) {
  return <Tag className="meta" style={style}>{children}</Tag>;
}

function JlptBadge({ level }) {
  if (!level) return null;
  return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '2px 7px',
      borderRadius: 999, border: '1px solid rgba(31,27,22,0.18)',
      background: 'rgba(31,27,22,0.04)', color: '#736D66',
      textTransform: 'uppercase', letterSpacing: '0.12em',
    }}>{level}</span>
  );
}

function IconChevronLeft({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function IconSettings({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
    </svg>
  );
}
function IconX({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// Bottom sheet — phone-style. Used for vocab popup + settings.
function Sheet({ open, onClose, children, side = 'bottom' }) {
  if (!open) return null;
  const horiz = side === 'right';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(31,27,22,0.32)',
        animation: 'fade 180ms cubic-bezier(0.2,0,0,1)',
      }}/>
      <div style={{
        position: 'absolute',
        ...(horiz
          ? { right: 0, top: 0, bottom: 0, width: '50%' }
          : { left: 0, right: 0, bottom: 0, maxHeight: '85%' }),
        background: '#FBF7EE', borderTop: horiz ? 'none' : '1px solid #DDD3C2',
        borderLeft: horiz ? '1px solid #DDD3C2' : 'none',
        padding: 18, overflow: 'auto', boxSizing: 'border-box',
        animation: horiz ? 'slide-r 220ms cubic-bezier(0.2,0,0,1)' : 'slide-up 220ms cubic-bezier(0.2,0,0,1)',
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: 12, right: 12, background: 'transparent',
          border: 'none', color: '#736D66', cursor: 'pointer', padding: 4,
        }}><IconX/></button>
        {children}
      </div>
    </div>
  );
}

// Book cover — image with fallback gradient + glyph.
function BookCover({ book, width = 86 }) {
  const aspectStyle = { width, aspectRatio: '2 / 3', borderRadius: 2, overflow: 'hidden', position: 'relative',
    boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 4px 14px rgba(31,27,22,0.18), inset -2px 0 4px rgba(0,0,0,0.15)',
    flexShrink: 0 };
  if (book.cover) {
    return (
      <div style={aspectStyle}>
        <img src={book.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
      </div>
    );
  }
  const [c1, c2, c3] = book.palette;
  return (
    <div style={{ ...aspectStyle, background: `linear-gradient(165deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)` }}>
      <div style={{ position: 'absolute', top: '14%', left: 0, right: 0, textAlign: 'center',
        fontFamily: 'Noto Serif JP, serif', fontSize: width * 0.5, color: c3, opacity: 0.75, lineHeight: 1, fontWeight: 500 }}>
        {book.glyph}
      </div>
      <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8,
        fontFamily: 'Noto Serif JP, serif', fontSize: Math.max(9, width * 0.085), color: '#FBF7EE',
        lineHeight: 1.25, fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
        {book.title}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: 'linear-gradient(90deg, rgba(0,0,0,0.25), transparent)' }}/>
    </div>
  );
}

Object.assign(window, { MetaLabel, JlptBadge, IconChevronLeft, IconSettings, IconX, Sheet, BookCover });
