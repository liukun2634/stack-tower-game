const NOTE_FREQS = {
  R: 0,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
};

// Melody: cheerful major-key tune, 12 phrases (A-B-A-C-D-E-G-H-A-I-J-F), ~40 seconds per loop
const BGM_MELODY = [
  // Phrase A — bright ascending theme
  'C4','R','E4','G4', 'C5','R','B4','G4',
  'A4','R','G4','E4', 'G4','R','R','R',
  // Phrase B — gentle answering phrase
  'F4','R','A4','C5', 'D5','R','C5','A4',
  'G4','R','E4','D4', 'E4','R','R','R',
  // Phrase A repeat — anchor the ear
  'C4','R','E4','G4', 'C5','R','B4','G4',
  'A4','R','G4','E4', 'G4','R','R','R',
  // Phrase C — higher climax then resolve
  'E5','R','D5','C5', 'D5','R','B4','G4',
  'A4','R','F4','E4', 'C4','R','R','R',
  // Phrase D — playful bouncing variation
  'G4','R','A4','B4', 'C5','R','D5','C5',
  'B4','R','A4','G4', 'A4','R','R','R',
  // Phrase E — soft descending bridge
  'E5','R','C5','A4', 'G4','R','F4','E4',
  'D4','R','E4','F4', 'G4','R','R','R',
  // Phrase G — dancing staccato
  'C5','R','C5','R', 'B4','R','A4','R',
  'G4','R','A4','R', 'G4','R','R','R',
  // Phrase H — stepwise climb
  'D4','R','E4','F4', 'G4','R','A4','B4',
  'C5','R','B4','A4', 'G4','R','R','R',
  // Phrase A — return home
  'C4','R','E4','G4', 'C5','R','B4','G4',
  'A4','R','G4','E4', 'G4','R','R','R',
  // Phrase I — call and response
  'E5','R','R','C5', 'R','D5','R','B4',
  'C5','R','A4','R', 'G4','R','R','R',
  // Phrase J — swaying waltz feel
  'G4','A4','R','G4', 'F4','R','E4','R',
  'D4','E4','R','D4', 'C4','R','R','R',
  // Phrase F — gentle ending with longer breath
  'C5','R','R','B4', 'A4','R','R','G4',
  'F4','R','E4','R', 'C4','R','R','R',
];

// Bass line: root notes, one per 4 melody beats (12 phrases × 4 = 48)
const BGM_BASS = [
  'C4', 'E4', 'F4', 'C4',   // A
  'F4', 'D4', 'G4', 'C4',   // B
  'C4', 'E4', 'F4', 'C4',   // A
  'C4', 'G4', 'F4', 'C4',   // C
  'G4', 'A4', 'E4', 'F4',   // D
  'C4', 'F4', 'D4', 'G4',   // E
  'C4', 'E4', 'G4', 'C4',   // G
  'D4', 'F4', 'A4', 'G4',   // H
  'C4', 'E4', 'F4', 'C4',   // A
  'C4', 'G4', 'D4', 'C4',   // I
  'G4', 'F4', 'D4', 'C4',   // J
  'C4', 'A4', 'F4', 'C4',   // F
];

const BGM_TEMPO = 0.21;

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.muted = localStorage.getItem('stackTowerMuted') === 'true';
    this.initialized = false;
    this.bgmTimer = null;
    this.bgmPlaying = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = this.muted ? 0 : 1;

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.18;
    this.bgmGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.35;
    this.sfxGain.connect(this.masterGain);

    this.initialized = true;
  }

  toggle() {
    this.muted = !this.muted;
    localStorage.setItem('stackTowerMuted', String(this.muted));
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
  }

  startBGM() {
    if (!this.initialized) return;
    this.stopBGM();
    this.bgmPlaying = true;
    this._scheduleBGM();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    // Kill all scheduled BGM notes by swapping to a fresh gain node
    if (this.initialized) {
      this.bgmGain.disconnect();
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.18;
      this.bgmGain.connect(this.masterGain);
    }
  }

  _scheduleBGM() {
    if (!this.bgmPlaying) return;
    const now = this.ctx.currentTime;

    // Melody — triangle wave, light and clear
    for (let i = 0; i < BGM_MELODY.length; i++) {
      const note = BGM_MELODY[i];
      if (note === 'R') continue;
      const freq = NOTE_FREQS[note];
      const startTime = now + i * BGM_TEMPO;
      this._playNote(freq, startTime, BGM_TEMPO * 0.75, 'triangle', this.bgmGain, 0.25);
    }

    // Bass — sine wave, soft undertone, one note per 4 melody beats
    const bassInterval = BGM_TEMPO * 4;
    for (let i = 0; i < BGM_BASS.length; i++) {
      const freq = NOTE_FREQS[BGM_BASS[i]] * 0.5;
      const startTime = now + i * bassInterval;
      this._playNote(freq, startTime, bassInterval * 0.7, 'sine', this.bgmGain, 0.15);
    }

    const loopDuration = BGM_MELODY.length * BGM_TEMPO * 1000;
    this.bgmTimer = setTimeout(() => this._scheduleBGM(), loopDuration - 50);
  }

  _playNote(freq, startTime, duration, type, destination, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.005, startTime + duration);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  play(name) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    switch (name) {
      case 'land':
        this._playSfx(150, 0.12, 'sine', now);
        break;
      case 'perfect':
        this._playSweep(400, 800, 0.18, 'sine', now);
        break;
      case 'combo':
        this._playSfx(600, 0.15, 'triangle', now);
        break;
      case 'gameOver':
        this._playSweep(400, 100, 0.4, 'sine', now);
        break;
    }
  }

  _playSfx(freq, duration, type, startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.5, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  _playSweep(startFreq, endFreq, duration, type, startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
    gain.gain.setValueAtTime(0.5, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}
