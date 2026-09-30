// STYLE chalkboard: a teacher's board. Green-black slate, chalk-white type, pastel chalk colours, words written on.
const BG = '#22302a', DEEP = '#101814', DISC = '#2c3d35', TEXT = '#f1efe6', MUTED = '#a9b5ad',
      THREAD = '#9be7d8', WRONG = '#ff8a80', HERO = '#f4a7b9', CARD = '#f7f5ee';
const VAR = { blue: '#8ecae6', yellow: '#ffe08a', green: '#b5e48c', gold: '#f4b183', red: '#ff8a80', purple: '#cdb4db', teal: '#9be7d8', grey: '#b8c0bb', gray: '#b8c0bb' };
const PAPER = BG, INK = DEEP, RED = WRONG, BLUE = VAR.blue, YELLOW = HERO, SHADOW = 'rgba(0,0,0,.3)';
const LOOK = { ground: 'flat', wobble: 0, boil: 0, font: '700 {s}px "Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive', labelStyle: 'pill', guideColor: MUTED,
  sans: '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive', sansWeight: 700, textIn: 'write', grain: .1,
  captionBg: 'rgba(10,18,14,.72)', captionHi: '#ffe08a' };
const STYLE = { name: 'chalkboard', mood: 'warm', world: 'board', about: 'green slate, chalk type and pastel chalk colours, words written on; a friendly lesson' };
