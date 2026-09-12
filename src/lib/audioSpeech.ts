// Unified audio synthesis and ambient sound generator for MindSync
let currentAudio: HTMLAudioElement | null = null;
let audioContext: AudioContext | null = null;

// Client-side circuit breaker to prevent hammering upstream Gemini TTS when free quota is reached
let clientTtsDisabledUntil = 0;
try {
  const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('mindsync_tts_quota_exhausted') : null;
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed > Date.now()) {
      clientTtsDisabledUntil = parsed;
    }
  }
} catch (_) {}

// Voice cache for SpeechSynthesis
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function getUnlockedAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) {
      audioContext = new AudioCtx();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch (e) {
    console.warn('AudioContext creation error', e);
    return null;
  }
}

export function stopAllSpeech(): void {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      (window as any).__activeUtterance = null;
    }
  } catch (e) {
    console.warn('Error stopping speech', e);
  }
}

export async function speakCompanionVoice(
  text: string,
  voice: 'Kore' | 'Puck' | 'Zephyr' = 'Kore',
  onStart?: () => void,
  onEnd?: () => void
): Promise<boolean> {
  stopAllSpeech();

  // Strip stage directions or parenthetical translations for natural audio reading
  const cleanSpeech = text.replace(/\([^)]*\)/g, '').replace(/[*_#]/g, '').trim();
  if (!cleanSpeech) {
    onEnd?.();
    return false;
  }

  onStart?.();

  // If client circuit breaker is active (quota exceeded upstream), bypass network and speak locally immediately
  if (Date.now() < clientTtsDisabledUntil) {
    return fallbackSpeechSynthesis(cleanSpeech, onEnd);
  }

  // Attempt 1: Try backend Gemini TTS (returns properly wrapped audio/wav)
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanSpeech, voice }),
    });

    if (res.status === 429) {
      // 429 rate limit: activate client circuit breaker for 30 minutes
      clientTtsDisabledUntil = Date.now() + 30 * 60 * 1000;
      try {
        sessionStorage.setItem('mindsync_tts_quota_exhausted', String(clientTtsDisabledUntil));
      } catch (_) {}
      return fallbackSpeechSynthesis(cleanSpeech, onEnd);
    }

    if (res.ok) {
      const data = await res.json();

      if (data.quotaExhausted || data.useClientSynth) {
        if (data.quotaExhausted) {
          clientTtsDisabledUntil = Date.now() + 30 * 60 * 1000;
          try {
            sessionStorage.setItem('mindsync_tts_quota_exhausted', String(clientTtsDisabledUntil));
          } catch (_) {}
        }
        return fallbackSpeechSynthesis(cleanSpeech, onEnd);
      }

      if (data.audio) {
        const audioMime = data.mimeType || 'audio/wav';
        const audio = new Audio(`data:${audioMime};base64,${data.audio}`);
        currentAudio = audio;
        audio.onended = () => {
          currentAudio = null;
          onEnd?.();
        };
        audio.onerror = () => {
          currentAudio = null;
          fallbackSpeechSynthesis(cleanSpeech, onEnd);
        };
        await audio.play();
        return true;
      }
    }
  } catch (err) {
    console.debug('Backend TTS unavailable, using local synthesis');
  }

  // Attempt 2: Fallback to browser SpeechSynthesis
  return fallbackSpeechSynthesis(cleanSpeech, onEnd);
}

function fallbackSpeechSynthesis(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    // Unfreeze speech synthesis in Chromium
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88; // Gentle, patient pacing for dementia care
    utterance.pitch = 1.05;

    // Pick best available voice (prefer Indian English or regional voice, or smooth female voice)
    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    const indianVoice = voices.find(
      (v) =>
        v.lang.includes('IN') ||
        v.lang.startsWith('hi') ||
        v.lang.startsWith('bn') ||
        v.name.toLowerCase().includes('india')
    );
    const naturalVoice = voices.find(
      (v) =>
        v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('google us english')
    );

    if (indianVoice) {
      utterance.voice = indianVoice;
    } else if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    // Keep active reference to avoid Chromium garbage collection bugs
    (window as any).__activeUtterance = utterance;

    utterance.onend = () => {
      (window as any).__activeUtterance = null;
      onEnd?.();
    };
    utterance.onerror = () => {
      (window as any).__activeUtterance = null;
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis invocation error:', err);
    onEnd?.();
    return false;
  }
}

// Ambient Sundowning & Respite Sound Generator (Rain on Tin Roof, Warm Hearth, Singing Bowl)
export class AmbientSanctuaryAudio {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isRunning = false;

  public startRain(): void {
    this.stop();
    try {
      const ctx = getUnlockedAudioContext();
      if (!ctx) return;
      this.ctx = ctx;

      // Pink-noise buffer for gentle mountain rain on tin roof
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // Softer volume
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Lowpass filter for cozy veranda raindrops
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      this.noiseNode = whiteNoise;
      this.gainNode = gain;
      this.filterNode = filter;
      this.isRunning = true;
    } catch (e) {
      console.warn('Ambient rain audio error', e);
    }
  }

  public playSingingBowl(): void {
    try {
      const ctx = getUnlockedAudioContext();
      if (!ctx) return;
      
      const freqs = [216, 432, 864]; // Tibetan singing bowl harmonics
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Gentle decay chime
        const vol = 0.12 / (idx + 1);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 4.6);
      });
    } catch (e) {
      console.warn('Singing bowl chime error', e);
    }
  }

  public stop(): void {
    try {
      if (this.noiseNode) {
        (this.noiseNode as any).stop?.();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      this.isRunning = false;
    } catch (e) {
      console.warn('Error stopping ambient audio', e);
    }
  }

  public getActive(): boolean {
    return this.isRunning;
  }
}

export const ambientSanctuary = new AmbientSanctuaryAudio();
