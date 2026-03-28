/**
 * Procedural ambient music system using Web Audio API.
 * Each scene gets a unique generative soundscape — no audio files needed.
 */

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeLayers = [];
    this.currentScene = null;
    this.isStarted = false;
    this.updateInterval = null;
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35; // Master volume
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  start() {
    if (this.isStarted) return;
    this.isStarted = true;
    this.ensureContext();
  }

  async transitionTo(sceneName) {
    if (!this.isStarted) return;
    this.ensureContext();

    if (sceneName === this.currentScene) return;

    // Fade out current layers
    await this.fadeOutAll(0.8);
    this.stopAll();

    this.currentScene = sceneName;

    switch (sceneName) {
      case 'street': this.playStreet(); break;
      case 'lobby': this.playLobby(); break;
      case 'interview': this.playInterview(); break;
      case 'office': this.playOffice(); break;
      case 'desk': this.playDesk(); break;
    }
  }

  fadeOutAll(duration) {
    return new Promise((resolve) => {
      if (!this.ctx) { resolve(); return; }
      const now = this.ctx.currentTime;
      for (const layer of this.activeLayers) {
        layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
        layer.gain.gain.linearRampToValueAtTime(0, now + duration);
      }
      setTimeout(resolve, duration * 1000);
    });
  }

  stopAll() {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    for (const layer of this.activeLayers) {
      try {
        layer.oscillator?.stop();
        layer.source?.stop();
      } catch (_) { /* already stopped */ }
      layer.gain.disconnect();
    }
    this.activeLayers = [];
  }

  createOsc(type, freq, vol) {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.masterGain);

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start();

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5);

    const layer = { oscillator: osc, gain };
    this.activeLayers.push(layer);
    return layer;
  }

  createNoise(vol, filterFreq, filterType = 'lowpass') {
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.masterGain);

    source.connect(filter);
    filter.connect(gain);
    source.start();

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5);

    const layer = { source, gain };
    this.activeLayers.push(layer);
    return layer;
  }

  playStreet() {
    const ctx = this.ctx;
    this.createOsc('sawtooth', 55, 0.06);
    this.createOsc('sine', 82.5, 0.08);
    const sub = this.createOsc('sine', 36, 0.1);
    this.createNoise(0.06, 800, 'bandpass');
    this.createNoise(0.04, 200, 'lowpass');
    this.createOsc('sine', 440, 0.015);
    this.createOsc('sine', 554, 0.01);

    this.updateInterval = window.setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      sub.gain.gain.setTargetAtTime(0.05 + Math.sin(t * 0.3) * 0.03, t, 0.5);
    }, 200);
  }

  playLobby() {
    const ctx = this.ctx;
    const notes = [130.8, 164.8, 196, 247];
    const pads = [];
    for (const freq of notes) {
      const pad = this.createOsc('sine', freq, 0.04);
      pads.push(pad);
      this.createOsc('sine', freq * 1.003, 0.02);
    }
    this.createOsc('sine', 988, 0.008);
    this.createOsc('sine', 1318, 0.005);
    this.createNoise(0.025, 3000, 'lowpass');

    const arpeggioNotes = [261.6, 329.6, 392, 493.9, 392, 329.6];
    let noteIdx = 0;
    const arpOsc = this.createOsc('sine', arpeggioNotes[0], 0.0);

    this.updateInterval = window.setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      noteIdx = (noteIdx + 1) % arpeggioNotes.length;
      arpOsc.oscillator.frequency.setTargetAtTime(arpeggioNotes[noteIdx], t, 0.1);
      arpOsc.gain.gain.setValueAtTime(0.025, t);
      arpOsc.gain.gain.setTargetAtTime(0.005, t, 0.8);

      for (let i = 0; i < pads.length; i++) {
        const drift = Math.sin(t * 0.2 + i) * 0.01;
        pads[i].gain.gain.setTargetAtTime(0.04 + drift, t, 0.5);
      }
    }, 1200);
  }

  playInterview() {
    const ctx = this.ctx;
    this.createOsc('sine', 73.4, 0.08);
    this.createOsc('sine', 77.8, 0.06);
    this.createOsc('sine', 587, 0.012);
    this.createTriangle('triangle', 622, 0.008);
    const heartbeat = this.createOsc('sine', 50, 0.0);
    this.createNoise(0.02, 500, 'bandpass');

    let beat = 0;
    this.updateInterval = window.setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      beat++;
      if (beat % 4 === 0 || beat % 4 === 1) {
        const vol = beat % 4 === 0 ? 0.15 : 0.08;
        heartbeat.gain.gain.setValueAtTime(vol, t);
        heartbeat.gain.gain.setTargetAtTime(0, t, 0.12);
      }
    }, 250);
  }

  createTriangle(type, freq, vol) {
      return this.createOsc(type, freq, vol);
  }

  playOffice() {
    const ctx = this.ctx;
    this.createOsc('sawtooth', 120, 0.015);
    this.createOsc('square', 60, 0.008);
    this.createNoise(0.03, 400, 'lowpass');
    this.createOsc('sine', 146.8, 0.04);
    this.createOsc('sine', 174.6, 0.03);
    this.createOsc('sine', 220, 0.025);
    this.createOsc('sine', 880, 0.006);

    const clickGain = ctx.createGain();
    clickGain.gain.value = 0;
    clickGain.connect(this.masterGain);
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 2000;

    const noiseLen = ctx.sampleRate * 0.02;
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
        noiseData[i] = Math.random() * 2 - 1;
    }

    this.activeLayers.push({ gain: clickGain });

    this.updateInterval = window.setInterval(() => {
      if (!this.ctx || Math.random() > 0.4) return;
      const t = this.ctx.currentTime;
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = noiseBuf;
        src.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.gain.setValueAtTime(0.03 + Math.random() * 0.02, t);
        clickGain.gain.setTargetAtTime(0, t, 0.015);
        src.start(t);
        src.stop(t + 0.03);
      } catch (_) {}
    }, 120);
  }

  playDesk() {
    this.createOsc('sawtooth', 65.4, 0.05);
    this.createOsc('sine', 98, 0.06);
    this.createOsc('sine', 523, 0.01);
    this.createOsc('sine', 784, 0.008);
    this.createOsc('square', 15.7, 0.02);
    this.createOsc('sine', 120, 0.01);
    this.createNoise(0.02, 1200, 'bandpass');
    const beep = this.createOsc('square', 800, 0.0);

    this.updateInterval = window.setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (Math.random() > 0.7) {
        const freq = [400, 600, 800, 1000, 1200][Math.floor(Math.random() * 5)];
        beep.oscillator.frequency.setValueAtTime(freq, t);
        beep.gain.gain.setValueAtTime(0.02, t);
        beep.gain.gain.setTargetAtTime(0, t, 0.05);
      }
    }, 400);
  }

  setMuted(muted) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : 0.35,
        this.ctx.currentTime,
        0.3
      );
    }
  }

  dispose() {
    this.stopAll();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isStarted = false;
  }
}
