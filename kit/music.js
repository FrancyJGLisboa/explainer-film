// ================= explainer-film music: moods, extra patterns, an arc that builds =================
// The base synth is the soundtrack skill's buildGroove (kits, harmonies, drum and bass layers). This file adds:
//   MOODS         named presets: instrument kit, chords, key, tempo, and which patterns play
//   musicArc()    SECTIONS for a whole film from a mood: layers enter one or two per bar, a peak, a settle
//   extra layers  'arp' 'pulse' 'shuffle' 'bell' 'strum', rendered here on the same clock as buildGroove
// A style pack (kit/styles/*.js) names its default mood; any film may pick another. Two films in a row
// may not share the same music: film.sh check compares with the last rendered film.

const MOODS = {
  curious: { kit: 'percussion', harmony: 'bright', key: 2, bpm: 96, mel: 'pluck', hat: 'hat8', kick: 'kick2', bass: 'bassHalf', peak: ['kick4', 'clap'], feel: 'light, inquisitive (marimba)' },
  calm:    { kit: 'keys', harmony: 'dreamy', key: 0, bpm: 84, mel: 'bell', hat: 'hat8', kick: 'kick2', bass: 'bassHalf', peak: ['pluck'], feel: 'soft, reflective (electric piano, strings, bells)' },
  warm:    { kit: 'acoustic', harmony: 'folk', key: 0, bpm: 92, mel: 'strum', hat: 'shuffle', kick: 'kick2', bass: 'bassHalf', peak: ['pluck', 'clap'], feel: 'human, handmade (nylon strum, swung shaker)' },
  drive:   { kit: 'electro', harmony: 'wistful', key: 2, bpm: 112, mel: 'arp', hat: 'hat16', kick: 'kick2', bass: 'bass8', peak: ['kick4', 'clap'], feel: 'fast, modern (synth arpeggio, driving bass)' },
  news:    { kit: 'keys', harmony: 'tense', key: 0, bpm: 104, mel: 'pulse', hat: 'hat8', kick: 'kick2', bass: 'bassHalf', peak: ['kick4', 'bell'], feel: 'serious, urgent (ticking pulse, minor chords)' },
  playful: { kit: 'percussion', harmony: 'blues', key: 0, bpm: 104, mel: 'pluck', hat: 'shuffle', kick: 'kick2', bass: 'bassHalf', peak: ['clap', 'lead'], feel: 'cheeky, bouncy (swung marimba)' },
  wonder:  { kit: 'keys', harmony: 'dreamy', key: 5, bpm: 80, mel: 'arp', hat: 'hat8', kick: 'kick2', bass: 'bassHalf', peak: ['bell'], feel: 'vast, awed (slow arpeggio, bells)' },
};
const EXTRA_LAYERS = ['arp', 'pulse', 'shuffle', 'bell', 'strum'];

// SECTIONS for `bars` bars: intro -> melody -> groove -> bass -> peak -> settle -> quiet last bar.
// Kick and bass never enter together; each step adds one or two layers (the rule that keeps sync-check quiet).
function musicArc(mood, bars) {
  const m = typeof mood === 'string' ? MOODS[mood] : mood, n = Math.max(8, bars);
  const L0 = ['pad'], L1 = [...L0, m.mel], L2 = [...L1, m.hat], L3 = [...L2, m.kick], L4 = [...L3, m.bass];
  const PEAK = [...L4.filter(l => !(m.peak.includes('kick4') && l === 'kick2')), ...m.peak];
  const cut = [0, 1, 2, 4, Math.round(n * .44), Math.round(n * .56), Math.round(n * .74), Math.round(n * .86), n - 1, n];
  const lay = [L0, L1, L2, L3, L4, PEAK, L4, L3, [...L1, m.kick]];
  const out = []; for (let i = 0; i < lay.length; i++) if (cut[i + 1] > cut[i]) out.push([cut[i], cut[i + 1], lay[i]]);
  return out;
}

// the score: buildGroove plus the extra patterns, on one clock
function buildScore(ac, { dur, bpm, sections, events, ...music }) {
  buildGroove(ac, { dur, bpm, sections, events, ...music });
  const kit = music.kit || 'electro', harmony = music.harmony || 'wistful', key = music.key || 0;
  const chords = (Array.isArray(harmony) ? harmony : HARMONY[harmony]).map(c => c.map(m => m + key));
  const T0 = ac.currentTime + (ac instanceof OfflineAudioContext ? 0 : .05), BEAT = 60 / bpm, hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const bus = ac.createGain(); bus.gain.value = (music.gain ?? .9) * .8; bus.connect(ac.destination);
  bus.gain.setValueAtTime(bus.gain.value, T0 + dur - 1); bus.gain.linearRampToValueAtTime(0, T0 + dur);
  const noise = (() => { const n = ac.sampleRate, b2 = ac.createBuffer(1, n, n), d = b2.getChannelData(0); let s = 11; for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x7fffffff * 2 - 1; } return b2; })();
  const tone = (t, f, type, peak, decay, cutoff = 6000, pan = 0) => { const o = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain(), p = ac.createStereoPanner();
    o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = cutoff; p.pan.value = pan;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .004); g.gain.setTargetAtTime(0, t + .004, decay);
    o.connect(fl); fl.connect(g); g.connect(p); p.connect(bus); o.start(t); o.stop(t + decay * 7 + .05); };
  const tick = (t, a) => { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise; fl.type = 'highpass'; fl.frequency.value = 7000;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .002); g.gain.setTargetAtTime(0, t + .002, .025); s.connect(fl); fl.connect(g); g.connect(bus); s.start(t, (t * 5.1) % .5); s.stop(t + .2); };
  const voice = kit === 'electro' ? 'square' : kit === 'acoustic' ? 'triangle' : 'sine';
  const bars = Math.ceil(dur / (4 * BEAT)); let prev = [];
  for (let bar = 0; bar < bars; bar++) {
    const sec = sections.find(([a, e]) => bar >= a && bar < e); if (!sec) { prev = []; continue; }
    const L = sec[2], t0 = T0 + bar * 4 * BEAT, ch = chords[bar % chords.length], k = L.some(l => EXTRA_LAYERS.includes(l) && !prev.includes(l)) && bar > 0 ? .6 : 1;   // a new pattern arrives softly
    for (let s = 0; s < 8; s++) {                         // eighth notes
      const t = t0 + s * BEAT / 2;
      if (L.includes('arp')) tone(t, hz([ch[0], ch[1], ch[2], ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[2], ch[1]][s] + 12), voice, .05 * k, bpm > 100 ? .09 : .16, kit === 'electro' ? 2400 : 5000, s % 2 ? .25 : -.25);
      if (L.includes('pulse')) tone(t, hz(ch[0]), 'sawtooth', (s % 2 ? .035 : .06) * k, .07, 900);
      if (L.includes('shuffle') && s % 2) tick(t + BEAT / 6, .09 * k);          // swung: the off-beat lands late
      if (L.includes('shuffle') && !(s % 2) && s % 4) tick(t, .05 * k);
    }
    for (const beat of [0, 2]) {
      const t = t0 + beat * BEAT;
      if (L.includes('bell')) { tone(t, hz(ch[ch.length - 1] + 24), 'sine', .045 * k, .6, 9000); tone(t, hz(ch[ch.length - 1] + 24) * 2.76, 'sine', .012 * k, .25, 9000); }
      if (L.includes('strum')) ch.forEach((m, i) => tone(t + i * .025, hz(m + 12), 'triangle', .05 * k, .45, 4000, (i - 1) * .2));
    }
    if (L.includes('strum')) ch.forEach((m, i) => tone(t0 + 3.5 * BEAT + i * .02, hz(m + 12), 'triangle', .025 * k, .2, 3000));   // a light upstroke on the and of 4
    prev = L;
  }
}
