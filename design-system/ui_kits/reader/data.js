// data.js — sample book content for the UI kit. Drawn from the production
// sample book `nageki-no-bourei-1` so the reader feels real.

window.SAMPLE_BOOK = {
  slug: 'nageki-no-bourei-1',
  title: '嘆きの亡霊は引退したい',
  author: '槻影',
  cover: '../../assets/sample-cover-nageki.jpg',
  chapter: { id: '00', title: 'Prologue　夢とその結末', number: 1, total: 10 },
};

window.LIBRARY = [
  window.SAMPLE_BOOK,
  { slug: 'sakura', title: '桜の森の満開の下', author: '坂口安吾', palette: ['#1F2742','#3D5388','#D4D2C8'], glyph: '桜' },
  { slug: 'sangetsuki', title: '山月記', author: '中島敦', palette: ['#E5D6B5','#7A8C5C','#2F3A22'], glyph: '山' },
  { slug: 'rashomon', title: '羅生門', author: '芥川龍之介', palette: ['#F4D9DD','#C97391','#5A2A3D'], glyph: '羅' },
  { slug: 'kokoro', title: 'こころ', author: '夏目漱石', palette: ['#EADBC8','#5C7A8C','#1F2A33'], glyph: '心' },
];

// Vocab subset — keyed by id.
window.VOCAB = {
  v0001: { lemma: '全て', reading: 'すべて', pos: 'noun', jlpt: 'N3', meanings: ['all', 'everything', 'entirely'] },
  v0002: { lemma: '始まり', reading: 'はじまり', pos: 'noun', jlpt: 'N4', meanings: ['beginning', 'start', 'origin'] },
  v0003: { lemma: '忘れる', reading: 'わすれる', pos: 'verb-ichidan', jlpt: 'N5', meanings: ['to forget'] },
  v0006: { lemma: '一言', reading: 'ひとこと', pos: 'noun', jlpt: 'N3', meanings: ['single word', 'a few words'] },
  v0007: { lemma: 'トレジャーハンター', reading: 'トレジャーハンター', pos: 'noun', jlpt: '—', meanings: ['Treasure Hunter'] },
  v0008: { lemma: 'なる', reading: 'なる', pos: 'verb-godan', jlpt: 'N5', meanings: ['to become'] },
  v0025: { lemma: '世界', reading: 'せかい', pos: 'noun', jlpt: 'N5', meanings: ['world'] },
  v0036: { lemma: '最強', reading: 'さいきょう', pos: 'noun', jlpt: 'N2', meanings: ['strongest', 'most powerful'] },
  v0037: { lemma: '英雄', reading: 'えいゆう', pos: 'noun', jlpt: 'N2', meanings: ['hero'] },
};

window.GRAMMAR = {
  'g-volitional-ze': {
    pattern: '〜よう／おう＋ぜ',
    title: 'Casual masculine "let\'s…"',
    jlpt: 'N4',
    formation: '[verb volitional] + ぜ',
    explanation: 'The volitional form 〜よう／おう expresses a suggestion or intention. Adding ぜ makes it confident and assertive, with a distinctly masculine, casual register used among male friends.',
  },
};

// One short paragraph + sentence-help, taken from chapter prologue.
window.PARAGRAPHS = [
  {
    id: 'p001',
    sentences: [{
      id: 's0',
      tokens: [
        { s: '全て', r: 'すべて', v: 'v0001' }, { s: 'の' },
        { s: '始まり', r: 'はじまり', v: 'v0002' }, { s: 'は' },
        { s: '忘れ', r: 'わすれ', v: 'v0003' }, { s: 'も' },
        { s: 'し' }, { s: 'ない' },
        { s: 'あの' },
        { s: '一言', r: 'ひとこと', v: 'v0006' }, { s: '。' },
      ],
      help: { translation: "It all began with one line I'll never forget." },
    }],
  },
  {
    id: 'p002',
    sentences: [{
      id: 's0',
      tokens: [
        { s: 'トレジャーハンター', v: 'v0007' }, { s: 'に' },
        { s: 'なろう', v: 'v0008' }, { s: 'ぜ' }, { s: '。' },
      ],
      help: {
        translation: "Let's become Treasure Hunters.",
        note: 'なろう is the volitional of なる ("to become"); ぜ is a casual, assertive sentence-ending particle used mostly by men among friends.',
        grammar: ['g-volitional-ze'],
      },
    }],
  },
  {
    id: 'p003',
    sentences: [{
      id: 's0',
      tokens: [
        { s: '目指す', r: 'めざす' }, { s: 'は' }, { s: 'ただ' },
        { s: '一つ', r: 'ひとつ' }, { s: '、' },
        { s: '世界', r: 'せかい', v: 'v0025' },
        { s: '最強', r: 'さいきょう', v: 'v0036' }, { s: 'の' },
        { s: '英雄', r: 'えいゆう', v: 'v0037' }, { s: 'だ' }, { s: '。' },
      ],
      help: { translation: "What we were aiming for was just one thing — to be the world's greatest heroes." },
    }],
  },
];
