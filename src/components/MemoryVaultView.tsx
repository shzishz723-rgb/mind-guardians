import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, Volume2, Sparkles, Music, Wind, Sun } from 'lucide-react';
import { LanguageCode } from '../types';
import { I18N } from '../data/i18n';

interface MemoryVaultViewProps {
  currentLang: LanguageCode;
  onBackToHaven: () => void;
  onPlayVoiceToast: (msg?: string) => void;
}

interface Track {
  id: string;
  title: string;
  sub: string;
  duration: string;
  ambientType: 'borgeet' | 'pine' | 'rain';
}

const TRACKS: Track[] = [
  {
    id: 't1',
    title: 'প্ৰভাতী প্ৰাৰ্থনা আৰু শংকৰদেৱৰ বৰগীত',
    sub: 'Acoustic devotional borgeet chants for serene mornings.',
    duration: '14:20',
    ambientType: 'borgeet',
  },
  {
    id: 't2',
    title: 'ছিলঙৰ পাইন বননি আৰু বতাহৰ ধ্বনি',
    sub: 'Gentle mountain wind whispering through Shillong pines.',
    duration: '20:00',
    ambientType: 'pine',
  },
  {
    id: 't3',
    title: 'বাৰাণ্ডাৰ সোণালী স্মৃতি আৰু বৰষুণ',
    sub: 'Soft veranda raindrops on tea leaves with distant temple bells.',
    duration: '18:45',
    ambientType: 'rain',
  },
];

export const MemoryVaultView: React.FC<MemoryVaultViewProps> = ({
  currentLang,
  onBackToHaven,
  onPlayVoiceToast,
}) => {
  const dict = I18N[currentLang] || I18N.as;
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(494); // 08:14 in seconds

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorNodesRef = useRef<any[]>([]);

  const track = TRACKS[currentTrackIndex];

  // Stop sounds helper
  const stopAmbient = () => {
    try {
      oscillatorNodesRef.current.forEach((node) => {
        try {
          node.stop();
          node.disconnect();
        } catch (_) {}
      });
      oscillatorNodesRef.current = [];
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (_) {}
  };

  // Start soothing synth chord using Web Audio API
  const startAmbient = (type: string) => {
    stopAmbient();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Pentatonic warm frequencies based on Indian Ragas (e.g. Bhupali - serene morning)
      const freqs =
        type === 'borgeet'
          ? [220, 247.5, 275, 330, 371.25] // Sa, Re, Ga, Pa, Dha
          : type === 'pine'
          ? [164.81, 220, 329.63] // Deep comforting hum
          : [196, 261.63, 293.66, 392];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Slow lfo vibrato for warmth
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.2 + idx * 0.05, ctx.currentTime);
        lfoGain.gain.setValueAtTime(2.5, ctx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0.12 / freqs.length, ctx.currentTime);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();

        oscillatorNodesRef.current.push(osc, lfo);
      });
    } catch (e) {
      console.warn('Ambient synth audio init error', e);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAmbient();
      setIsPlaying(false);
      onPlayVoiceToast('Chants paused softly.');
    } else {
      startAmbient(track.ambientType);
      setIsPlaying(true);
      onPlayVoiceToast(`Playing: ${track.title}`);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
    };
  }, []);

  // Format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHaven}
          className="text-xs font-bold text-[#2d493e] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E3D5] shadow-sm hover:border-[#567f6f] active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{dict.navHaven}</span>
        </button>
        <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
          স্মৃতিৰ ভঁৰাল • Memory Vault
        </span>
      </div>

      {/* Featured Player Card */}
      <div className="bg-gradient-to-br from-[#2D493E] to-[#1E332B] text-white rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#c5dcd2] uppercase tracking-wider block">
            Comfort Audio Sanctuary
          </span>
          {isPlaying && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-700">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Soothing Chords Live
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold font-bengali leading-snug">
            {track.title}
          </h3>
          <p className="text-xs text-[#c5dcd2] mt-1 leading-relaxed">
            {track.sub}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full bg-emerald-400 rounded-full transition-all duration-300 ${
                isPlaying ? 'animate-pulse' : ''
              }`}
              style={{ width: isPlaying ? '60%' : '38%' }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#c5dcd2]">
            <span>{formatTime(elapsed)}</span>
            <span>{track.duration}</span>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#c5dcd2]" />
            <span className="text-xs text-[#c5dcd2]">Acoustic Balance</span>
          </div>
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-white text-[#1E332B] flex items-center justify-center font-bold text-base shadow-lg hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Track Selection list */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#616F68] px-1">
          Devotional Tracks & Sounds
        </h4>
        {TRACKS.map((t, idx) => (
          <button
            key={t.id}
            onClick={() => {
              setCurrentTrackIndex(idx);
              if (isPlaying) {
                startAmbient(t.ambientType);
              }
            }}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
              currentTrackIndex === idx
                ? 'bg-white border-[#567f6f] shadow-sm ring-1 ring-[#567f6f]/20'
                : 'bg-[#F5F2E8] border-[#E8E3D5] hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                  currentTrackIndex === idx
                    ? 'bg-[#e1ede7] text-[#1e332b]'
                    : 'bg-white text-stone-500'
                }`}
              >
                {t.ambientType === 'borgeet' ? (
                  <Music className="w-4 h-4" />
                ) : t.ambientType === 'pine' ? (
                  <Wind className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </div>
              <div>
                <h5 className="text-xs font-bold text-[#222B27] font-bengali">
                  {t.title}
                </h5>
                <p className="text-[10px] text-[#616F68] mt-0.5">{t.duration}</p>
              </div>
            </div>
            {currentTrackIndex === idx && (
              <span className="text-[10px] font-bold text-[#567f6f] bg-[#e1ede7] px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Memory Album Photo Cards */}
      <div className="bg-white border border-[#E8E3D5] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#1A4335]">
            Loving Memories of Shillong
          </h4>
          <span className="text-[10px] text-[#616F68]">1974 - Present</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-square relative group shadow-inner">
            <img
              alt="Verandah Orchids"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-[10px] font-bold">
              Morning Tea Garden
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-square relative group shadow-inner">
            <img
              alt="Shillong Pine Hills"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-[10px] font-bold">
              Shillong Pine Breeze
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
