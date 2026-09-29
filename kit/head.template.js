// TITLE: {{TITLE}}
const PLATFORM = '{{PLATFORM}}';                                   // tiktok reels shorts instagram square linkedin youtube x (kit/kit.js PLATFORMS)
const W = {{W}}, H = {{H}}, FPS = 60, DUR = 45, FRAMES = FPS * DUR;
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
let ctx = cv.getContext('2d');

// LOOK: Kurzgesagt x 3Blue1Brown. Dark flat ground, one warm HERO, THREAD = the one shape that runs
// through the film, WRONG for errors/costs. VAR = 3b1b colours: give each quantity ONE colour and keep it
// on the symbol, the object and the word for the whole film. Retune per topic (references/style.md).
const BG = '#141c33', DEEP = '#0c1326', DISC = '#1b2747', TEXT = '#f5f0e6', MUTED = '#8d9bbd',
      THREAD = '#2ec4b6', WRONG = '#fc6255', HERO = '#f4a7b9', CARD = '#fdf6ec';
const VAR = { blue: '#58c4dd', yellow: '#f4d35e', green: '#83c167', gold: '#f0ac5f', red: '#fc6255', purple: '#9a72ac', teal: '#5cd0b3' };
const PAPER = BG, INK = DEEP, RED = WRONG, BLUE = VAR.blue, YELLOW = HERO, SHADOW = 'rgba(5,10,25,.35)';   // names the starter library uses
const LOOK = { ground: 'flat', wobble: 0, boil: 0, font: '800 {s}px "Avenir Next", "Helvetica Neue", Arial, sans-serif', labelStyle: 'pill', guideColor: MUTED };
