import { useSettingsStore } from '../store/settingsStore';

export type SfxName = 'throw' | 'roll' | 'move' | 'select' | 'capture' | 'home' | 'win' | 'nak';

let ctx: AudioContext | undefined;
const ensureCtx = (): AudioContext | undefined => {
  if (typeof window === 'undefined') return undefined;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return undefined;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

const tone = (freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.1) => {
  const c = ensureCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
};

const PATTERNS: Record<SfxName, Array<[number, number, number]>> = {
  throw: [[220, 0, 0.08], [330, 0.06, 0.08], [440, 0.12, 0.1]],
  roll: [[523, 0, 0.12], [659, 0.1, 0.16]],
  move: [[392, 0, 0.09]],
  select: [[660, 0, 0.06]],
  capture: [[196, 0, 0.12], [147, 0.1, 0.2]],
  home: [[523, 0, 0.1], [659, 0.09, 0.1], [784, 0.18, 0.22]],
  win: [[523, 0, 0.15], [659, 0.12, 0.15], [784, 0.24, 0.15], [1047, 0.36, 0.4]],
  nak: [[300, 0, 0.15], [200, 0.12, 0.25]],
};

export const playSfx = (name: SfxName) => {
  try {
    if (!useSettingsStore.getState().sound) return;
    const type: OscillatorType = name === 'capture' || name === 'nak' ? 'square' : 'sine';
    PATTERNS[name].forEach(([f, s, d]) => tone(f, s, d, type, type === 'square' ? 0.06 : 0.1));
  } catch { /* 오디오를 지원하지 않는 환경에서는 무음 */ }
};

// 잔잔한 국악풍 5음계 배경 루프
let musicTimer: number | undefined;
const SCALE = [262, 294, 330, 392, 440, 523];
const MELODY = [0, 2, 4, 3, 5, 4, 2, 1];
export const setMusic = (on: boolean) => {
  if (typeof window === 'undefined') return;
  if (!on) {
    if (musicTimer !== undefined) window.clearInterval(musicTimer);
    musicTimer = undefined;
    return;
  }
  if (musicTimer !== undefined) return;
  let i = 0;
  musicTimer = window.setInterval(() => {
    if (!useSettingsStore.getState().music) return;
    tone(SCALE[MELODY[i % MELODY.length]], 0, 0.5, 'triangle', 0.035);
    i += 1;
  }, 600);
};
