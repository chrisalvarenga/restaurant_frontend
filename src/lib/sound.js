// Alertas sonoras cortas vía Web Audio API — sin depender de archivos de audio externos.
let sharedContext = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedContext) sharedContext = new Ctx();
  return sharedContext;
}

function tone(ctx, frequency, startTime, duration) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.15, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/** Doble beep ascendente — usado cuando un pedido propio queda "listo". */
export function playReadyChime() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 880, now, 0.15);
  tone(ctx, 1174, now + 0.18, 0.2);
}

/** Beep simple — usado en cocina para nuevos pedidos entrantes. */
export function playNewOrderPing() {
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, 660, ctx.currentTime, 0.18);
}
