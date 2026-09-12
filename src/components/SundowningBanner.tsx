import React, { useState, useEffect } from 'react';
import { Sunset, Moon, Volume2, VolumeX, Sparkles, Coffee } from 'lucide-react';
import { LanguageCode } from '../types';
import { I18N } from '../data/i18n';
import { ambientSanctuary, speakCompanionVoice } from '../lib/audioSpeech';

interface SundowningBannerProps {
  currentLang: LanguageCode;
  isSundowningActive: boolean;
  onToggleSundowning: (active: boolean) => void;
  onPlayVoiceToast: (msg?: string) => void;
}

export const SundowningBanner: React.FC<SundowningBannerProps> = ({
  currentLang,
  isSundowningActive,
  onToggleSundowning,
  onPlayVoiceToast,
}) => {
  const dict = I18N[currentLang] || I18N.as;
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  // Auto-detect evening hours (4:30 PM to 8:00 PM)
  useEffect(() => {
    const checkCircadian = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const eveningStart = 16 * 60 + 30; // 4:30 PM
      const nightStart = 20 * 60 + 30; // 8:30 PM

      if (currentMinutes >= eveningStart && currentMinutes <= nightStart) {
        if (!isSundowningActive) {
          onToggleSundowning(true);
        }
      }
    };

    checkCircadian();
  }, []);

  const toggleAmbientRain = () => {
    if (ambientPlaying) {
      ambientSanctuary.stop();
      setAmbientPlaying(false);
    } else {
      ambientSanctuary.startRain();
      setAmbientPlaying(true);
      onPlayVoiceToast('বাৰাণ্ডাত বৰষুণৰ শান্ত সুবাস বাজি উঠিছে। (Playing soothing veranda raindrops.)');
    }
  };

  const eveningReassurance =
    dict.sundownReassurance ||
    'আইতা, গধূলি হৈছে। আপুনি শিলঙৰ মৰমৰ বাৰাণ্ডাত নিৰাপদে আছে। গৰম চাহ আৰু মিঠা গৰম গাখীৰ সাজু হৈছে। কোনো চিন্তা নাই। (Aita, evening is here. You are safe on your Shillong verandah. Warm tea is ready.)';

  const speakEveningComfort = () => {
    speakCompanionVoice(eveningReassurance, 'Kore');
    onPlayVoiceToast(eveningReassurance);
  };

  return (
    <div
      className={`rounded-3xl p-4 transition-all duration-500 border ${
        isSundowningActive
          ? 'bg-gradient-to-br from-[#2c2217] via-[#3a2d1d] to-[#251d14] text-[#FBF3E4] border-amber-600/40 shadow-lg ring-2 ring-amber-500/20'
          : 'bg-[#FDFBF7] text-[#222B27] border-[#E8E3D5] shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors ${
              isSundowningActive
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isSundowningActive ? (
              <Sunset className="w-5 h-5 animate-pulse" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm leading-tight font-bengali">
                {isSundowningActive ? 'গধূলিৰ শান্ত সুৰক্ষা • Sunset Sanctuary' : 'গধূলিৰ পৰিৱেশ • Circadian Sanctuary'}
              </h3>
              {isSundowningActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Amber Twilight Active
                </span>
              )}
            </div>
            <p
              className={`text-[11px] leading-tight ${
                isSundowningActive ? 'text-amber-200/80' : 'text-[#616F68]'
              }`}
            >
              Soothing warm glow & sensory comfort for evening sundowning restlessness.
            </p>
          </div>
        </div>

        {/* Manual toggle switch */}
        <button
          onClick={() => {
            const next = !isSundowningActive;
            onToggleSundowning(next);
            if (!next && ambientPlaying) {
              ambientSanctuary.stop();
              setAmbientPlaying(false);
            }
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            isSundowningActive
              ? 'bg-amber-500 text-stone-900 shadow hover:bg-amber-400'
              : 'bg-white border border-[#E8E3D5] text-[#2d493e] hover:border-[#567f6f]'
          }`}
        >
          {isSundowningActive ? 'Active' : 'Turn On'}
        </button>
      </div>

      {/* Evening Reassurance Quote */}
      <div
        className={`p-3 rounded-2xl border text-xs leading-relaxed font-bengali my-2 flex items-start justify-between gap-2.5 ${
          isSundowningActive
            ? 'bg-amber-950/40 border-amber-500/30 text-amber-100'
            : 'bg-amber-50/70 border-amber-200/60 text-amber-900'
        }`}
      >
        <div className="flex-1">
          <p className="font-medium">{eveningReassurance}</p>
        </div>
        <button
          onClick={speakEveningComfort}
          className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-amber-200 flex-shrink-0 transition-transform active:scale-95"
          title="Listen to evening reassurance"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Sensory Audio Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={toggleAmbientRain}
          className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            ambientPlaying
              ? 'bg-emerald-600 text-white shadow-md'
              : isSundowningActive
              ? 'bg-white/10 hover:bg-white/15 text-amber-100 border border-amber-500/20'
              : 'bg-white hover:bg-stone-50 text-[#2d493e] border border-[#E8E3D5]'
          }`}
        >
          {ambientPlaying ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stop Verandah Rain</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Play Verandah Rain Sound</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            ambientSanctuary.playSingingBowl();
            onPlayVoiceToast('প্ৰাৰ্থনাৰ শান্ত ঘণ্টাৰ ধ্বনি... (Temple singing bowl resonance.)');
          }}
          className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            isSundowningActive
              ? 'bg-white/10 hover:bg-white/15 text-amber-100 border border-amber-500/20'
              : 'bg-white hover:bg-stone-50 text-[#2d493e] border border-[#E8E3D5]'
          }`}
          title="Chime evening temple bell"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Evening Chime</span>
        </button>
      </div>
    </div>
  );
};
