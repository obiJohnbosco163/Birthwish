/**
 * Single-Instance Celebratory "Happy Birthday To You" Player
 * GUARANTEES strictly ONE music stream plays at any given time.
 * If any play action is called while another is active, the old one
 * is immediately killed before the new playback begins.
 */

const NOTES: Record<string, number> = {
  G3: 196.00,
  A3: 220.00,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
};

const HAPPY_BIRTHDAY_MELODY: [string, number][] = [
  ['G4', 0.75],
  ['G4', 0.25],
  ['A4', 1.0],
  ['G4', 1.0],
  ['C5', 1.0],
  ['B4', 2.0],

  ['G4', 0.75],
  ['G4', 0.25],
  ['A4', 1.0],
  ['G4', 1.0],
  ['D5', 1.0],
  ['C5', 2.0],

  ['G4', 0.75],
  ['G4', 0.25],
  ['G5', 1.0],
  ['E5', 1.0],
  ['C5', 1.0],
  ['B4', 1.0],
  ['A4', 2.0],

  ['F5', 0.75],
  ['F5', 0.25],
  ['E5', 1.0],
  ['C5', 1.0],
  ['D5', 1.0],
  ['C5', 2.5],
];

class HappyBirthdayAudioService {
  private audioCtx: AudioContext | null = null;
  private isMelodyPlaying: boolean = false;
  private loopMelody: boolean = false;
  private playIterationId: number = 0;
  private activeGainNodes: GainNode[] = [];
  private onStateChangeCallback: ((playing: boolean) => void) | null = null;

  constructor() {}

  private notifyState(playing: boolean) {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(playing);
    }
  }

  public setListener(cb: (playing: boolean) => void) {
    this.onStateChangeCallback = cb;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Stops all active audio nodes immediately.
   */
  public stop(): void {
    this.playIterationId++;
    this.loopMelody = false;
    this.isMelodyPlaying = false;

    // Immediately ramp down and cut any currently scheduled nodes
    for (const gain of this.activeGainNodes) {
      try {
        if (this.audioCtx) {
          gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
          gain.disconnect();
        }
      } catch {}
    }
    this.activeGainNodes = [];
    this.notifyState(false);
  }

  /**
   * Plays the complete authentic "Happy Birthday To You" song.
   * GUARANTEES only ONE song plays at a time.
   */
  public async playHappyBirthdayMelody(loop: boolean = false, onEnd?: () => void): Promise<void> {
    // 1. Immediately kill any existing playback session so songs NEVER overlap
    this.stop();

    const currentSessionId = ++this.playIterationId;
    this.loopMelody = loop;
    this.isMelodyPlaying = true;
    this.notifyState(true);

    const ctx = this.getAudioContext();
    if (!ctx) {
      this.isMelodyPlaying = false;
      this.notifyState(false);
      return;
    }

    const runSynthesis = () => {
      if (this.playIterationId !== currentSessionId) return;

      const beatDuration = 0.44;
      let currentTime = ctx.currentTime + 0.05;

      for (let i = 0; i < HAPPY_BIRTHDAY_MELODY.length; i++) {
        if (this.playIterationId !== currentSessionId) break;

        const [noteName, durationBeats] = HAPPY_BIRTHDAY_MELODY[i];
        const freq = NOTES[noteName] || 440;
        const noteLength = durationBeats * beatDuration;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        this.activeGainNodes.push(gainNode);

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, currentTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, currentTime);

        const attack = 0.02;
        const decay = noteLength * 0.85;

        gainNode.gain.setValueAtTime(0.0001, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.22, currentTime + attack);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + attack + decay);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(currentTime);
        osc2.start(currentTime);
        osc1.stop(currentTime + attack + decay);
        osc2.stop(currentTime + attack + decay);

        currentTime += noteLength + 0.035;
      }

      const totalMs = Math.max(200, (currentTime - ctx.currentTime) * 1000);
      setTimeout(() => {
        if (this.playIterationId !== currentSessionId) return;

        if (this.loopMelody) {
          runSynthesis();
        } else {
          this.isMelodyPlaying = false;
          this.notifyState(false);
          if (onEnd) onEnd();
        }
      }, totalMs);
    };

    runSynthesis();
  }

  public async startLoopingSong(): Promise<void> {
    await this.playHappyBirthdayMelody(true);
  }

  public async toggleSong(onStateChange?: (isPlaying: boolean) => void): Promise<boolean> {
    if (this.isPlaying()) {
      this.stop();
      if (onStateChange) onStateChange(false);
      return false;
    } else {
      if (onStateChange) onStateChange(true);
      await this.playHappyBirthdayMelody(true);
      return true;
    }
  }

  public isPlaying(): boolean {
    return this.isMelodyPlaying;
  }
}

export const happyBirthdayAudio = new HappyBirthdayAudioService();
