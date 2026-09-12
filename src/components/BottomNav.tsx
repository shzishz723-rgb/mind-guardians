import React from 'react';
import { Home, Bell, UserCheck, HeartHandshake, Mic } from 'lucide-react';
import { LanguageCode, TabType } from '../types';
import { I18N } from '../data/i18n';

interface BottomNavProps {
  currentTab: TabType;
  currentLang: LanguageCode;
  onSelectTab: (tab: TabType) => void;
  onOpenVoiceAssistant: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  currentLang,
  onSelectTab,
  onOpenVoiceAssistant,
}) => {
  const dict = I18N[currentLang] || I18N.as;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7EE]/95 backdrop-blur-md border-t border-[#E8E3D5] px-3 py-2">
      <div className="max-w-[430px] mx-auto flex items-center justify-around relative">
        {/* Haven */}
        <button
          onClick={() => onSelectTab('haven')}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === 'haven'
              ? 'text-[#1A4335] font-bold'
              : 'text-[#616F68] hover:text-[#222B27]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
              currentTab === 'haven'
                ? 'bg-[#e1ede7] text-[#1e332b]'
                : 'bg-transparent'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight">{dict.navHaven}</span>
        </button>

        {/* Reminders */}
        <button
          onClick={() => onSelectTab('reminders')}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === 'reminders'
              ? 'text-[#1A4335] font-bold'
              : 'text-[#616F68] hover:text-[#222B27]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
              currentTab === 'reminders'
                ? 'bg-[#e1ede7] text-[#1e332b]'
                : 'bg-transparent'
            }`}
          >
            <Bell className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight">{dict.navReminders}</span>
        </button>

        {/* Center Orb for Voice Assistant */}
        <button
          onClick={onOpenVoiceAssistant}
          className="relative -top-4 flex flex-col items-center group active:scale-95 transition-transform"
          title="Open Voice AI Assistant"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#1A4335] via-[#2d493e] to-[#567f6f] text-white flex items-center justify-center shadow-lg ring-4 ring-[#FAF7EE] group-hover:shadow-xl transition-all">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold text-[#1A4335] mt-0.5 tracking-tight">
            {dict.navVoice}
          </span>
        </button>

        {/* Face Recall */}
        <button
          onClick={() => onSelectTab('recall')}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === 'recall'
              ? 'text-[#1A4335] font-bold'
              : 'text-[#616F68] hover:text-[#222B27]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
              currentTab === 'recall'
                ? 'bg-[#e1ede7] text-[#1e332b]'
                : 'bg-transparent'
            }`}
          >
            <UserCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight">{dict.navRecall}</span>
        </button>

        {/* Caregiver */}
        <button
          onClick={() => onSelectTab('caregiver')}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === 'caregiver'
              ? 'text-[#1A4335] font-bold'
              : 'text-[#616F68] hover:text-[#222B27]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
              currentTab === 'caregiver'
                ? 'bg-[#e1ede7] text-[#1e332b]'
                : 'bg-transparent'
            }`}
          >
            <HeartHandshake className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight">{dict.navCaregiver}</span>
        </button>
      </div>
    </nav>
  );
};
