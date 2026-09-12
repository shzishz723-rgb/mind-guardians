import React from 'react';
import { Sun, HeartHandshake, Globe, User } from 'lucide-react';
import { LanguageCode, Mode, UserProfile } from '../types';
import { I18N } from '../data/i18n';
import { HighVisibilitySosButton } from './HighVisibilitySosButton';

interface HeaderProps {
  currentLang: LanguageCode;
  currentMode: Mode;
  userProfile: UserProfile;
  onSelectLangClick: () => void;
  onModeChange: (mode: Mode) => void;
  onOpenProfileModal?: () => void;
  onSosTriggered?: (data: { lat: number; lng: number; timestamp: string }) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  currentMode,
  userProfile,
  onSelectLangClick,
  onModeChange,
  onOpenProfileModal,
  onSosTriggered,
}) => {
  const dict = I18N[currentLang] || I18N.as;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7EE]/95 backdrop-blur-md px-4 pt-3.5 pb-2.5 border-b border-[#E8E3D5]">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        {/* Brand & Live Sync status */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#567f6f] text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden flex-shrink-0">
            <img
              alt="MindSync"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=80&q=80"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-base tracking-tight text-[#1A4335]">
                MindSync
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-[#616F68] mt-0.5 font-medium">
              {dict.headerSync}
            </p>
          </div>
        </div>

        {/* SOS Quick Button, Language Selector Button & Avatar */}
        <div className="flex items-center gap-1.5">
          {onSosTriggered && (
            <HighVisibilitySosButton
              userProfile={userProfile}
              currentLang={currentLang}
              onSosTriggered={onSosTriggered}
              variant="compact"
            />
          )}

          <button
            onClick={onSelectLangClick}
            className="text-xs px-2 py-1 rounded-full bg-[#F5F2E8] border border-[#E8E3D5] text-[#222B27] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-transform hover:border-[#567f6f]"
            title="Select Heart Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#3d6657]" />
            <span className="text-[#1e332b] text-[11px]">{dict.pill}</span>
            <span className="text-stone-400 text-[8px]">▼</span>
          </button>

          <button
            id="btn-header-profile"
            onClick={onOpenProfileModal}
            className="w-8 h-8 rounded-full ring-2 ring-[#c5dcd2] overflow-hidden bg-stone-200 flex-shrink-0 shadow-inner hover:ring-[#1A4335] active:scale-95 transition-all relative group"
            title="Profile Registration & Safe Zone"
          >
            <img
              alt={currentMode === 'patient' ? 'Aita Minoti' : 'Ananya Baruah'}
              className="w-full h-full object-cover"
              src={
                currentMode === 'patient'
                  ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
              }
            />
          </button>
        </div>
      </div>

      {/* Mode Switcher Pill */}
      <div className="bg-[#F5F2E8] p-1 rounded-2xl flex items-center border border-[#E8E3D5]">
        <button
          onClick={() => onModeChange('patient')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            currentMode === 'patient'
              ? 'bg-white text-[#1A4335] shadow-sm'
              : 'text-[#616F68] hover:text-[#222B27]'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-[#3d6657]" />
          <span>{dict.tabPatient}</span>
          <span className="text-[9px] bg-[#e1ede7] text-[#1e332b] font-bold px-1.5 py-0.5 rounded-full">
            Aita Minoti
          </span>
        </button>
        <button
          onClick={() => onModeChange('caregiver')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
            currentMode === 'caregiver'
              ? 'bg-white text-[#1A4335] shadow-sm font-bold'
              : 'text-[#616F68] hover:text-[#222B27]'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5 text-[#3d6657]" />
          <span>{dict.tabCaregiver}</span>
        </button>
      </div>
    </header>
  );
};
