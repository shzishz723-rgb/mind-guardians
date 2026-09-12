import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Radio, Check, PhoneCall } from 'lucide-react';
import { UserProfile, LanguageCode } from '../types';
import { saveSosAlert } from '../lib/firebase';
import { speakCompanionVoice, getUnlockedAudioContext } from '../lib/audioSpeech';

interface HighVisibilitySosButtonProps {
  userProfile: UserProfile;
  currentLang: LanguageCode;
  onSosTriggered: (data: { lat: number; lng: number; timestamp: string }) => void;
  variant?: 'card' | 'compact';
}

const HOLD_DURATION_MS = 2500; // 2.5 seconds hold to prevent accidental triggers

export const HighVisibilitySosButton: React.FC<HighVisibilitySosButtonProps> = ({
  userProfile,
  currentLang,
  onSosTriggered,
  variant = 'card',
}) => {
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isTriggered, setIsTriggered] = useState<boolean>(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioOscillatorRef = useRef<OscillatorNode | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        cancelAnimationFrame(holdTimerRef.current);
      }
      stopHoldTone();
    };
  }, []);

  // Play gentle escalating tone during hold
  const startHoldTone = () => {
    try {
      const ctx = getUnlockedAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + HOLD_DURATION_MS / 1000);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + HOLD_DURATION_MS / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioOscillatorRef.current = osc;
    } catch (_) {}
  };

  const stopHoldTone = () => {
    try {
      if (audioOscillatorRef.current) {
        audioOscillatorRef.current.stop();
        audioOscillatorRef.current.disconnect();
        audioOscillatorRef.current = null;
      }
    } catch (_) {}
  };

  // Play final success confirmation chime
  const playTriggerSuccessChime = () => {
    try {
      const ctx = getUnlockedAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.1);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch (_) {}
  };

  // Handle start of long press
  const handleHoldStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isTriggered) return;

    setIsHolding(true);
    setHoldProgress(0);
    setCancelFeedback(null);
    startTimeRef.current = Date.now();

    // Haptic buzz on initial touch
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }

    startHoldTone();

    const updateLoop = () => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        // Trigger emergency action
        triggerSos();
      } else {
        holdTimerRef.current = requestAnimationFrame(updateLoop);
      }
    };

    holdTimerRef.current = requestAnimationFrame(updateLoop);
  };

  // Handle early cancellation of press
  const handleHoldEnd = () => {
    if (!isHolding || isTriggered) return;

    setIsHolding(false);
    stopHoldTone();

    if (holdTimerRef.current) {
      cancelAnimationFrame(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (holdProgress > 0 && holdProgress < 100) {
      setCancelFeedback('Release cancelled • Released early');
      setTimeout(() => setCancelFeedback(null), 2500);
    }

    setHoldProgress(0);
    startTimeRef.current = null;
  };

  // Execute the automated emergency SMS dispatch
  const triggerSos = async () => {
    stopHoldTone();
    setIsHolding(false);
    setIsTriggered(true);
    setHoldProgress(100);

    // Haptic confirmation
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 300]);
    }

    playTriggerSuccessChime();

    const lat = userProfile.safeZoneLat || 25.5788;
    const lng = userProfile.safeZoneLng || 91.8933;
    const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const emergencyPhone = userProfile.emergencyPhone || userProfile.caregiverPhone || '+91 98640 67890';
    const patientName = userProfile.patientCallSign || userProfile.patientName || 'Aita Minoti';

    const alertMessage = `🚨 EMERGENCY ALERT: ${patientName} has triggered an SOS alert via MindSync in ${userProfile.homeCity || 'Shillong'}. Location: ${mapUrl}. Please respond immediately.`;

    const cleanPhone = emergencyPhone.replace(/[^\d+]/g, '');
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const smsSeparator = isIOS ? '&' : '?';
    const smsUrl = `sms:${cleanPhone}${smsSeparator}body=${encodeURIComponent(alertMessage)}`;

    // Save alert to database
    await saveSosAlert({
      timestamp: new Date().toISOString(),
      status: 'triggered',
      contactPhone: emergencyPhone,
      patientName,
      message: alertMessage,
      latitude: lat,
      longitude: lng,
    });

    // Provide warm spoken voice reassurance to soothe panic
    speakCompanionVoice(
      'আইতা, ভয় নকৰিব। অনন্যা আৰু জৰুৰীকালীন পৰিয়াললৈ মেছেজ আৰু আপোনাৰ অৱস্থান প্ৰেৰণ কৰা হৈছে। সহায় শীঘ্ৰেই আহি আছে। (Aita, do not worry. Your family and emergency contacts have been sent your live location. Help is on the way.)',
      'Kore'
    );

    // Open native SMS composer automatically
    try {
      window.location.href = smsUrl;
    } catch (_) {}

    // Notify parent to display the emergency status modal
    onSosTriggered({
      lat,
      lng,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    // Reset button after short delay
    setTimeout(() => {
      setIsTriggered(false);
      setHoldProgress(0);
    }, 4000);
  };

  const remainingSeconds = Math.max(1, Math.ceil(((100 - holdProgress) / 100) * (HOLD_DURATION_MS / 1000)));

  if (variant === 'compact') {
    return (
      <div className="relative select-none touch-none">
        <button
          id="btn-compact-sos"
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
          onTouchCancel={handleHoldEnd}
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          className={`relative px-3 py-1.5 rounded-full font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md overflow-hidden border ${
            isHolding
              ? 'bg-rose-700 text-white border-white ring-2 ring-rose-400 scale-95'
              : 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-rose-300/40 hover:brightness-110'
          }`}
          title="Long-press for 3 seconds to send automated SOS SMS"
        >
          {/* Fill background for progress */}
          <div
            className="absolute inset-0 bg-white/30 transition-all duration-75"
            style={{ width: `${holdProgress}%` }}
          />
          <ShieldAlert className={`w-3.5 h-3.5 relative z-10 ${isHolding ? 'animate-ping' : ''}`} />
          <span className="relative z-10 tracking-wider">
            {isHolding ? `HOLD ${remainingSeconds}s` : 'SOS'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full relative select-none touch-none">
      {/* High Visibility Long-Press Card Container */}
      <div
        id="card-high-visibility-sos"
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        onTouchCancel={handleHoldEnd}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        className={`relative overflow-hidden rounded-3xl p-4 transition-all duration-200 cursor-pointer shadow-lg border-2 ${
          isHolding
            ? 'bg-gradient-to-r from-red-700 via-rose-700 to-red-800 border-white ring-4 ring-rose-400/60 scale-[0.99]'
            : isTriggered
            ? 'bg-emerald-700 border-emerald-300 text-white'
            : 'bg-gradient-to-r from-[#BA1A1A] via-[#C0001F] to-[#990011] border-rose-400/50 hover:border-rose-300'
        } text-white`}
      >
        {/* Active Long-Press Fill Bar */}
        <div
          className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-75 pointer-events-none"
          style={{ width: `${holdProgress}%` }}
        />

        {/* Ambient Pulsing Radar Ring */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none animate-pulse" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {/* High-visibility Warning Badge with Radial Countdown */}
            <div className="relative w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-white border border-white/30 shadow-inner">
              {isHolding ? (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-lg font-black leading-none">{remainingSeconds}</span>
                  <span className="text-[9px] font-bold uppercase tracking-tight text-rose-100">sec</span>
                </div>
              ) : isTriggered ? (
                <Check className="w-7 h-7 text-emerald-200 animate-bounce" />
              ) : (
                <ShieldAlert className="w-7 h-7 text-white drop-shadow-md animate-pulse" />
              )}

              {/* Circular SVG Ring when holding */}
              {isHolding && (
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    strokeDasharray="150"
                    strokeDashoffset={150 - (150 * holdProgress) / 100}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              )}
            </div>

            {/* Label and Guidance */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black tracking-widest uppercase bg-white/25 px-2 py-0.5 rounded-full text-white">
                  {isHolding ? 'HOLD FIRMLY...' : isTriggered ? 'SENT!' : 'HIGH VISIBILITY SOS'}
                </span>
                <span className="text-[11px] text-rose-200 font-medium">
                  To: {userProfile.emergencyPhone || userProfile.caregiverPhone || '+91 98640 67890'}
                </span>
              </div>

              <h3 className="text-base font-extrabold tracking-tight font-bengali leading-tight">
                {isTriggered
                  ? 'জৰুৰীকালীন বাৰ্তা প্ৰেৰণ কৰা হʼল!'
                  : isHolding
                  ? `ধৰি ৰাখক... (${remainingSeconds} ছেকেণ্ড)`
                  : 'জৰুৰীকালীন সাহায্য • Emergency SOS'}
              </h3>

              <p className="text-xs text-rose-100 font-medium mt-0.5 leading-snug">
                {isHolding
                  ? 'প্ৰেৰণ কৰিবলৈ আঙুলি এৰি নিদিব (Hold without releasing)'
                  : cancelFeedback
                  ? cancelFeedback
                  : 'প্ৰেৰণৰ বাবে বুটামটো ৩ ছেকেণ্ড ধৰি ৰাখক (Long-press 3s to auto-SMS location)'}
              </p>
            </div>
          </div>

          {/* Icon indicator */}
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl bg-white/20 text-white font-bold text-xs border border-white/20">
            {isHolding ? (
              <Radio className="w-5 h-5 text-white animate-spin" />
            ) : (
              <PhoneCall className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
