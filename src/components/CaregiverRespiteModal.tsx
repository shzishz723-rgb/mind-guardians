import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Wind, CheckCircle2, Play, Pause, RotateCcw, Sparkles, Smile, ShieldAlert } from 'lucide-react';
import { CaregiverCheckin } from '../types';
import { saveCaregiverCheckin } from '../lib/firebase';
import { ambientSanctuary, speakCompanionVoice } from '../lib/audioSpeech';

interface CaregiverRespiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayVoiceToast: (msg?: string) => void;
}

export const CaregiverRespiteModal: React.FC<CaregiverRespiteModalProps> = ({
  isOpen,
  onClose,
  onPlayVoiceToast,
}) => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'breathing'>('breathing');
  const [strainScore, setStrainScore] = useState<number>(2);
  const [energyLevel, setEnergyLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [emotionalState, setEmotionalState] = useState<string>('Calm but slightly tired');
  const [notes, setNotes] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Breathing state
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [phaseSeconds, setPhaseSeconds] = useState<number>(4);
  const [cycleCount, setCycleCount] = useState<number>(0);

  const breathTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      stopBreathing();
    }
  }, [isOpen]);

  const startBreathing = () => {
    setIsBreathingActive(true);
    setBreathingPhase('Inhale');
    setPhaseSeconds(4);
    setCycleCount(0);
    ambientSanctuary.playSingingBowl();

    let currentSec = 4;
    let phaseIndex = 0; // 0: Inhale, 1: Hold, 2: Exhale, 3: Pause
    const phases: Array<'Inhale' | 'Hold' | 'Exhale' | 'Pause'> = ['Inhale', 'Hold', 'Exhale', 'Pause'];

    breathTimerRef.current = setInterval(() => {
      currentSec -= 1;
      if (currentSec <= 0) {
        phaseIndex = (phaseIndex + 1) % 4;
        const nextPhase = phases[phaseIndex];
        setBreathingPhase(nextPhase);
        currentSec = 4;

        if (nextPhase === 'Inhale') {
          ambientSanctuary.playSingingBowl();
          setCycleCount((c) => c + 1);
        }
      }
      setPhaseSeconds(currentSec);
    }, 1000);
  };

  const stopBreathing = () => {
    if (breathTimerRef.current) {
      clearInterval(breathTimerRef.current);
      breathTimerRef.current = null;
    }
    setIsBreathingActive(false);
  };

  const handleSaveCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCaregiverCheckin({
      date: new Date().toLocaleDateString(),
      strainScore,
      energyLevel,
      emotionalState,
      notes,
      timestamp: new Date().toISOString(),
    });
    setSavedSuccess(true);
    onPlayVoiceToast('Caregiver check-in saved. Thank you for caring for yourself.');
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-[430px] h-[90vh] sm:h-[650px] bg-[#FAF7EE] rounded-t-[36px] sm:rounded-[36px] border border-[#E8E3D5] shadow-2xl flex flex-col overflow-hidden text-[#222B27]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#1A4335] to-[#2D493E] text-white flex items-center justify-between border-b border-[#567f6f]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-300">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white font-bengali">
                সেৱকৰ শান্ত নিকেতন • Caregiver Micro-Respite
              </h3>
              <p className="text-[10px] text-[#e1ede7]">
                Rest & renewal for devoted family caregivers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="p-3 bg-white border-b border-[#E8E3D5] flex gap-2">
          <button
            onClick={() => setActiveTab('breathing')}
            className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'breathing'
                ? 'bg-[#1A4335] text-white shadow-sm'
                : 'bg-[#FAF7EE] text-[#2d493e] hover:bg-[#eae5d8]'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>2-Min Micro-Respite</span>
          </button>

          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'checkin'
                ? 'bg-[#1A4335] text-white shadow-sm'
                : 'bg-[#FAF7EE] text-[#2d493e] hover:bg-[#eae5d8]'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Daily Burnout Check-in</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'breathing' ? (
            <div className="space-y-5 text-center flex flex-col items-center">
              <div>
                <h4 className="font-bold text-base text-[#1A4335]">
                  4-4-4 Box Breathing Sanctuary
                </h4>
                <p className="text-xs text-[#616F68] mt-1 max-w-[280px]">
                  Lowers cortisol and grounds your nervous system during demanding care moments.
                </p>
              </div>

              {/* Visual Expanding Circle */}
              <div className="relative w-52 h-52 flex items-center justify-center my-3">
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                    breathingPhase === 'Inhale'
                      ? 'bg-emerald-200/50 scale-100 ring-8 ring-emerald-400/30'
                      : breathingPhase === 'Hold'
                      ? 'bg-emerald-300/60 scale-105 ring-8 ring-emerald-500/40'
                      : breathingPhase === 'Exhale'
                      ? 'bg-emerald-100/40 scale-75 ring-4 ring-emerald-300/20'
                      : 'bg-stone-100/40 scale-70'
                  }`}
                />
                <div className="relative z-10 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
                    {isBreathingActive ? breathingPhase : 'Ready'}
                  </span>
                  <span className="text-4xl font-extrabold text-[#1A4335]">
                    {isBreathingActive ? phaseSeconds : '4'}
                  </span>
                  <span className="text-[10px] text-[#567f6f] block font-medium mt-1">
                    {isBreathingActive ? `Cycle ${cycleCount + 1}` : 'Seconds'}
                  </span>
                </div>
              </div>

              {/* Breath Controls */}
              <div className="flex items-center gap-3">
                {isBreathingActive ? (
                  <button
                    onClick={stopBreathing}
                    className="py-2.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition-all flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause Exercise</span>
                  </button>
                ) : (
                  <button
                    onClick={startBreathing}
                    className="py-2.5 px-6 rounded-2xl bg-[#1A4335] hover:bg-[#2d493e] text-white text-xs font-bold shadow transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Begin Breathing (2 min)</span>
                  </button>
                )}
              </div>

              {/* Affirmation Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E3D5] text-xs text-[#222B27] leading-relaxed text-left w-full shadow-sm">
                <div className="flex items-center gap-1.5 text-[#1A4335] font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Validation for You, Ananya:</span>
                </div>
                <p className="italic text-[#567f6f]">
                  "You cannot pour from an empty cup. Caring for your own breath is caring for Aita."
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveCheckin} className="space-y-4 text-left">
              <div>
                <h4 className="font-bold text-base text-[#1A4335]">
                  Daily Emotional & Fatigue Log
                </h4>
                <p className="text-xs text-[#616F68]">
                  Track your emotional reserves to prevent stealth burnout and compassion fatigue.
                </p>
              </div>

              {savedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Saved to your caregiver health profile!</span>
                </div>
              )}

              {/* Strain Score Slider */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8E3D5] space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#1A4335]">
                    Current Strain Level (1 = Serene, 5 = Overwhelmed)
                  </label>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {strainScore} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={strainScore}
                  onChange={(e) => setStrainScore(Number(e.target.value))}
                  className="w-full accent-[#1A4335] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#616F68]">
                  <span>1: Centered</span>
                  <span>3: Managing</span>
                  <span>5: Exhausted</span>
                </div>
              </div>

              {/* Energy Level */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8E3D5] space-y-2">
                <label className="text-xs font-bold text-[#1A4335] block">
                  Physical Energy Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'moderate', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnergyLevel(lvl)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        energyLevel === lvl
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/20'
                          : 'bg-[#FAF7EE] border-[#E8E3D5] text-[#222B27]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emotional State */}
              <div>
                <label className="text-xs font-bold text-[#1A4335] block mb-1">
                  Dominant Feeling Right Now
                </label>
                <input
                  type="text"
                  value={emotionalState}
                  onChange={(e) => setEmotionalState(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#E8E3D5] bg-white focus:outline-none focus:border-[#567f6f]"
                  placeholder="e.g. Grateful, anxious about evening sundowning, peaceful"
                />
              </div>

              {/* Caregiver Note */}
              <div>
                <label className="text-xs font-bold text-[#1A4335] block mb-1">
                  Private Caregiver Reflection
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#E8E3D5] bg-white focus:outline-none focus:border-[#567f6f]"
                  placeholder="What was one small moment of grace today?"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#1A4335] hover:bg-[#2d493e] text-white text-xs font-bold shadow transition-all active:scale-95"
              >
                Log Today's Caregiver Check-in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
