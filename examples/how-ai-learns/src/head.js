const W = 1920, H = 1080, FPS = 60, DUR = 45, FRAMES = FPS * DUR;
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
let ctx = cv.getContext('2d');

// LOOK for this piece: a friendly explainer for anyone, "how AI learns".
// Kurzgesagt-style flat vector: deep-navy night, one warm hero (Bit, yellow), teal = learning,
// coral = wrong. No outlines on masses, soft offset shadows, clean geometry (no wobble).
// Anti-"AI-video" rules: nothing in the corners, no gradient ground, words spring in and slide out.
const NIGHT = '#16223f', DEEP = '#0f1a30', DISC = '#1c2b4f', TEAL = '#2ec4b6', CORAL = '#ff6b6b',
      SUN = '#ffc857', SUN_D = '#f0ad3a', CREAM = '#f7f1e3', MUTED = '#8c9cc0', CARD = '#fdf6ec';
const PAPER = NIGHT, INK = DEEP, RED = CORAL, BLUE = TEAL, YELLOW = SUN, SHADOW = 'rgba(5,10,25,.35)';   // names the library uses
const LOOK = {
  ground: 'flat',
  wobble: 0,
  boil: 0,
  font: '800 {s}px "Avenir Next", "Helvetica Neue", Arial, sans-serif',
  labelStyle: 'pill',
  guideColor: MUTED,
};
