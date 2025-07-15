export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.sounds = new Map();
    this.music = new Map();
    this.currentMusic = null;
    this.isEnabled = true;
    this.masterVolume = 0.7;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.8;
    
    this.initializeAudioContext();
    this.createSoundEffects();
  }

  async initializeAudioContext() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.masterVolume;
      
      console.log('✅ Audio system initialized');
    } catch (error) {
      console.warn('❌ Audio not available:', error);
      this.isEnabled = false;
    }
  }

  // Create procedural sound effects using Web Audio API
  createSoundEffects() {
    if (!this.isEnabled || !this.audioContext) return;

    // Gesture sound effects
    this.createGestureSounds();
    
    // UI sound effects
    this.createUISounds();
    
    // Combo sound effects
    this.createComboSounds();
  }

  createGestureSounds() {
    // Pinch sound - high frequency beep
    this.sounds.set('pinch', () => this.createTone(800, 0.1, 'sine'));
    
    // Open hand - whoosh sound
    this.sounds.set('open_hand', () => this.createNoise(0.2, 'lowpass', 500));
    
    // Closed fist - thump sound
    this.sounds.set('closed_fist', () => this.createTone(150, 0.15, 'square'));
    
    // Point - click sound
    this.sounds.set('point', () => this.createTone(1200, 0.05, 'triangle'));
    
    // Victory - success chime
    this.sounds.set('victory', () => this.createChord([523, 659, 784], 0.3));
    
    // Thumbs up - positive beep
    this.sounds.set('thumbs_up', () => this.createTone(660, 0.2, 'sine'));
    
    // Rock on - power chord
    this.sounds.set('rock_on', () => this.createChord([220, 277, 330], 0.4));
    
    // OK sign - confirmation tone
    this.sounds.set('ok_sign', () => this.createTone(440, 0.15, 'sine'));
  }

  createUISounds() {
    // Button hover
    this.sounds.set('hover', () => this.createTone(300, 0.05, 'sine'));
    
    // Button click
    this.sounds.set('click', () => this.createTone(600, 0.1, 'triangle'));
    
    // Modal open
    this.sounds.set('modal_open', () => this.createChord([440, 554, 659], 0.2));
    
    // Modal close
    this.sounds.set('modal_close', () => this.createChord([659, 554, 440], 0.2));
    
    // Error sound
    this.sounds.set('error', () => this.createTone(200, 0.3, 'sawtooth'));
    
    // Success sound
    this.sounds.set('success', () => this.createChord([523, 659, 784, 1047], 0.4));
  }

  createComboSounds() {
    // Combo start
    this.sounds.set('combo_start', () => this.createRiseTone(400, 800, 0.3));
    
    // Combo progress
    this.sounds.set('combo_progress', () => this.createTone(500, 0.1, 'sine'));
    
    // Combo complete
    this.sounds.set('combo_complete', () => this.createFanfare());
    
    // Combo failed
    this.sounds.set('combo_failed', () => this.createFallTone(600, 200, 0.4));
  }

  // Create a simple tone
  createTone(frequency, duration, waveType = 'sine') {
    if (!this.audioContext) return null;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.value = frequency;
    oscillator.type = waveType;
    
    // Envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    return { oscillator, gainNode };
  }

  // Create a chord (multiple tones)
  createChord(frequencies, duration) {
    if (!this.audioContext) return null;

    const nodes = frequencies.map(freq => this.createTone(freq, duration));
    return nodes;
  }

  // Create noise (for whoosh effects)
  createNoise(duration, filterType = 'lowpass', cutoff = 1000) {
    if (!this.audioContext) return null;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.value = cutoff;
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.2, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    source.start(now);
    
    return { source, filter, gainNode };
  }

  // Create rising tone
  createRiseTone(startFreq, endFreq, duration) {
    if (!this.audioContext) return null;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.type = 'sine';
    
    const now = this.audioContext.currentTime;
    oscillator.frequency.setValueAtTime(startFreq, now);
    oscillator.frequency.linearRampToValueAtTime(endFreq, now + duration);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    return { oscillator, gainNode };
  }

  // Create falling tone
  createFallTone(startFreq, endFreq, duration) {
    if (!this.audioContext) return null;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.type = 'sawtooth';
    
    const now = this.audioContext.currentTime;
    oscillator.frequency.setValueAtTime(startFreq, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    return { oscillator, gainNode };
  }

  // Create fanfare for combo completion
  createFanfare() {
    if (!this.audioContext) return null;

    const notes = [
      { freq: 523, time: 0, duration: 0.2 },    // C
      { freq: 659, time: 0.1, duration: 0.2 },  // E
      { freq: 784, time: 0.2, duration: 0.2 },  // G
      { freq: 1047, time: 0.3, duration: 0.4 }  // C
    ];
    
    const nodes = notes.map(note => {
      setTimeout(() => {
        this.createTone(note.freq, note.duration, 'triangle');
      }, note.time * 1000);
    });
    
    return nodes;
  }

  // Play a sound effect
  playSound(soundName, volume = 1.0) {
    if (!this.isEnabled || !this.sounds.has(soundName)) return;

    try {
      const soundFactory = this.sounds.get(soundName);
      const sound = soundFactory();
      
      // Adjust volume if needed
      if (sound && sound.gainNode && volume !== 1.0) {
        sound.gainNode.gain.value *= volume;
      }
      
    } catch (error) {
      console.warn(`Failed to play sound ${soundName}:`, error);
    }
  }

  // Play gesture sound
  playGestureSound(gesture, confidence = 1.0) {
    if (!this.isEnabled) return;
    
    // Adjust volume based on confidence
    const volume = Math.max(0.3, confidence);
    this.playSound(gesture, volume);
  }

  // Set master volume
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  // Set SFX volume
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  // Enable/disable audio
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled && this.currentMusic) {
      this.stopMusic();
    }
  }

  // Resume audio context (required for user interaction)
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('🔊 Audio context resumed');
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }
  }

  // Get audio info
  getAudioInfo() {
    return {
      enabled: this.isEnabled,
      masterVolume: this.masterVolume,
      sfxVolume: this.sfxVolume,
      musicVolume: this.musicVolume,
      contextState: this.audioContext?.state || 'unavailable',
      soundCount: this.sounds.size
    };
  }

  // Dispose audio resources
  dispose() {
    if (this.currentMusic) {
      this.stopMusic();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.sounds.clear();
    this.music.clear();
  }
}

// Create singleton instance
export const audioManager = new AudioManager();
