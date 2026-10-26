/**
 * Audio helper for background wedding music.
 * Browsers may block audible autoplay until the visitor interacts with the page.
 */

class WeddingAudioManager {
  private audioEl: HTMLAudioElement | null = null;
  private isMuted = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioEl = new Audio();
      const baseUrl = import.meta.env.BASE_URL || './';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
      this.audioEl.src = `${cleanBase}music/thousand-years.mp3`;
      this.audioEl.loop = true;
      this.audioEl.autoplay = true;
      this.audioEl.preload = 'auto';
      this.audioEl.volume = 0.55;
    }
  }

  public async startAudio(): Promise<boolean> {
    if (!this.audioEl) return false;

    try {
      await this.audioEl.play();
      this.isMuted = false;
      return true;
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'NotAllowedError')) {
        console.error('Unable to play wedding music:', error);
      }
      return false;
    }
  }

  public pauseAudio(): void {
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.isMuted = true;
  }

  public async toggleAudio(): Promise<boolean> {
    if (this.isPlaying()) {
      this.pauseAudio();
      return false;
    }
    return this.startAudio();
  }

  public isPlaying(): boolean {
    if (this.isMuted) return false;
    return Boolean(this.audioEl && !this.audioEl.paused && this.audioEl.currentTime > 0);
  }
}

export const weddingAudio = new WeddingAudioManager();
