// VocabPopup.jsx — popover/sheet contents for a tapped vocab token.

function VocabPopup({ token, entry }) {
  if (!entry) return <p style={{ fontSize: 13, color: '#736D66' }}>No entry.</p>;
  const head = token.lemma ?? entry.lemma ?? token.s;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ margin: 0, fontFamily: 'Noto Serif JP, serif', fontSize: 24, fontWeight: 500 }}>{head}</h3>
        <JlptBadge level={entry.jlpt}/>
      </div>
      <div style={{ fontFamily: 'Noto Serif JP, serif', color: '#736D66', fontSize: 14 }}>{entry.reading}</div>
      <MetaLabel style={{ fontSize: 10 }}>{entry.pos}</MetaLabel>
      <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none',
        fontFamily: 'Source Serif 4, serif', fontSize: 14, color: '#1F1B16' }}>
        {entry.meanings.map((m) => <li key={m} style={{ margin: '2px 0' }}>{m}</li>)}
      </ul>
    </div>
  );
}

window.VocabPopup = VocabPopup;
