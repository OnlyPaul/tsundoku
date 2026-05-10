// SentenceTranslationPanel.jsx — indigo left-rule annotation card.

function SentenceTranslationPanel({ help, grammarMap }) {
  const ids = help.grammar ?? [];
  return (
    <span style={{
      display: 'block', marginTop: 8, marginBottom: 6,
      background: '#FBF7EE', borderLeft: '2px solid #4A59A8', borderRadius: '0 4px 4px 0',
      padding: '12px 16px', fontFamily: 'Source Serif 4, serif',
      animation: 'translation-in 180ms cubic-bezier(0.2,0,0,1)',
    }}>
      <span style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
        color: 'rgba(115,109,102,0.85)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
        Translation
      </span>
      <span style={{ display: 'block', fontStyle: 'italic', color: '#1F1B16', fontSize: 14, lineHeight: 1.45 }}>
        {help.translation}
      </span>

      {help.note ? (
        <span style={{ display: 'block', marginTop: 12, paddingTop: 10, borderTop: '1px dashed #DDD3C2' }}>
          <span style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
            color: '#BC5A2C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Note</span>
          <span style={{ display: 'block', fontSize: 12.5, color: '#736D66', lineHeight: 1.5 }}>{help.note}</span>
        </span>
      ) : null}

      {ids.length > 0 ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          marginTop: 12, paddingTop: 10, borderTop: '1px dashed #DDD3C2' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
            color: 'rgba(115,109,102,0.85)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Grammar</span>
          {ids.map((id) => {
            const g = grammarMap?.[id];
            if (!g) return null;
            return (
              <span key={id} style={{
                fontFamily: 'Noto Serif JP, serif', fontSize: 13, padding: '2px 8px',
                borderRadius: 4, border: '1px solid rgba(74,89,168,0.3)',
                background: 'rgba(74,89,168,0.1)', color: '#4A59A8',
              }}>{g.pattern}</span>
            );
          })}
        </span>
      ) : null}
    </span>
  );
}

window.SentenceTranslationPanel = SentenceTranslationPanel;
