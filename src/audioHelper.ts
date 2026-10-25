/**
 * Audio helper for background wedding music.
 * Tries playing the local audio file (/music/thousand-years.mp3 or music/thousand-years.mp3).
 * If the file cannot be loaded or played, gracefully falls back to a sweet,
 * atmospheric Web Audio ambient wedding melody (sitar/tanpura/flute harmonic chord progression).
 */

class WeddingAudioManager {
  private audioEl: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isSynthPlaying = false;
  private synthInterval: number | null = null;
  private isMuted = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioEl = new Audio();
      this.audioEl.src = '/music/thousand-years.mp3';
      this.audioEl.loop = true;
      this.audioEl.volume = 0.55;
    }
  }

  public async startAudio(): Promise<boolean> {
    if (!this.audioEl) return false;
    this.isMuted = false;

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch {
        // ignore
      }
    }

    try {
      await this.audioEl.play();
      return true;
    } catch {
      // Audio file might not exist or failed to decode; trigger ambient harmonic synth
      this.startAmbientSynth();
      return true;
    }
  }

  public pauseAudio(): void {
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.stopAmbientSynth();
    this.isMuted = true;
  }

  public toggleAudio(): boolean {
    if (this.isPlaying()) {
      this.pauseAudio();
      return false;
    } else {
      this.startAudio();
      return true;
    }
  }

  public isPlaying(): boolean {
    if (this.isMuted) return false;
    const isFilePlaying = Boolean(this.audioEl && !this.audioEl.paused && this.audioEl.currentTime > 0);
    return isFilePlaying || this.isSynthPlaying;
  }

  private startAmbientSynth(): void {
    if (this.isSynthPlaying) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      this.audioCtx = new AudioCtxClass();
      this.isSynthPlaying = true;

      // Pentatonic / Raga Bhoopali notes (C4, D4, E4, G4, A4, C5, D5, E5, G5)
      const frequencies = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
      let step = 0;

      const playChime = () => {
        if (!this.audioCtx || !this.isSynthPlaying) return;
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Harmonious sine + triangle chime with gentle envelope
        osc.type = step % 3 === 0 ? 'sine' : 'triangle';
        const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 3.3);
        step++;
      };

      // Play continuous soothing ambient bells
      playChime();
      this.synthInterval = window.setInterval(playChime, 1800);
    } catch {
      // Audio context restricted
    }
  }

  private stopAmbientSynth(): void {
    this.isSynthPlaying = false;
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {
        // ignore
      }
      this.audioCtx = null;
    }
  }
}

export const weddingAudio = new WeddingAudioManager();
