import React, { useState } from 'react';
import { ChevronLeft, Volume2, Sparkles, Heart, HelpCircle, ArrowRight } from 'lucide-react';
import { LanguageCode, FamilyPerson } from '../types';
import { I18N } from '../data/i18n';

interface FaceRecallViewProps {
  currentLang: LanguageCode;
  onBackToHaven: () => void;
  onPlayVoiceToast: (msg?: string) => void;
}

const FAMILY_MEMBERS: FamilyPerson[] = [
  {
    id: 'ananya',
    name: 'অনন্যা (Ananya)',
    relation: 'Granddaughter living with you',
    location: 'Shillong Verandah',
    hint: 'She made your warm tulsi tea this morning and is sitting right beside you.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'maya',
    name: 'মায়া ভণ্টি (Maya)',
    relation: 'Younger Sister',
    location: 'Guwahati, Assam',
    hint: 'Your childhood companion who loves singing borgeet together.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'debo',
    name: 'দেৱজিত (Debo)',
    relation: 'Son in Bangalore',
    location: 'Bangalore, Karnataka',
    hint: 'Your loving son who calls every single evening at 7 PM without fail.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
];

export const FaceRecallView: React.FC<FaceRecallViewProps> = ({
  currentLang,
  onBackToHaven,
  onPlayVoiceToast,
}) => {
  const dict = I18N[currentLang] || I18N.as;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const currentPerson = FAMILY_MEMBERS[currentIndex];

  const handleAnswer = (choiceId: string) => {
    const isMatch = choiceId === currentPerson.id;
    if (isMatch) {
      setFeedback({
        isCorrect: true,
        text: `হয়, এয়া ${currentPerson.name}! (Yes, that is ${currentPerson.name}! Surrounded by endless love.)`,
      });
      onPlayVoiceToast(`হয়, এয়া ${currentPerson.name}! She is right here.`);
    } else {
      setFeedback({
        isCorrect: false,
        text: `A gentle hint: ${currentPerson.hint}`,
      });
      onPlayVoiceToast(currentPerson.hint);
    }
  };

  const nextPerson = () => {
    setFeedback(null);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % FAMILY_MEMBERS.length);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHaven}
          className="text-xs font-bold text-[#2d493e] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E3D5] shadow-sm hover:border-[#567f6f] active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{dict.navHaven}</span>
        </button>
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          স্মৃতি অনুভৱ • Memory Play
        </span>
      </div>

      {/* Main Face Card */}
      <div className="bg-white border border-[#E8E3D5] rounded-3xl p-5 shadow-sm text-center space-y-4">
        <h2 className="text-lg font-bold text-[#1A4335] font-bengali">
          {dict.faceTitle}
        </h2>

        {/* Circular portrait with warm frame */}
        <div className="relative w-40 h-40 mx-auto rounded-full ring-4 ring-[#c5dcd2] overflow-hidden shadow-md bg-stone-100">
          <img
            alt="Family member"
            className="w-full h-full object-cover"
            src={currentPerson.image}
          />
          <div className="absolute bottom-1 right-2 bg-white/95 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#1e332b] shadow border border-[#E8E3D5]">
            {currentPerson.location}
          </div>
        </div>

        {/* Hint button */}
        <div>
          <button
            onClick={() => {
              setShowHint(true);
              onPlayVoiceToast(currentPerson.hint);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f2f7f4] border border-[#c5dcd2] text-xs font-bold text-[#1e332b] hover:bg-[#e1ede7] active:scale-95 transition-all shadow-sm"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#3d6657]" />
            <span>{dict.faceHint}</span>
          </button>
          {showHint && (
            <p className="text-xs text-[#2d493e] mt-2 bg-[#FAF7EE] p-2.5 rounded-xl border border-[#E8E3D5] leading-relaxed">
              💡 {currentPerson.hint}
            </p>
          )}
        </div>

        {/* Choice buttons */}
        <div className="space-y-2 pt-1 text-left">
          <button
            onClick={() => handleAnswer('ananya')}
            className="w-full p-3.5 rounded-2xl bg-[#F5F2E8] border border-[#E8E3D5] hover:border-[#567f6f] flex items-center justify-between text-left transition-all active:scale-[0.99] group"
          >
            <span className="font-bold text-sm text-[#222B27] font-bengali">
              {dict.optAnanya}
            </span>
            <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#567f6f] font-bold text-xs shadow-sm group-hover:scale-110 transition-transform">
              🌸
            </span>
          </button>

          <button
            onClick={() => handleAnswer('maya')}
            className="w-full p-3.5 rounded-2xl bg-[#F5F2E8] border border-[#E8E3D5] hover:border-[#567f6f] flex items-center justify-between text-left transition-all active:scale-[0.99] group"
          >
            <span className="font-bold text-sm text-[#222B27] font-bengali">
              {dict.optMaya}
            </span>
            <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-stone-400 font-bold text-xs shadow-sm group-hover:scale-110 transition-transform">
              🌿
            </span>
          </button>

          <button
            onClick={() => handleAnswer('debo')}
            className="w-full p-3.5 rounded-2xl bg-[#F5F2E8] border border-[#E8E3D5] hover:border-[#567f6f] flex items-center justify-between text-left transition-all active:scale-[0.99] group"
          >
            <span className="font-bold text-sm text-[#222B27] font-bengali">
              {dict.optDebo}
            </span>
            <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-stone-400 font-bold text-xs shadow-sm group-hover:scale-110 transition-transform">
              🌾
            </span>
          </button>
        </div>

        {/* Feedback display */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs text-left flex items-center gap-2 transition-all ${
              feedback.isCorrect
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border border-amber-200 text-amber-900'
            }`}
          >
            <span className="text-base">✨</span>
            <span className="flex-1 font-medium leading-relaxed">{feedback.text}</span>
          </div>
        )}

        {/* Next face button */}
        <div className="pt-2">
          <button
            onClick={nextPerson}
            className="w-full py-2.5 px-4 bg-[#FAF7EE] border border-[#E8E3D5] hover:border-[#567f6f] rounded-2xl text-xs font-bold text-[#1e332b] flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Show another family photo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
