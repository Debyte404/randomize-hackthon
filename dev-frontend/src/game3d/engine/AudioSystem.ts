/**
 * Procedural ambient music system using Web Audio API.
 * Each scene gets a unique generative soundscape — no audio files needed.
 */

type SceneName = 'street' | 'lobby' | 'interview' | 'office' | 'desk';

interface ActiveLayer {
  oscillator?: OscillatorNode;
  gain: GainNode;
  source?: AudioBufferSourceNode;
}

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeLayers: ActiveLayer[] = [];
  private currentScene: SceneName | null = null;
  private isStarted = false;
  private updateInterval: number | null = null;

  constructor() {
    // AudioContext must be created after user gesture
  }

  private ensureContext() {
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

  /** Call on first user interaction to unlock audio */
  start() {
    if (this.isStarted) return;
    this.isStarted = true;
    this.ensureContext();
  }

  /** Crossfade to new scene's music */
  async transitionTo(sceneName: string) {
    if (!this.isStarted) return;
    this.ensureContext();

    const scene = sceneName as SceneName;
    if (scene === this.currentScene) return;

    // Fade out current layers
    await this.fadeOutAll(0.8);
    this.stopAll();

    this.currentScene = scene;

    // Start new scene music
    switch (scene) {
      case 'street': this.playStreet(); break;
      case 'lobby': this.playLobby(); break;
      case 'interview': this.playInterview(); break;
      case 'office': this.playOffice(); break;
      case 'desk': this.playDesk(); break;
    }
  }

  private fadeOutAll(duration: number): Promise<void> {
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

  private stopAll() {
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

  private createOsc(type: OscillatorType, freq: number, vol: number): ActiveLayer {
    // @ts-ignore
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.masterGain!);

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start();

    // Fade in
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5);

    const layer: ActiveLayer = { oscillator: osc, gain };
    this.activeLayers.push(layer);
    return layer;
  }

  private createNoise(vol: number, filterFreq: number, filterType: BiquadFilterType = 'lowpass'): ActiveLayer {
    // @ts-ignore
    const ctx = this.ctx!;
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
    gain.connect(this.masterGain!);

    source.connect(filter);
    filter.connect(gain);
    source.start();

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5);

    const layer: ActiveLayer = { source, gain };
    this.activeLayers.push(layer);
    return layer;
  }

  // ─── STREET: Urban drone, distant traffic, cold wind ───
  private playStreet() {
    // @ts-ignore
    const ctx = this.ctx!;

    // Deep city drone
    this.createOsc('sawtooth', 55, 0.06);
    this.createOsc('sine', 82.5, 0.08);

    // Sub bass pulse
    const sub = this.createOsc('sine', 36, 0.1);
    const now = ctx.currentTime;
    // Slow LFO on sub volume for breathing feel
    sub.gain.gain.setValueAtTime(0.05, now + 1.5);

    // Wind noise
    this.createNoise(0.06, 800, 'bandpass');

    // Distant traffic rumble
    this.createNoise(0.04, 200, 'lowpass');

    // High eerie tone (lonely street)
    this.createOsc('sine', 440, 0.015);
    this.createOsc('sine', 554, 0.01); // C# minor feel

    // Slow modulation
    this.updateInterval = window.setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // Modulate sub bass
      sub.gain.gain.setTargetAtTime(
        0.05 + Math.sin(t * 0.3) * 0.03, t, 0.5
      );
    }, 200);
  }

  // ─── LOBBY: Corporate muzak, cold reverb, pristine pads ───
  private playLobby() {
    // @ts-ignore
    const ctx = this.ctx!;

    // Warm pad chord (Cmaj7-ish, corporate and hollow)
    const notes = [130.8, 164.8, 196, 247]; // C3, E3, G3, B3
    const pads: ActiveLayer[] = [];
    for (const freq of notes) {
      const pad = this.createOsc('sine', freq, 0.04);
      pads.push(pad);
      // Add slight detuned copy for thickness
      this.createOsc('sine', freq * 1.003, 0.02);
    }

    // Soft high shimmer
    this.createOsc('sine', 988, 0.008); // B5
    this.createOsc('sine', 1318, 0.005); // E6

    // Very quiet filtered noise for air conditioning
    this.createNoise(0.025, 3000, 'lowpass');

    // Elevator music: slow arpeggio modulation
    const arpeggioNotes = [261.6, 329.6, 392, 493.9, 392, 329.6]; // C4 E4 G4 B4 G4 E4
    let noteIdx = 0;

    const arpOsc = this.createOsc('sine', arpeggioNotes[0], 0.0);

    this.updateInterval = window.setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      noteIdx = (noteIdx + 1) % arpeggioNotes.length;
      arpOsc.oscillator!.frequency.setTargetAtTime(arpeggioNotes[noteIdx], t, 0.1);
      // Soft pluck envelope
      arpOsc.gain.gain.setValueAtTime(0.025, t);
      arpOsc.gain.gain.setTargetAtTime(0.005, t, 0.8);

      // Gentle pad drift
      for (let i = 0; i < pads.length; i++) {
        const drift = Math.sin(t * 0.2 + i) * 0.01;
        pads[i].gain.gain.setTargetAtTime(0.04 + drift, t, 0.5);
      }
    }, 1200);
  }

  // ─── INTERVIEW: Tense, minimal, heartbeat bass ───
  private playInterview() {
    // @ts-ignore
    const ctx = this.ctx!;

    // Low tension drone (minor second interval = maximum unease)
    this.createOsc('sine', 73.4, 0.08); // D2
    this.createOsc('sine', 77.8, 0.06); // D#2 — dissonant

    // High tension tone
    this.createOsc('sine', 587, 0.012); // D5
    this.createOsc('triangle', 622, 0.008); // D#5

    // Heartbeat-like pulse
    const heartbeat = this.createOsc('sine', 50, 0.0);

    // Quiet anxiety noise
    this.createNoise(0.02, 500, 'bandpass');

    let beat = 0;
    this.updateInterval = window.setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      beat++;

      // Double-pulse heartbeat pattern (lub-dub)
      if (beat % 4 === 0 || beat % 4 === 1) {
        const vol = beat % 4 === 0 ? 0.15 : 0.08;
        heartbeat.gain.gain.setValueAtTime(vol, t);
        heartbeat.gain.gain.setTargetAtTime(0, t, 0.12);
      }
    }, 250);
  }

  // ─── OFFICE: Monotonous hum, keyboard clicks, fluorescent buzz ───
  private playOffice() {
    // @ts-ignore
    const ctx = this.ctx!;

    // Fluorescent light buzz (60Hz hum + harmonics)
    this.createOsc('sawtooth', 120, 0.015);
    this.createOsc('square', 60, 0.008);

    // HVAC drone
    this.createNoise(0.03, 400, 'lowpass');

    // Muted corporate pad (Dm feel — melancholy)
    this.createOsc('sine', 146.8, 0.04); // D3
    this.createOsc('sine', 174.6, 0.03); // F3
    this.createOsc('sine', 220, 0.025); // A3

    // Subtle high frequency for tension
    this.createOsc('sine', 880, 0.006);

    // Simulated keyboard typing clicks via noise bursts
    const clickGain = ctx.createGain();
    clickGain.gain.value = 0;
    clickGain.connect(this.masterGain!);

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
      } catch (_) { /* ignore if context closed */ }
    }, 120);
  }

  // ─── DESK: Building digital tension, glitchy, boot-up feel ───
  private playDesk() {
    // @ts-ignore
    const ctx = this.ctx!;

    // Deep digital drone
    this.createOsc('sawtooth', 65.4, 0.05); // C2
    this.createOsc('sine', 98, 0.06); // G2

    // Digital shimmer
    this.createOsc('sine', 523, 0.01); // C5
    this.createOsc('sine', 784, 0.008); // G5

    // CRT hum
    this.createOsc('square', 15734 / 1000, 0.02); // ~15.7Hz flicker feel
    this.createOsc('sine', 120, 0.01);

    // Quiet data noise
    this.createNoise(0.02, 1200, 'bandpass');

    // Glitchy beeps (random digital sounds)
    const beep = this.createOsc('square', 800, 0.0);

    this.updateInterval = window.setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      if (Math.random() > 0.7) {
        const freq = [400, 600, 800, 1000, 1200][Math.floor(Math.random() * 5)];
        beep.oscillator!.frequency.setValueAtTime(freq, t);
        beep.gain.gain.setValueAtTime(0.02, t);
        beep.gain.gain.setTargetAtTime(0, t, 0.05);
      }
    }, 400);
  }

  /** Mute/unmute for pause menu */
  setMuted(muted: boolean) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : 0.35,
        this.ctx!.currentTime,
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
