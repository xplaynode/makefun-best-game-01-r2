// Sound made in code with WebAudio, no files: a slow music-box arpeggio over a low
// pad for the night, and small effects for lamps, gusts, losses and dawn.
// The context is created lazily on the first user gesture; shot scenes stay silent.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33]; // C major music box
const CHORDS = [[130.81, 196, 261.63], [110, 164.81, 220], [87.31, 130.81, 174.61], [98, 146.83, 196]];

export function createAudio() {
  let ctx = null; let master = null; let muted = false;
  let beat = 0; let nextNoteAt = 0; let chord = 0;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      nextNoteAt = ctx.currentTime + 0.1;
      return true;
    } catch { return false; }
  }
  function tone(freq, at, dur, type, gain, slideTo = 0) {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, at);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g); g.connect(master); osc.start(at); osc.stop(at + dur + 0.05);
  }
  function noise(at, dur, gain, from, to) {
    const length = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buffer;
    const filter = ctx.createBiquadFilter(); filter.type = 'bandpass';
    filter.frequency.setValueAtTime(from, at);
    filter.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + dur * 0.3);
    g.gain.linearRampToValueAtTime(0, at + dur);
    src.connect(filter); filter.connect(g); g.connect(master); src.start(at);
  }
  return {
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (master && ctx) master.gain.setValueAtTime(muted ? 0 : 0.5, ctx.currentTime);
      return muted;
    },
    /** Keep the music loop scheduled while a night is being played. */
    update(playing) {
      if (!ctx || muted || !playing) return;
      while (nextNoteAt < ctx.currentTime + 0.35) {
        const at = nextNoteAt;
        tone(SCALE[beat % SCALE.length], at, 1.1, 'sine', 0.055);
        tone(SCALE[beat % SCALE.length] * 2, at, 0.5, 'triangle', 0.012);
        if (beat % 8 === 0) {
          for (const freq of CHORDS[chord % CHORDS.length]) tone(freq, at, 3.6, 'sine', 0.028);
          chord += 1;
        }
        beat += 1; nextNoteAt += 0.42;
      }
    },
    chime() { if (ctx && !muted) { const t = ctx.currentTime; tone(1318.5, t, 0.7, 'sine', 0.12); tone(1760, t + 0.07, 0.9, 'sine', 0.08); } },
    swell() { if (ctx && !muted) { const t = ctx.currentTime; tone(98, t, 1.6, 'sawtooth', 0.05, 49); tone(147, t, 1.6, 'sine', 0.07, 73); } },
    whoosh() { if (ctx && !muted) noise(ctx.currentTime, 0.9, 0.16, 500, 1800); },
    refill() { if (ctx && !muted) { const t = ctx.currentTime; tone(392, t, 0.25, 'sine', 0.07, 784); } },
    dawn() {
      if (!ctx || muted) return; const t = ctx.currentTime;
      for (let i = 0; i < 5; i += 1) {
        const at = t + i * 0.22;
        tone(1568 + (i % 3) * 220, at, 0.16, 'sine', 0.05);
        tone(2093, at + 0.09, 0.12, 'sine', 0.035);
      }
    },
  };
}
