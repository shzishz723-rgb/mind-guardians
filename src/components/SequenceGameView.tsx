import React, { useState } from 'react';
import { ChevronLeft, RotateCcw, Sparkles } from 'lucide-react';
import { LanguageCode } from '../types';
import { I18N } from '../data/i18n';

interface SequenceGameViewProps {
  currentLang: LanguageCode;
  onBackToHaven: () => void;
  onPlayVoiceToast: (msg?: string) => void;
}

const SYMBOLS = [
  { char: '🍃', label: 'Leaf', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  { char: '🌸', label: 'Orchid', bg: 'bg-rose-50 border-rose-200 text-rose-800' },
  { char: '🍵', label: 'Tea', bg: 'bg-amber-50 border-amber-200 text-amber-800' },
];

export const SequenceGameView: React.FC<SequenceGameViewProps> = ({
  currentLang,
  onBackToHaven,
  onPlayVoiceToast,
}) => {
  const dict = I18N[currentLang] || I18N.as;
  const [selectedSequence, setSelectedSequence] = useState<string[]>([]);
  const targetPattern = ['🍃', '🌸', '🍵'];

  const handleTap = (sym: string) => {
    if (selectedSequence.length >= 3) return;
    const nextSeq = [...selectedSequence, sym];
    setSelectedSequence(nextSeq);

    if (nextSeq.length === 3) {
      const isCorrect =
        nextSeq[0] === targetPattern[0] &&
        nextSeq[1] === targetPattern[1] &&
        nextSeq[2] === targetPattern[2];

      if (isCorrect) {
        onPlayVoiceToast('খুব সুন্দৰ! শান্ত ছন্দ সম্পন্ন হ’ল। (Harmony completed peacefully!)');
      } else {
        onPlayVoiceToast('A gentle try! Tap Clear to start peacefully again.');
      }
    }
  };

  const handleReset = () => {
    setSelectedSequence([]);
  };

  const isCompleted = selectedSequence.length === 3;
  const isMatch =
    isCompleted &&
    selectedSequence[0] === targetPattern[0] &&
    selectedSequence[1] === targetPattern[1] &&
    selectedSequence[2] === targetPattern[2];

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
        <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
          ছন্দ খেলা • Pattern Play
        </span>
      </div>

      <div className="bg-white border border-[#E8E3D5] rounded-3xl p-5 shadow-sm space-y-4 text-center">
        <div>
          <h2 className="text-lg font-bold text-[#1A4335] font-bengali">
            {dict.seqTitle}
          </h2>
          <p className="text-xs text-[#616F68] mt-0.5 font-medium">
            {dict.seqInstruct}
          </p>
        </div>

        {/* Target Pattern */}
        <div className="bg-[#f2f7f4] border border-[#c5dcd2] rounded-2xl p-3">
          <span className="text-[10px] font-bold text-[#1e332b] uppercase tracking-wider block mb-1">
            Target Harmony
          </span>
          <div className="flex justify-center items-center gap-3 text-2xl py-1">
            {targetPattern.map((p, i) => (
              <React.Fragment key={i}>
                <span className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-[#c5dcd2]">
                  {p}
                </span>
                {i < targetPattern.length - 1 && (
                  <span className="text-[#9cc3b4] text-xs">➔</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Slots */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((idx) => {
            const val = selectedSequence[idx];
            return (
              <div
                key={idx}
                className={`h-14 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all ${
                  val
                    ? 'border-2 border-[#567f6f] bg-white text-[#1e332b] shadow-sm'
                    : 'border-2 border-dashed border-stone-300 bg-[#F5F2E8] text-stone-400 text-xl'
                }`}
              >
                {val || idx + 1}
              </div>
            );
          })}
        </div>

        {/* Tap Choices */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {SYMBOLS.map((item) => (
            <button
              key={item.char}
              onClick={() => handleTap(item.char)}
              disabled={selectedSequence.length >= 3}
              className={`py-3 rounded-2xl border hover:opacity-90 active:scale-95 transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed ${item.bg}`}
            >
              {item.char}
              <span className="block text-[10px] font-bold mt-0.5">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleReset}
          className="text-xs font-semibold text-[#2d493e] hover:underline flex items-center justify-center gap-1 mx-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear & Start Again</span>
        </button>

        {/* Success Alert */}
        {isCompleted && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all ${
              isMatch
                ? 'bg-teal-50 border border-teal-200 text-teal-900'
                : 'bg-amber-50 border border-amber-200 text-amber-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>
              {isMatch
                ? dict.seqSuccess
                : 'Gentle sequence finished. Tap clear to harmonize again!'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
