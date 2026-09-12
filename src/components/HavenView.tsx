import React from 'react';
import { Play, ChevronRight, Sparkles, Mic, Volume2, Heart, Wind, Camera, Sun } from 'lucide-react';
import { LanguageCode, TabType, UserProfile } from '../types';
import { I18N } from '../data/i18n';
import { LocationAccessCard } from './LocationAccessCard';
import { SundowningBanner } from './SundowningBanner';
import { CaregiverVoiceAnchors } from './CaregiverVoiceAnchors';
import { HighVisibilitySosButton } from './HighVisibilitySosButton';

interface HavenViewProps {
  currentLang: LanguageCode;
  userProfile: UserProfile;
  isSundowningActive: boolean;
  onToggleSundowning: (active: boolean) => void;
  onNavigateTab: (tab: TabType) => void;
  onPlayVoiceNote: () => void;
  onOpenVoiceAssistant: () => void;
  onOpenReminiscence: () => void;
  onOpenRespite: () => void;
  onPlayVoiceToast: (msg?: string) => void;
  onSosTriggered: (data: { lat: number; lng: number; timestamp: string }) => void;
}

export const HavenView: React.FC<HavenViewProps> = ({
  currentLang,
  userProfile,
  isSundowningActive,
  onToggleSundowning,
  onNavigateTab,
  onPlayVoiceNote,
  onOpenVoiceAssistant,
  onOpenReminiscence,
  onOpenRespite,
  onPlayVoiceToast,
  onSosTriggered,
}) => {
  const dict = I18N[currentLang] || I18N.as;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Sundowning Circadian Evening Banner */}
      <SundowningBanner
        currentLang={currentLang}
        isSundowningActive={isSundowningActive}
        onToggleSundowning={onToggleSundowning}
        onPlayVoiceToast={onPlayVoiceToast}
      />

      {/* Hero Card */}
      <div
        className={`text-white rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all duration-500 ${
          isSundowningActive
            ? 'bg-gradient-to-br from-[#3b2716] via-[#2d1e11] to-[#1e140b] border border-amber-600/30'
            : 'bg-gradient-to-br from-[#2d493e] to-[#1e332b]'
        }`}
      >
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <span className="text-[11px] bg-white/20 text-[#f2f7f4] px-2.5 py-0.5 rounded-full font-medium inline-block mb-2">
          {isSundowningActive ? 'গধূলিৰ সময় • Twilight Peace' : dict.dayBadge}
        </span>
        <h1 className="text-2xl font-bold tracking-tight font-bengali">
          {dict.heroGreeting}
        </h1>
        <p className="text-xs text-[#e1ede7] mt-1 leading-relaxed">
          {dict.heroSub}
        </p>

        <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-[#e1ede7]">
              {dict.voiceReady}
            </span>
          </div>
          <button
            onClick={onPlayVoiceNote}
            className="px-3 py-1 rounded-full bg-white text-[#1e332b] text-xs font-bold hover:bg-[#f2f7f4] flex items-center gap-1 shadow-sm active:scale-95 transition-all"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{dict.btnPlay}</span>
          </button>
        </div>
      </div>

      {/* High-Visibility Emergency SOS Lifeline Button */}
      <HighVisibilitySosButton
        userProfile={userProfile}
        currentLang={currentLang}
        onSosTriggered={onSosTriggered}
        variant="card"
      />

      {/* Voice Companion Highlight Banner */}
      <div
        onClick={onOpenVoiceAssistant}
        className="bg-gradient-to-r from-[#1A4335] to-[#2d493e] text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all border border-[#567f6f]/40 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-300 relative">
            <Mic className="w-5 h-5 text-emerald-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#1A4335]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white tracking-wide">
                {dict.aiAssistantTitle}
              </h3>
              <span className="text-[9px] bg-emerald-400/20 text-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                Fast Gemini
              </span>
            </div>
            <p className="text-[11px] text-white/80 mt-0.5">
              {dict.aiAssistantSub}
            </p>
          </div>
        </div>
        <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white/90 group-hover:bg-white/25 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Quick Action Tiles: Reminiscence & Caregiver Respite */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onOpenReminiscence}
          className="p-3.5 rounded-3xl bg-white border border-[#E8E3D5] hover:border-[#567f6f] shadow-sm flex flex-col items-start text-left group transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mb-2 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[#1A4335] leading-tight font-bengali">
            সোণালী স্মৃতিৰ ফটো
          </span>
          <span className="text-[10px] text-[#616F68] mt-0.5">
            Reminiscence Cards & Prompts
          </span>
        </button>

        <button
          onClick={onOpenRespite}
          className="p-3.5 rounded-3xl bg-white border border-[#E8E3D5] hover:border-[#567f6f] shadow-sm flex flex-col items-start text-left group transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 mb-2 group-hover:scale-105 transition-transform">
            <Wind className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[#1A4335] leading-tight font-bengali">
            সেৱকৰ নিকেতন
          </span>
          <span className="text-[10px] text-[#616F68] mt-0.5">
            2-Min Respite & Burnout Log
          </span>
        </button>
      </div>

      {/* Caregiver Voice Note Anchors (Familiar Loved Ones) */}
      <CaregiverVoiceAnchors
        currentLang={currentLang}
        onPlayVoiceToast={onPlayVoiceToast}
      />

      {/* Sanctuary Safe Zone Dignity Anchor & SOS Broadcast */}
      <LocationAccessCard currentMode="patient" userProfile={userProfile} />

      {/* 4 Dignified Choice Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#616F68] px-1">
          {dict.choicesTitle}
        </h2>

        {/* Card 1: Reminders */}
        <button
          onClick={() => onNavigateTab('reminders')}
          className="w-full text-left bg-white border border-[#E8E3D5] rounded-3xl p-4 shadow-sm hover:border-[#567f6f] active:scale-[0.99] transition-all flex items-center gap-3.5 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
            ☕
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
              Next: 8:30 AM
            </span>
            <h3 className="text-sm font-bold text-[#222B27] font-bengali">
              {dict.card1Title}
            </h3>
            <p className="text-[11px] text-[#616F68] mt-0.5">
              {dict.card1Sub}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] bg-[#e1ede7] text-[#1e332b] px-2 py-0.5 rounded-md font-semibold">
                2 of 3 done
              </span>
              <span className="text-[10px] text-stone-500">
                Tulsi tea & drops
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#F5F2E8] flex items-center justify-center text-stone-400 group-hover:text-stone-700 flex-shrink-0">
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </button>

        {/* Card 2: Face Recall */}
        <button
          onClick={() => onNavigateTab('recall')}
          className="w-full text-left bg-white border border-[#E8E3D5] rounded-3xl p-4 shadow-sm hover:border-[#567f6f] active:scale-[0.99] transition-all flex items-center gap-3.5 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
            👵
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-[#567f6f] uppercase tracking-wide">
              Family Memory
            </span>
            <h3 className="text-sm font-bold text-[#222B27] font-bengali">
              {dict.card2Title}
            </h3>
            <p className="text-[11px] text-[#616F68] mt-0.5">
              {dict.card2Sub}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                Warm voice hints
              </span>
              <span className="text-[10px] text-stone-500">Zero pressure</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#F5F2E8] flex items-center justify-center text-stone-400 group-hover:text-stone-700 flex-shrink-0">
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </button>

        {/* Card 3: Pattern Harmony */}
        <button
          onClick={() => onNavigateTab('sequence')}
          className="w-full text-left bg-white border border-[#E8E3D5] rounded-3xl p-4 shadow-sm hover:border-[#567f6f] active:scale-[0.99] transition-all flex items-center gap-3.5 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
            🌿
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wide">
              Brain Rhythm
            </span>
            <h3 className="text-sm font-bold text-[#222B27] font-bengali">
              {dict.card3Title}
            </h3>
            <p className="text-[11px] text-[#616F68] mt-0.5">
              {dict.card3Sub}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-semibold">
                Tea leaves & Orchids
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#F5F2E8] flex items-center justify-center text-stone-400 group-hover:text-stone-700 flex-shrink-0">
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </button>

        {/* Card 4: Memory Vault */}
        <button
          onClick={() => onNavigateTab('vault')}
          className="w-full text-left bg-white border border-[#E8E3D5] rounded-3xl p-4 shadow-sm hover:border-[#567f6f] active:scale-[0.99] transition-all flex items-center gap-3.5 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
            🎶
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">
              Comfort Audio
            </span>
            <h3 className="text-sm font-bold text-[#222B27] font-bengali">
              {dict.card4Title}
            </h3>
            <p className="text-[11px] text-[#616F68] mt-0.5">
              {dict.card4Sub}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-semibold">
                Shillong Verandah
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#F5F2E8] flex items-center justify-center text-stone-400 group-hover:text-stone-700 flex-shrink-0">
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </button>
      </div>

      {/* Gentle Veranda Ambient Player Pill */}
      <div className="bg-[#FAF7EE] border border-[#E8E3D5] rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#e1ede7] text-[#1e332b] flex items-center justify-center text-xs">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#1A4335] block leading-tight">
              Shillong Morning Atmosphere
            </span>
            <span className="text-[10px] text-[#616F68]">
              Gentle pine breeze & distant church chimes
            </span>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('vault')}
          className="text-[10px] font-bold text-[#3d6657] bg-white border border-[#c5dcd2] px-2.5 py-1 rounded-full hover:bg-[#f2f7f4]"
        >
          Open Vault
        </button>
      </div>
    </div>
  );
};
