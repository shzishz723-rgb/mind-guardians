import React from 'react';
import { Volume2, X, RotateCcw } from 'lucide-react';
import { speakCompanionVoice, getUnlockedAudioContext } from '../lib/audioSpeech';

interface VoiceToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const VoiceToast: React.FC<VoiceToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  const replaySpeech = () => {
    getUnlockedAudioContext();
    speakCompanionVoice(message, 'Kore');
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px] bg-gradient-to-r from-[#1A4335] to-[#2d493e] text-white rounded-2xl p-3 shadow-xl border border-emerald-500/40 flex items-center justify-between gap-2.5 animate-fadeIn">
      <div
        onClick={replaySpeech}
        className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
        title="Tap to replay voice"
      >
        <div className="w-8 h-8 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center flex-shrink-0 text-emerald-300 transition-colors">
          <Volume2 className="w-4 h-4 animate-bounce" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-emerald-300 block uppercase tracking-wider">
            Audio Voice Sanctuary • Tap to Replay
          </span>
          <p className="text-xs text-[#f2f7f4] truncate font-medium font-bengali">
            {message}
          </p>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

