// SettingsSheet.jsx — reading prefs.

function SettingsSheet({ open, onClose, prefs, setPref }) {
  return (
    <Sheet open={open} onClose={onClose} side="bottom">
      <h3 style={{ margin: '0 0 4px', fontFamily: 'Noto Serif JP, serif', fontSize: 22, fontWeight: 500 }}>設定</h3>
      <MetaLabel style={{ display: 'block', marginBottom: 18 }}>Reading preferences</MetaLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Row label="Furigana">
          <button onClick={() => setPref('furigana', !prefs.furigana)} style={{
            border: '1px solid #DDD3C2', background: 'transparent',
            borderRadius: 4, padding: '4px 12px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer',
            color: prefs.furigana ? '#1F1B16' : '#736D66',
          }}>{prefs.furigana ? 'On' : 'Off'}</button>
        </Row>

        <Row label="Font size">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Step onClick={() => setPref('fontSize', Math.max(14, prefs.fontSize - 1))}>−</Step>
            <span style={{ width: 28, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 14 }}>{prefs.fontSize}</span>
            <Step onClick={() => setPref('fontSize', Math.min(26, prefs.fontSize + 1))}>+</Step>
          </div>
        </Row>

        <Row label="Japanese font">
          <select value={prefs.jpFont} onChange={(e) => setPref('jpFont', e.target.value)} style={{
            border: '1px solid #DDD3C2', background: '#F5EFE4', color: '#1F1B16',
            borderRadius: 4, padding: '4px 8px', fontSize: 13,
          }}>
            {['Noto Serif JP', 'Shippori Mincho', 'Klee One', 'Noto Sans JP'].map((f) =>
              <option key={f} value={f}>{f}</option>)}
          </select>
        </Row>
      </div>

      <section style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid #DDD3C2' }}>
        <MetaLabel style={{ display: 'block', marginBottom: 10 }}>About</MetaLabel>
        <Row mono label="Version"><span style={{ fontVariantNumeric: 'tabular-nums' }}>0.1.0</span></Row>
        <Row mono label="Books in library"><span style={{ fontVariantNumeric: 'tabular-nums' }}>5</span></Row>
      </section>
    </Sheet>
  );
}

function Row({ label, children, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      {mono
        ? <MetaLabel>{label}</MetaLabel>
        : <span style={{ fontSize: 14, color: '#1F1B16' }}>{label}</span>}
      {children}
    </div>
  );
}
function Step({ children, onClick }) {
  return <button onClick={onClick} style={{
    width: 28, height: 28, border: '1px solid #DDD3C2', background: 'transparent',
    borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 14,
    color: '#1F1B16', cursor: 'pointer',
  }}>{children}</button>;
}

window.SettingsSheet = SettingsSheet;
