// TappableToken.jsx — single token. Bold + tappable when has v reference;
// otherwise dimmed (particles, inflections).

function TappableToken({ token, onTap, furigana, active }) {
  const tappable = !!token.v;
  const showRuby = furigana && token.r;

  const base = {
    color: tappable ? '#1F1B16' : 'rgba(31,27,22,0.42)',
    fontWeight: tappable ? 500 : 400,
    cursor: tappable ? 'pointer' : 'default',
    borderRadius: 3, padding: '0 1px',
    background: active ? 'rgba(74,89,168,0.12)' : 'transparent',
    boxShadow: active ? 'inset 0 -2px 0 #4A59A8' : 'none',
    transition: 'background 150ms, color 150ms',
  };
  const handle = (e) => { if (tappable) { e.stopPropagation(); onTap?.(token, e.currentTarget); } };

  if (showRuby) {
    return (
      <ruby onClick={handle} style={base}>
        <rb>{token.s}</rb>
        <rt style={{ fontFamily: 'Noto Serif JP, serif', fontSize: '0.5em', fontWeight: 400,
          color: tappable ? 'rgba(31,27,22,0.55)' : 'rgba(31,27,22,0.3)' }}>{token.r}</rt>
      </ruby>
    );
  }
  return <span onClick={handle} style={base}>{token.s}</span>;
}

window.TappableToken = TappableToken;
