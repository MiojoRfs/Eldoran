let ctx: AudioContext | null = null;
let enabled = true;

export function setSound(on: boolean) {
  enabled = on;
}

export function soundOn() {
  return enabled;
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function tone(f: number, d = 0.15, t: OscillatorType = "sine", v = 0.08, w = 0) {
  if (!enabled) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const n = ctx.currentTime + w;
    o.type = t;
    o.frequency.setValueAtTime(f, n);
    g.gain.setValueAtTime(v, n);
    g.gain.exponentialRampToValueAtTime(0.0001, n + d);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(n);
    o.stop(n + d);
  } catch {
    /* sem áudio */
  }
}

export const sfx = {
  equip() {
    tone(330, 0.08, "triangle");
    tone(495, 0.12, "triangle", 0.08, 0.07);
  },
  forge() {
    tone(140, 0.12, "sawtooth", 0.1);
    tone(900, 0.05, "square", 0.04, 0.03);
    tone(120, 0.15, "sawtooth", 0.08, 0.2);
  },
  lvl() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.08, i * 0.1));
  },
  die() {
    [300, 220, 150, 90].forEach((f, i) => tone(f, 0.28, "sawtooth", 0.08, i * 0.16));
  },
  skill() {
    tone(200, 0.35, "sawtooth", 0.06);
    tone(600, 0.28, "triangle", 0.07, 0.1);
  },
  drop(r: number) {
    for (let i = 0; i <= Math.min(r, 4); i++) tone(400 + i * 120, 0.16, r > 4 ? "sine" : "triangle", 0.06, i * 0.07);
  },
};
