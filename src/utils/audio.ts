// Audio state management
let isMuted = false;
let globalVolume = 0.8; // 0.0 – 1.0
let currentAudio: HTMLAudioElement | null = null;
let audioContext: AudioContext | null = null;

// Get/set global volume (0–1)
export const getAudioVolume = (): number => globalVolume;
export const setAudioVolume = (v: number) => {
  globalVolume = Math.max(0, Math.min(1, v));
  if (currentAudio) currentAudio.volume = globalVolume;
};

// Get or create AudioContext singleton
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Get mute state
export const getAudioMuted = (): boolean => isMuted;

// Set mute state
export const setAudioMuted = (muted: boolean) => {
  isMuted = muted;
  if (muted && currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
};

// Stop any currently playing audio
export const stopCurrentAudio = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
};

// Default tick sound (improved natural "ting" sound)
export const playTickSound = () => {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Higher frequency for sharper "ting" sound
    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';

    // Quick attack and decay for percussive "ting" effect
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  } catch (err) {
    console.error('Failed to play tick sound:', err);
  }
};

// Default win sound (celebratory tone)
export const playDefaultWinSound = () => {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + index * 0.15;
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  } catch (err) {
    console.error('Failed to play win sound:', err);
  }
};

// Play custom sound from file (stops any currently playing sound)
export const playCustomSound = (audioUrl: string) => {
  // Don't play if muted
  if (isMuted) return;

  // Stop any currently playing audio
  stopCurrentAudio();

  try {
    currentAudio = new Audio(audioUrl);
    currentAudio.volume = globalVolume;

    // Clear reference when sound finishes
    currentAudio.onended = () => {
      currentAudio = null;
    };

    // Play with error handling
    const playPromise = currentAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.error('Failed to play custom sound:', err);
        currentAudio = null;
      });
    }
  } catch (err) {
    console.error('Error creating audio:', err);
    currentAudio = null;
  }
};
