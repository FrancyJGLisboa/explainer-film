// TITLE: {{TITLE}}
const PLATFORM = '{{PLATFORM}}';                                   // tiktok reels shorts instagram square linkedin youtube x (kit/kit.js PLATFORMS)
const W = {{W}}, H = {{H}}, FPS = 60, DUR = {{DUR}}, FRAMES = Math.round(FPS * DUR);   // DUR = beats x 60 / BPM (the style's tempo)
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
let ctx = cv.getContext('2d');

{{STYLE}}
