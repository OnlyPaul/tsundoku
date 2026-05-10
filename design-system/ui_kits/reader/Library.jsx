// Library.jsx — home / library grid.

function Library({ books, onOpen, continueBook }) {
  return (
    <div style={{ minHeight: '100%', background: '#F5EFE4', paddingBottom: 40 }}>
      <header style={{ padding: '32px 24px 18px' }}>
        <MetaLabel style={{ letterSpacing: '0.20em' }}>つんどく ・ tsundoku</MetaLabel>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ margin: 0, fontFamily: 'Noto Serif JP, serif', fontWeight: 500,
            fontSize: 48, lineHeight: 1, letterSpacing: '-0.01em' }}>本棚</h1>
          <button disabled style={{
            border: '1px solid #DDD3C2', background: 'transparent',
            borderRadius: 999, padding: '6px 12px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.12em', color: '#736D66',
            opacity: 0.5, cursor: 'not-allowed',
          }}>+ Import</button>
        </div>
      </header>

      {continueBook ? (
        <section style={{ margin: '0 24px 28px' }}>
          <MetaLabel style={{ display: 'block', marginBottom: 10 }}>Continue Reading</MetaLabel>
          <button onClick={() => onOpen(continueBook)} style={{
            display: 'flex', alignItems: 'center', gap: 14, width: '100%',
            border: '1px solid #DDD3C2', background: '#FBF7EE',
            borderRadius: 6, padding: 12, textAlign: 'left', cursor: 'pointer',
            transition: 'border-color 150ms cubic-bezier(0.2,0,0,1)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(188,90,44,0.5)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#DDD3C2'}>
            <BookCover book={continueBook} width={68}/>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontFamily: 'Noto Serif JP, serif', fontSize: 16, lineHeight: 1.3 }}>{continueBook.title}</p>
              <p style={{ margin: '4px 0 0', fontFamily: 'Source Serif 4, serif', fontStyle: 'italic', color: '#736D66', fontSize: 13 }}>{continueBook.author}</p>
              <MetaLabel style={{ display: 'block', marginTop: 8 }}>Ch. {continueBook.chapter?.number ?? 1}</MetaLabel>
            </div>
          </button>
        </section>
      ) : null}

      <section style={{ padding: '0 24px' }}>
        <MetaLabel style={{ display: 'block', marginBottom: 12 }}>Library ・ {books.length} books</MetaLabel>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {books.map((b) => (
            <li key={b.slug}>
              <button onClick={() => onOpen(b)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
                width: '100%', background: 'transparent', border: 'none', padding: 0,
                textAlign: 'left', cursor: 'pointer',
              }}>
                <BookCover book={b} width="100%"/>
                <div style={{ width: '100%' }}>
                  <p style={{ margin: 0, fontFamily: 'Noto Serif JP, serif', fontSize: 13, lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.title}</p>
                  <p style={{ margin: '2px 0 0', fontFamily: 'Source Serif 4, serif', fontStyle: 'italic',
                    color: '#736D66', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.author}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

window.Library = Library;
