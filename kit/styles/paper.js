// STYLE paper: a printed-explainer look. Warm cream paper, dark ink, a book serif, words written on left to right.
// Colours are deep inks (they must read at 4.5:1 on cream); one colour per quantity, as always.
const BG = '#f3ecdf', DEEP = '#1f2430', DISC = '#e7dcc8', TEXT = '#1f2430', MUTED = '#6b6558',
      THREAD = '#0f7d6f', WRONG = '#b3261e', HERO = '#e58fa6', CARD = '#fffaf0';
const VAR = { blue: '#1f5f8b', yellow: '#8a5d00', green: '#2f6f2f', gold: '#a0520f', red: '#b3261e', purple: '#5e3f86', teal: '#0f6f63', grey: '#5f6368', gray: '#5f6368' };
const PAPER = BG, INK = DEEP, RED = WRONG, BLUE = VAR.blue, YELLOW = HERO, SHADOW = 'rgba(60,40,10,.18)';
const LOOK = { ground: 'flat', wobble: 0, boil: 0, font: '700 {s}px "Iowan Old Style", Palatino, Georgia, serif', labelStyle: 'pill', guideColor: MUTED,
  sans: '"Iowan Old Style", Palatino, Georgia, serif', sansWeight: 700, textIn: 'write', grain: .05,
  captionBg: 'rgba(255,251,242,.92)', captionFg: '#1f2430', captionHi: '#a0520f', markShadow: 'rgba(255,255,255,.7)' };
const STYLE = { name: 'paper', mood: 'calm', world: 'paper', about: 'cream paper, ink colours, book serif, words written on; calm and trustworthy' };
