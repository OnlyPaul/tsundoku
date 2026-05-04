// data.jsx — Sample book data: a slice-of-life school novel chapter,
// modeled exactly on the JSONL schema described in the PRD but materialized
// as JS objects for the prototype.

// ─────────────────────────────────────────────────────────────
// Vocabulary (per-book ledger). id -> entry
// ─────────────────────────────────────────────────────────────
const VOCAB = {
  v0001: { lemma: '放課後', reading: 'ほうかご', pos: 'noun', jlpt: 'N3', meanings: ['after school'], frequency: 4, first_seen: 'p001' },
  v0002: { lemma: '教室', reading: 'きょうしつ', pos: 'noun', jlpt: 'N5', meanings: ['classroom'], frequency: 6, first_seen: 'p001' },
  v0003: { lemma: '窓', reading: 'まど', pos: 'noun', jlpt: 'N5', meanings: ['window'], frequency: 3, first_seen: 'p001' },
  v0004: { lemma: '夕陽', reading: 'ゆうひ', pos: 'noun', jlpt: 'N3', meanings: ['evening sun', 'setting sun'], frequency: 2, first_seen: 'p001' },
  v0005: { lemma: '差し込む', reading: 'さしこむ', pos: 'verb', jlpt: 'N2', meanings: ['to stream in (light)', 'to insert'], frequency: 1, first_seen: 'p001' },
  v0006: { lemma: '机', reading: 'つくえ', pos: 'noun', jlpt: 'N5', meanings: ['desk'], frequency: 5, first_seen: 'p002' },
  v0007: { lemma: '橙色', reading: 'だいだいいろ', pos: 'noun', jlpt: 'N2', meanings: ['orange (color)'], frequency: 1, first_seen: 'p002' },
  v0008: { lemma: '染める', reading: 'そめる', pos: 'verb', jlpt: 'N3', meanings: ['to dye', 'to color'], frequency: 2, first_seen: 'p002' },
  v0009: { lemma: '彼女', reading: 'かのじょ', pos: 'pronoun', jlpt: 'N5', meanings: ['she', 'girlfriend'], frequency: 9, first_seen: 'p003' },
  v0010: { lemma: '一人', reading: 'ひとり', pos: 'noun', jlpt: 'N5', meanings: ['one person', 'alone'], frequency: 4, first_seen: 'p003' },
  v0011: { lemma: '本', reading: 'ほん', pos: 'noun', jlpt: 'N5', meanings: ['book'], frequency: 7, first_seen: 'p003' },
  v0012: { lemma: '読む', reading: 'よむ', pos: 'verb', jlpt: 'N5', meanings: ['to read'], frequency: 5, first_seen: 'p003' },
  v0013: { lemma: '声', reading: 'こえ', pos: 'noun', jlpt: 'N5', meanings: ['voice'], frequency: 3, first_seen: 'p004' },
  v0014: { lemma: '掛ける', reading: 'かける', pos: 'verb', jlpt: 'N4', meanings: ['to call out', 'to hang', 'to put on'], frequency: 2, first_seen: 'p004' },
  v0015: { lemma: '勇気', reading: 'ゆうき', pos: 'noun', jlpt: 'N3', meanings: ['courage'], frequency: 1, first_seen: 'p004' },
  v0016: { lemma: '出る', reading: 'でる', pos: 'verb', jlpt: 'N5', meanings: ['to come out', 'to leave'], frequency: 4, first_seen: 'p004' },
  v0017: { lemma: '隣', reading: 'となり', pos: 'noun', jlpt: 'N4', meanings: ['next to', 'neighbor'], frequency: 3, first_seen: 'p005' },
  v0018: { lemma: '座る', reading: 'すわる', pos: 'verb', jlpt: 'N5', meanings: ['to sit'], frequency: 2, first_seen: 'p005' },
  v0019: { lemma: '何', reading: 'なに', pos: 'pronoun', jlpt: 'N5', meanings: ['what'], frequency: 4, first_seen: 'p005' },
  v0020: { lemma: '物語', reading: 'ものがたり', pos: 'noun', jlpt: 'N3', meanings: ['story', 'tale'], frequency: 2, first_seen: 'p005' },
  v0021: { lemma: '少し', reading: 'すこし', pos: 'adverb', jlpt: 'N5', meanings: ['a little', 'slightly'], frequency: 3, first_seen: 'p006' },
  v0022: { lemma: '驚く', reading: 'おどろく', pos: 'verb', jlpt: 'N4', meanings: ['to be surprised'], frequency: 2, first_seen: 'p006' },
  v0023: { lemma: '顔', reading: 'かお', pos: 'noun', jlpt: 'N5', meanings: ['face'], frequency: 4, first_seen: 'p006' },
  v0024: { lemma: '上げる', reading: 'あげる', pos: 'verb', jlpt: 'N5', meanings: ['to raise', 'to give'], frequency: 3, first_seen: 'p006' },
  v0025: { lemma: '微笑む', reading: 'ほほえむ', pos: 'verb', jlpt: 'N2', meanings: ['to smile'], frequency: 1, first_seen: 'p006' },
};

// ─────────────────────────────────────────────────────────────
// Kanji (per-book). char -> entry
// ─────────────────────────────────────────────────────────────
const KANJI = {
  '放': { onyomi: ['ホウ'], kunyomi: ['はな.す', 'はな.つ'], meanings: ['set free', 'release'], jlpt: 'N3', stroke_count: 8, frequency: 3 },
  '課': { onyomi: ['カ'], kunyomi: [], meanings: ['lesson', 'section'], jlpt: 'N3', stroke_count: 15, frequency: 1 },
  '後': { onyomi: ['ゴ', 'コウ'], kunyomi: ['のち', 'うし.ろ', 'あと'], meanings: ['behind', 'back', 'later'], jlpt: 'N5', stroke_count: 9, frequency: 5 },
  '教': { onyomi: ['キョウ'], kunyomi: ['おし.える', 'おそ.わる'], meanings: ['teach', 'faith'], jlpt: 'N5', stroke_count: 11, frequency: 4 },
  '室': { onyomi: ['シツ'], kunyomi: ['むろ'], meanings: ['room', 'cellar'], jlpt: 'N4', stroke_count: 9, frequency: 3 },
  '窓': { onyomi: ['ソウ'], kunyomi: ['まど'], meanings: ['window'], jlpt: 'N3', stroke_count: 11, frequency: 2 },
  '夕': { onyomi: ['セキ'], kunyomi: ['ゆう'], meanings: ['evening'], jlpt: 'N3', stroke_count: 3, frequency: 2 },
  '陽': { onyomi: ['ヨウ'], kunyomi: ['ひ'], meanings: ['sunshine', 'positive'], jlpt: 'N3', stroke_count: 12, frequency: 2 },
  '差': { onyomi: ['サ'], kunyomi: ['さ.す'], meanings: ['distinction', 'shine'], jlpt: 'N3', stroke_count: 10, frequency: 1 },
  '込': { onyomi: [], kunyomi: ['こ.む', 'こ.める'], meanings: ['crowded', 'mingle'], jlpt: 'N3', stroke_count: 5, frequency: 2 },
  '机': { onyomi: ['キ'], kunyomi: ['つくえ'], meanings: ['desk'], jlpt: 'N5', stroke_count: 6, frequency: 4 },
  '橙': { onyomi: ['トウ'], kunyomi: ['だいだい'], meanings: ['orange (fruit)'], jlpt: '—', stroke_count: 16, frequency: 1 },
  '色': { onyomi: ['ショク', 'シキ'], kunyomi: ['いろ'], meanings: ['color'], jlpt: 'N5', stroke_count: 6, frequency: 3 },
  '染': { onyomi: ['セン'], kunyomi: ['そ.める', 'し.みる'], meanings: ['dye', 'color'], jlpt: 'N3', stroke_count: 9, frequency: 1 },
  '彼': { onyomi: ['ヒ'], kunyomi: ['かれ', 'かの'], meanings: ['he', 'that'], jlpt: 'N4', stroke_count: 8, frequency: 6 },
  '女': { onyomi: ['ジョ', 'ニョ'], kunyomi: ['おんな', 'め'], meanings: ['woman', 'female'], jlpt: 'N5', stroke_count: 3, frequency: 7 },
  '一': { onyomi: ['イチ', 'イツ'], kunyomi: ['ひと.つ'], meanings: ['one'], jlpt: 'N5', stroke_count: 1, frequency: 8 },
  '人': { onyomi: ['ジン', 'ニン'], kunyomi: ['ひと'], meanings: ['person'], jlpt: 'N5', stroke_count: 2, frequency: 9 },
  '本': { onyomi: ['ホン'], kunyomi: ['もと'], meanings: ['book', 'origin', 'main'], jlpt: 'N5', stroke_count: 5, frequency: 6 },
  '読': { onyomi: ['ドク', 'トク'], kunyomi: ['よ.む'], meanings: ['read'], jlpt: 'N5', stroke_count: 14, frequency: 4 },
  '声': { onyomi: ['セイ'], kunyomi: ['こえ'], meanings: ['voice'], jlpt: 'N4', stroke_count: 7, frequency: 3 },
  '掛': { onyomi: ['カイ'], kunyomi: ['か.ける', 'か.かる'], meanings: ['hang', 'suspend'], jlpt: 'N2', stroke_count: 11, frequency: 1 },
  '勇': { onyomi: ['ユウ'], kunyomi: ['いさ.む'], meanings: ['courage', 'bravery'], jlpt: 'N3', stroke_count: 9, frequency: 1 },
  '気': { onyomi: ['キ', 'ケ'], kunyomi: [], meanings: ['spirit', 'mind', 'air'], jlpt: 'N5', stroke_count: 6, frequency: 5 },
  '出': { onyomi: ['シュツ'], kunyomi: ['で.る', 'だ.す'], meanings: ['exit', 'leave', 'put out'], jlpt: 'N5', stroke_count: 5, frequency: 5 },
  '隣': { onyomi: ['リン'], kunyomi: ['とな.り'], meanings: ['neighbor', 'next to'], jlpt: 'N3', stroke_count: 16, frequency: 2 },
  '座': { onyomi: ['ザ'], kunyomi: ['すわ.る'], meanings: ['sit', 'seat'], jlpt: 'N3', stroke_count: 10, frequency: 2 },
  '何': { onyomi: ['カ'], kunyomi: ['なに', 'なん'], meanings: ['what'], jlpt: 'N5', stroke_count: 7, frequency: 4 },
  '物': { onyomi: ['ブツ', 'モツ'], kunyomi: ['もの'], meanings: ['thing', 'object'], jlpt: 'N4', stroke_count: 8, frequency: 3 },
  '語': { onyomi: ['ゴ'], kunyomi: ['かた.る'], meanings: ['word', 'speech', 'language'], jlpt: 'N5', stroke_count: 14, frequency: 3 },
  '少': { onyomi: ['ショウ'], kunyomi: ['すく.ない', 'すこ.し'], meanings: ['few', 'little'], jlpt: 'N5', stroke_count: 4, frequency: 3 },
  '驚': { onyomi: ['キョウ'], kunyomi: ['おどろ.く'], meanings: ['surprise', 'astonish'], jlpt: 'N2', stroke_count: 22, frequency: 1 },
  '顔': { onyomi: ['ガン'], kunyomi: ['かお'], meanings: ['face', 'expression'], jlpt: 'N4', stroke_count: 18, frequency: 3 },
  '上': { onyomi: ['ジョウ'], kunyomi: ['うえ', 'あ.げる', 'のぼ.る'], meanings: ['up', 'above', 'raise'], jlpt: 'N5', stroke_count: 3, frequency: 5 },
  '微': { onyomi: ['ビ'], kunyomi: [], meanings: ['delicate', 'minute'], jlpt: 'N2', stroke_count: 13, frequency: 1 },
  '笑': { onyomi: ['ショウ'], kunyomi: ['わら.う', 'え.む'], meanings: ['laugh', 'smile'], jlpt: 'N3', stroke_count: 10, frequency: 2 },
};

// ─────────────────────────────────────────────────────────────
// Grammar (per-book). Each pattern has examples found in the book.
// ─────────────────────────────────────────────────────────────
const GRAMMAR = {
  g001: {
    pattern: '〜ていた',
    title: 'Past continuous / habitual past',
    jlpt: 'N4',
    formation: 'V[て-form] + いた',
    explanation:
      'Describes an action that was ongoing in the past, or a state that had been maintained up to a reference point. Common in narration to set the scene.',
    examples_in_book: [
      { paragraph: 'p003', snippet: '一人で本を読んでいた', gloss: 'was reading a book alone' },
    ],
    see_also: ['〜ている'],
  },
  g002: {
    pattern: '〜ようとする',
    title: 'About to / try to do',
    jlpt: 'N3',
    formation: 'V[volitional] + とする',
    explanation:
      'Indicates that the speaker is on the verge of doing something, or making an effort to do it. Often used right before the action begins.',
    examples_in_book: [
      { paragraph: 'p004', snippet: '声を掛けようとした', gloss: 'tried to call out / was about to call out' },
    ],
    see_also: ['〜つもり'],
  },
  g003: {
    pattern: '〜てくれる',
    title: 'Someone does (something) for me',
    jlpt: 'N4',
    formation: 'V[て-form] + くれる',
    explanation:
      'Marks an action done by someone else as a favor toward the speaker (or the speaker\'s in-group). Carries warmth and gratitude.',
    examples_in_book: [
      { paragraph: 'p006', snippet: '微笑んでくれた', gloss: 'smiled (for me)' },
    ],
    see_also: ['〜てもらう', '〜てあげる'],
  },
};

// ─────────────────────────────────────────────────────────────
// Tokens helper. T(s, r, v, lemma)
// ─────────────────────────────────────────────────────────────
const T = (s, r = null, v = null, lemma = null) => {
  const o = { s };
  if (r) o.r = r;
  if (v) o.v = v;
  if (lemma) o.lemma = lemma;
  return o;
};

// ─────────────────────────────────────────────────────────────
// Sample chapter — one paragraph per top-level entry.
// ─────────────────────────────────────────────────────────────
const CHAPTER_1 = {
  id: 'ch01',
  title: '第一章 ・ 放課後の図書室',
  paragraphs: [
    {
      id: 'p001',
      tokens: [
        T('放課後', 'ほうかご', 'v0001'),
        T('の'),
        T('教室', 'きょうしつ', 'v0002'),
        T('は'),
        T('、'),
        T('窓', 'まど', 'v0003'),
        T('から'),
        T('夕陽', 'ゆうひ', 'v0004'),
        T('が'),
        T('差し込ん', 'さしこん', 'v0005', '差し込む'),
        T('で'),
        T('い'),
        T('た'),
        T('。'),
      ],
    },
    {
      id: 'p002',
      tokens: [
        T('机', 'つくえ', 'v0006'),
        T('も'),
        T('床', 'ゆか'),
        T('も'),
        T('、'),
        T('全部', 'ぜんぶ'),
        T('が'),
        T('橙色', 'だいだいいろ', 'v0007'),
        T('に'),
        T('染まっ', 'そまっ', 'v0008', '染める'),
        T('て'),
        T('い'),
        T('る'),
        T('。'),
      ],
    },
    {
      id: 'p003',
      grammar: ['g001'],
      tokens: [
        T('彼女', 'かのじょ', 'v0009'),
        T('は'),
        T('一人', 'ひとり', 'v0010'),
        T('で'),
        T('本', 'ほん', 'v0011'),
        T('を'),
        T('読ん', 'よん', 'v0012', '読む'),
        T('で'),
        T('い'),
        T('た'),
        T('。'),
      ],
    },
    {
      id: 'p004',
      grammar: ['g002'],
      tokens: [
        T('声', 'こえ', 'v0013'),
        T('を'),
        T('掛けよう', 'かけよう', 'v0014', '掛ける'),
        T('と'),
        T('し'),
        T('た'),
        T('が'),
        T('、'),
        T('勇気', 'ゆうき', 'v0015'),
        T('が'),
        T('出', 'で', 'v0016', '出る'),
        T('なかっ'),
        T('た'),
        T('。'),
      ],
    },
    {
      id: 'p005',
      tokens: [
        T('それ'),
        T('でも'),
        T('、'),
        T('僕', 'ぼく'),
        T('は'),
        T('彼女', 'かのじょ', 'v0009'),
        T('の'),
        T('隣', 'となり', 'v0017'),
        T('に'),
        T('座っ', 'すわっ', 'v0018', '座る'),
        T('て'),
        T('、'),
        T('「'),
        T('何', 'なに', 'v0019'),
        T('の'),
        T('物語', 'ものがたり', 'v0020'),
        T('?'),
        T('」'),
        T('と'),
        T('聞い', 'きい'),
        T('た'),
        T('。'),
      ],
    },
    {
      id: 'p006',
      grammar: ['g003'],
      tokens: [
        T('彼女', 'かのじょ', 'v0009'),
        T('は'),
        T('少し', 'すこし', 'v0021'),
        T('驚い', 'おどろい', 'v0022', '驚く'),
        T('た'),
        T('顔', 'かお', 'v0023'),
        T('を'),
        T('上げ', 'あげ', 'v0024', '上げる'),
        T('て'),
        T('、'),
        T('そして'),
        T('微笑ん', 'ほほえん', 'v0025', '微笑む'),
        T('で'),
        T('くれ'),
        T('た'),
        T('。'),
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Library — three books. Only the first has a real chapter loaded.
// ─────────────────────────────────────────────────────────────
const BOOKS = [
  {
    id: 'yuugure',
    title: '夕暮れの図書室',
    title_romaji: 'Yūgure no Toshoshitsu',
    title_en: 'The Library at Dusk',
    author: '北原 詩織',
    author_en: 'Kitahara Shiori',
    cover: { palette: ['#E8C9A1', '#B96B4B', '#3F2A1E'], glyph: '夕' },
    chapters: [
      { id: 'ch01', title: '第一章 ・ 放課後の図書室', pages: 18 },
      { id: 'ch02', title: '第二章 ・ 雨の日の約束', pages: 22 },
      { id: 'ch03', title: '第三章 ・ 文化祭の前夜', pages: 31 },
      { id: 'ch04', title: '第四章 ・ 二人の帰り道', pages: 24 },
    ],
    progress: 0.18,
    bookmark: { chapter: 'ch01', paragraph: 'p003' },
    chapter_data: { ch01: CHAPTER_1 },
  },
  {
    id: 'tsukiakari',
    title: '月明かりの坂道',
    title_romaji: 'Tsukiakari no Sakamichi',
    title_en: 'The Moonlit Slope',
    author: '森田 涼',
    author_en: 'Morita Ryō',
    cover: { palette: ['#1F2742', '#3D5388', '#D4D2C8'], glyph: '月' },
    chapters: [
      { id: 'ch01', title: '第一章', pages: 20 },
      { id: 'ch02', title: '第二章', pages: 26 },
    ],
    progress: 0.04,
    bookmark: null,
  },
  {
    id: 'haru',
    title: '春が来る前に',
    title_romaji: 'Haru ga Kuru Mae ni',
    title_en: 'Before Spring Arrives',
    author: '青山 ひかる',
    author_en: 'Aoyama Hikaru',
    cover: { palette: ['#F4D9DD', '#C97391', '#5A2A3D'], glyph: '春' },
    chapters: [
      { id: 'ch01', title: '第一章', pages: 16 },
    ],
    progress: 0,
    bookmark: null,
  },
];

Object.assign(window, { VOCAB, KANJI, GRAMMAR, BOOKS, CHAPTER_1 });
