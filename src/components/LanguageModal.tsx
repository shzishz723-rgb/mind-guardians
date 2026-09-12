import React from 'react';
import { Globe, Check, X } from 'lucide-react';
import { LanguageCode } from '../types';
import { I18N } from '../data/i18n';

interface LanguageModalProps {
  isOpen: boolean;
  currentLang: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onClose: () => void;
}

const LANGUAGES: Array<{ code: LanguageCode; label: string; sub: string }> = [
  { code: 'as', label: 'অসমীয়া (Assamese)', sub: 'Upper Assam & Kamrupi dialects' },
  { code: 'kha', label: 'Ka Ktien Khasi (Khasi)', sub: 'Shillong & Sohra Highlands' },
  { code: 'bdo', label: 'बोड़ो (Bodo)', sub: 'Bodoland Regional Phrasing' },
  { code: 'mni', label: 'মৈতৈলোন্ (Manipuri)', sub: 'Imphal Valley Rhythm' },
  { code: 'gro', label: 'A·chik (Garo)', sub: 'Garo Hills Traditions' },
  { code: 'lus', label: 'Mizo ṭawng (Mizo)', sub: 'Aizawl Standard Dialect' },
  { code: 'en', label: 'English', sub: 'Calm Hearth Phrasing' },
  { code: 'hi', label: 'हिन्दी (Hindi)', sub: 'Devanagari Friendly & Warm' },
];

export const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  currentLang,
  onSelectLanguage,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-[390px] bg-[#FAF7EE] rounded-[32px] border border-[#E8E3D5] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E8E3D5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#e1ede7] text-[#1e332b] flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#1A4335]">
                Heart Languages of the Hills
              </h3>
              <p className="text-[10px] text-[#616F68]">
                Select Aita's native comforting dialect
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F5F2E8] border border-[#E8E3D5] flex items-center justify-center text-stone-500 hover:text-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1e332b] text-white border-[#1e332b] shadow-sm'
                    : 'bg-white border-[#E8E3D5] hover:bg-[#F5F2E8] text-stone-800'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold font-bengali">
                    {lang.label}
                  </h4>
                  <p
                    className={`text-[10px] mt-0.5 ${
                      isSelected ? 'text-emerald-200' : 'text-[#616F68]'
                    }`}
                  >
                    {lang.sub}
                  </p>
                </div>
                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-emerald-400 text-[#1e332b] flex items-center justify-center font-bold text-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
