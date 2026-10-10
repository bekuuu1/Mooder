/**
 * Mooder - Web Audio API Procedural Synthesizer & Audio Telemetry Engine
 * Generates ambient harmonic pads, chords, and rhythmic pulses matched to
 * the song's musical key, mode (Major/Minor), and tempo (BPM).
 */

class MooderAudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.currentTrack = null;
    this.isPlaying = false;
    this.activeNodes = [];
    this.intervalId = null;
    this.startTime = 0;
    this.playbackDuration = 30; // 30-sec preview
    this.listeners = new Set();

    // Pitch frequencies (A4 = 440Hz base octave)
    this.noteFrequencies = {
      0: 261.63,  // C4
      1: 277.18,  // C#4
      2: 293.66,  // D4
      3: 311.13,  // D#4
      4: 329.63,  // E4
      5: 349.23,  // F4
      6: 369.99,  // F#4
      7: 392.00,  // G4
      8: 415.30,  // G#4
      9: 440.00,  // A4
      10: 466.16, // A#4
      11: 493.88  // B4
    };
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getScaleFrequencies(rootKey, isMajor) {
    const root = this.noteFrequencies[rootKey] || 440;
    // Chords intervals: Major [1, 5/4, 3/2, 9/8] vs Minor [1, 6/5, 3/2, 9/8]
    const thirdMult = isMajor ? 1.2599 : 1.1892;
    const fifthMult = 1.4983;
    const octaveMult = 2.0;

    return [
      root * 0.5,           // Sub-bass
      root,                 // Fundamental
      root * thirdMult,     // 3rd
      root * fifthMult,     // 5th
      root * octaveMult     // Octave
    ];
  }

  play(track) {
    this.init();
    if (this.isPlaying) {
      this.stop();
    }

    this.currentTrack = track;
    this.isPlaying = true;
    this.startTime = Date.now();

    const rootKey = track.key !== undefined ? track.key : 0;
    const isMajor = track.mode !== undefined ? track.mode === 1 : true;
    const bpm = track.tmp || 120;
    const energy = track.eng || 0.6;
    const freqs = this.getScaleFrequencies(rootKey, isMajor);

    // Create 3 harmonic oscillators (warm lush synth pad)
    freqs.slice(0, 4).forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === 0 ? 'sine' : (energy > 0.7 ? 'sawtooth' : 'triangle');
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Lowpass filter for smooth warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + energy * 1200, this.ctx.currentTime);

      const amp = i === 0 ? 0.3 : 0.15;
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(amp, this.ctx.currentTime + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      this.activeNodes.push({ osc, gain });
    });

    // Pulse rhythm based on BPM
    const beatInterval = (60 / bpm) * 1000;
    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return;
      this.triggerBeep(rootKey, energy);
      this.notifyListeners('tick', {
        elapsed: (Date.now() - this.startTime) / 1000,
        track: this.currentTrack
      });
    }, Math.max(300, beatInterval));

    this.notifyListeners('play', { track: this.currentTrack });
  }

  triggerBeep(rootKey, energy) {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = (this.noteFrequencies[rootKey] || 440) * (energy > 0.6 ? 2 : 1);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.activeNodes) {
      this.activeNodes.forEach(({ osc, gain }) => {
        try {
          if (this.ctx) {
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
            setTimeout(() => {
              try { osc.stop(); } catch (e) {}
            }, 350);
          }
        } catch (e) {}
      });
      this.activeNodes = [];
    }

    this.notifyListeners('stop', { track: this.currentTrack });
  }

  toggle(track) {
    if (this.isPlaying && this.currentTrack && this.currentTrack.id === track.id) {
      this.stop();
      return false;
    } else {
      this.play(track);
      return true;
    }
  }

  getFrequencyData() {
    if (!this.analyser) {
      return new Uint8Array(16);
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(fn => fn(event, data));
  }
}

// Global audio singleton
window.MooderAudio = new MooderAudioEngine();
