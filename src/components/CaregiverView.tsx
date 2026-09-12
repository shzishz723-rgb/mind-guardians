import React, { useState, useEffect } from 'react';
import { Heart, Activity, Globe, Users, Sparkles, Send, PhoneCall, ShieldAlert, CheckCircle2, UserCheck, Settings2, Database } from 'lucide-react';
import { LanguageCode, CaregiverNote, UserProfile } from '../types';
import { I18N } from '../data/i18n';
import { LocationAccessCard } from './LocationAccessCard';
import { saveCaregiverLog, getCaregiverLogs } from '../lib/firebase';
import { HighVisibilitySosButton } from './HighVisibilitySosButton';

interface CaregiverViewProps {
  currentLang: LanguageCode;
  userProfile: UserProfile;
  onLanguageChange: (lang: LanguageCode) => void;
  onOpenVoiceAssistant: () => void;
  onPlayVoiceToast: (msg?: string) => void;
  onOpenProfileRegistration: () => void;
  onUpdateSafeZone: (lat: number, lng: number) => void;
  onOpenRespite?: () => void;
  onSosTriggered?: (data: { lat: number; lng: number; timestamp: string }) => void;
}

const INITIAL_NOTES: CaregiverNote[] = [
  {
    id: 'n1',
    time: '8:45 AM today',
    mood: 'peaceful',
    text: 'Aita enjoyed her warm tulsi tea on the sunny verandah. Recognized Debo in photo and smiled.',
    author: 'Ananya Baruah',
  },
  {
    id: 'n2',
    time: 'Yesterday evening',
    mood: 'calm',
    text: 'Gentle Borgeet audio helped ease transition during twilight. Zero agitation.',
    author: 'Ananya Baruah',
  },
];

export const CaregiverView: React.FC<CaregiverViewProps> = ({
  currentLang,
  userProfile,
  onLanguageChange,
  onOpenVoiceAssistant,
  onPlayVoiceToast,
  onOpenProfileRegistration,
  onUpdateSafeZone,
  onOpenRespite,
  onSosTriggered,
}) => {
  const dict = I18N[currentLang] || I18N.as;
  const [notes, setNotes] = useState<CaregiverNote[]>(INITIAL_NOTES);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedMood, setSelectedMood] = useState<'peaceful' | 'calm' | 'thoughtful' | 'restless' | 'disoriented'>('peaceful');
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Fetch Firestore care logs on mount
  useEffect(() => {
    getCaregiverLogs().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setNotes(fetched);
      }
    });
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: CaregiverNote = {
      id: `note-${Date.now()}`,
      time: 'Just now',
      mood: selectedMood,
      text: newNoteText,
      author: userProfile.caregiverName || 'Ananya Baruah',
    };

    setNotes([newNote, ...notes]);
    setNewNoteText('');
    onPlayVoiceToast('Wellbeing observation recorded in database.');

    // Save to Firestore
    await saveCaregiverLog({
      time: 'Just now',
      mood: selectedMood,
      text: newNote.text,
      author: newNote.author,
    });
  };

  const requestAiCaregiverInsight = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Caregiver note: Aita is currently ${selectedMood}. Context: ${newNoteText || 'Daily routine monitoring'}. Please provide 2 brief, compassionate caregiver tips for this state.`,
          mode: 'caregiver',
          language: currentLang,
        }),
      });
      const data = await response.json();
      if (data.reply) {
        setAiTip(data.reply);
      } else {
        setAiTip('Tip: Continue gentle auditory anchors, such as morning borgeet and warm tulsi tea, while maintaining rhythmic lighting to prevent sensory overload.');
      }
    } catch (err) {
      setAiTip('Tip: Validate all feelings with a gentle smile. Soft physical presence and low-tone voices immediately soothe cognitive tension.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Registered Care Profile Banner */}
      <div className="bg-[#FAF7EE] border border-[#2D493E]/20 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1A4335] text-[#FAF7EE] flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-[#1C2826] leading-tight">
                  {userProfile.patientCallSign || userProfile.patientName}
                </h3>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#1A4335]/10 text-[#1A4335]">
                  {userProfile.stage} stage
                </span>
              </div>
              <p className="text-xs text-[#5C6B64]">
                Caregiver: <span className="font-medium text-[#1C2826]">{userProfile.caregiverName}</span>
              </p>
            </div>
          </div>

          <button
            id="btn-edit-care-profile"
            onClick={onOpenProfileRegistration}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#2D493E]/20 text-xs font-semibold text-[#1A4335] hover:bg-[#FAF7EE] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2D493E]/10 text-xs text-[#5C6B64]">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-700" />
            <span>Firestore Persistent Storage Active</span>
          </div>
          <span className="text-[11px] text-[#2D493E] font-medium">
            {userProfile.homeCity}
          </span>
        </div>
      </div>

      {/* High-Visibility Emergency SOS Quick Card */}
      {onSosTriggered && (
        <HighVisibilitySosButton
          userProfile={userProfile}
          currentLang={currentLang}
          onSosTriggered={onSosTriggered}
          variant="card"
        />
      )}

      {/* Geolocation & Safe Zone Telemetry Card */}
      <LocationAccessCard
        currentMode="caregiver"
        userProfile={userProfile}
        onUpdateSafeZone={onUpdateSafeZone}
      />

      {/* Overview Wellbeing Card */}
      <div className="bg-white border border-[#E8E3D5] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#567f6f] uppercase tracking-wider">
              {dict.tabCaregiver}
            </span>
            <h2 className="text-lg font-bold text-[#1A4335] leading-tight font-bengali">
              {dict.cgTitle}
            </h2>
            <p className="text-[11px] text-[#616F68]">
              Shillong Verandah Hub • 12 mins ago
            </p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy Flow
          </span>
        </div>

        <div className="bg-[#f2f7f4] border border-[#c5dcd2] rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#1e332b]">88</span>
              <span className="text-xs text-stone-500 font-bold">/ 100</span>
            </div>
            <p className="text-xs font-bold text-emerald-800 mt-0.5 font-bengali">
              {dict.cgStatus}
            </p>
            <p className="text-[10px] text-stone-600">
              Zero agitation, routines smoothly embraced
            </p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-[#567f6f] flex items-center justify-center bg-white shadow-inner font-extrabold text-xs text-[#1e332b]">
            94%
          </div>
        </div>
      </div>

      {/* Caregiver Daily Burnout & Micro-Respite Sanctuary Card */}
      {onOpenRespite && (
        <div className="bg-gradient-to-br from-[#1A4335] to-[#2D493E] text-white rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-300">
                <Heart className="w-5 h-5 fill-emerald-300/30" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-white font-bengali">
                  সেৱকৰ শান্ত নিকেতন • Respite Sanctuary
                </h3>
                <p className="text-[11px] text-[#e1ede7]">
                  30-second burnout check-in & 4-4-4 box breathing coach.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenRespite}
              className="px-3 py-1.5 rounded-full bg-white text-[#1A4335] text-xs font-bold shadow hover:bg-[#FAF7EE] transition-transform active:scale-95 flex-shrink-0"
            >
              Open Respite
            </button>
          </div>
        </div>
      )}

      {/* Regional Voice Settings Card */}
      <div className="bg-white border border-[#E8E3D5] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#e1ede7] text-[#1e332b] flex items-center justify-center text-xs font-bold">
            <Globe className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="font-bold text-xs text-[#1A4335]">
              {dict.cgVoiceTitle}
            </h3>
            <p className="text-[10px] text-[#616F68]">
              Live heart language adapted for Aita
            </p>
          </div>
        </div>

        <div className="bg-[#F5F2E8] p-3 rounded-2xl border border-[#E8E3D5] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-stone-700">Elder Heart Language:</span>
            <span className="font-bold text-[#1e332b] bg-white px-2 py-0.5 rounded-md border border-[#E8E3D5]">
              {dict.name}
            </span>
          </div>

          <select
            value={currentLang}
            onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
            className="w-full text-xs bg-white border border-[#E8E3D5] rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#567f6f] font-medium"
          >
            <option value="as">অসমীয়া (Assamese) - Upper Assam & Kamrupi</option>
            <option value="kha">Ka Ktien Khasi (Khasi) - Shillong & Sohra</option>
            <option value="bdo">बोड़ो (Bodo) - Bodoland Regional</option>
            <option value="mni">মৈতৈলোন্ (Manipuri) - Imphal Valley</option>
            <option value="gro">A·chik (Garo) - Garo Hills</option>
            <option value="lus">Mizo ṭawng (Mizo) - Aizawl Standard</option>
            <option value="en">English - Calm Hearth Phrasing</option>
            <option value="hi">हिन्दी (Hindi) - Devanagari Friendly</option>
          </select>
        </div>
      </div>

      {/* AI Caregiver Clinical Companion Card */}
      <div className="bg-gradient-to-br from-[#1A4335] to-[#2d493e] text-white rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-emerald-300 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white">
                MindSync AI Sanctuary Advisor
              </h3>
              <p className="text-[10px] text-white/70">
                Gemini Powered Dementia Guidance
              </p>
            </div>
          </div>
          <button
            onClick={onOpenVoiceAssistant}
            className="text-[10px] font-bold bg-white text-[#1A4335] px-2.5 py-1 rounded-full hover:bg-emerald-50 active:scale-95 transition-all"
          >
            Voice Chat
          </button>
        </div>

        {aiTip ? (
          <div className="bg-white/10 rounded-2xl p-3 text-xs leading-relaxed text-emerald-100 border border-white/10 space-y-2">
            <p>{aiTip}</p>
            <button
              onClick={() => setAiTip(null)}
              className="text-[10px] text-white/70 hover:text-white underline"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-emerald-200">
              Need assistance with sundowning or meal resistance?
            </span>
            <button
              onClick={requestAiCaregiverInsight}
              disabled={loadingAi}
              className="text-xs px-3 py-1.5 rounded-xl bg-white text-[#1A4335] font-bold shadow hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-50"
            >
              {loadingAi ? 'Analyzing...' : 'Get Insight'}
            </button>
          </div>
        )}
      </div>

      {/* Observation Logger Form */}
      <div className="bg-white border border-[#E8E3D5] rounded-3xl p-4 shadow-sm space-y-3">
        <h3 className="font-bold text-xs text-[#222B27]">
          Log Daily Observation
        </h3>

        {/* Mood Selector Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'peaceful', label: '🌿 Peaceful' },
            { key: 'calm', label: '☕ Calm' },
            { key: 'thoughtful', label: '💭 Thoughtful' },
            { key: 'restless', label: '⚡ Restless' },
            { key: 'disoriented', label: '🌫️ Disoriented' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedMood(m.key as any)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                selectedMood === m.key
                  ? 'bg-[#1e332b] text-white border-[#1e332b] font-bold'
                  : 'bg-[#F5F2E8] border-[#E8E3D5] text-[#616F68]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleAddNote} className="space-y-2">
          <textarea
            rows={2}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Notes on morning tea, smiles, verbal response, or agitation..."
            className="w-full text-xs bg-[#F5F2E8] border border-[#E8E3D5] rounded-2xl p-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#567f6f]"
          />
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={requestAiCaregiverInsight}
              className="text-[11px] font-bold text-[#567f6f] flex items-center gap-1 hover:underline"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ask AI for Advice on this</span>
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#2d493e] hover:bg-[#1e332b] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>Record Note</span>
            </button>
          </div>
        </form>

        {/* Previous Notes */}
        <div className="space-y-2 pt-2 border-t border-[#E8E3D5]">
          {notes.map((n) => (
            <div
              key={n.id}
              className="p-2.5 rounded-2xl bg-[#FAF7EE] border border-[#E8E3D5] text-xs space-y-1"
            >
              <div className="flex items-center justify-between text-[10px] text-[#616F68]">
                <span className="font-bold text-[#1e332b]">{n.author}</span>
                <span>{n.time}</span>
              </div>
              <p className="text-[#222B27] leading-relaxed">{n.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Care Circle Card */}
      <div className="bg-white border border-[#E8E3D5] rounded-3xl p-4 shadow-sm space-y-2.5">
        <h3 className="font-bold text-xs text-[#222B27]">Active Care Circle</h3>

        {/* Primary Caregiver Ananya */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F5F2E8] border border-[#E8E3D5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-stone-200 ring-1 ring-[#c5dcd2]">
              <img
                alt="Caregiver Ananya"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[#222B27]">Ananya Baruah</h4>
              <p className="text-[10px] text-[#616F68]">
                Primary • Shillong Verandah
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-[#e1ede7] text-[#1e332b] px-2 py-0.5 rounded-full font-bold">
            On Duty
          </span>
        </div>

        {/* Debo Baruah */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F5F2E8] border border-[#E8E3D5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-stone-200 ring-1 ring-[#c5dcd2]">
              <img
                alt="Debo Baruah"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
              />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[#222B27]">Debo Baruah</h4>
              <p className="text-[10px] text-[#616F68]">
                Son in Bangalore • Evening Call (7 PM)
              </p>
            </div>
          </div>
          <button
            onClick={() => onPlayVoiceToast('Debo Baruah: Connecting evening call circle...')}
            className="text-[10px] bg-white border border-[#E8E3D5] text-[#2d493e] px-2 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-[#FAF7EE]"
          >
            <PhoneCall className="w-3 h-3" />
            <span>Call</span>
          </button>
        </div>

        {/* Dr. Hazarika */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F5F2E8] border border-[#E8E3D5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs">
              👨‍⚕️
            </div>
            <div>
              <h4 className="font-bold text-xs text-[#222B27]">Dr. N. Hazarika</h4>
              <p className="text-[10px] text-[#616F68]">
                Geriatric & Memory Specialist, Shillong
              </p>
            </div>
          </div>
          <button
            onClick={() => onPlayVoiceToast('Contacting Dr. Hazarika Clinic...')}
            className="text-[10px] bg-white border border-[#E8E3D5] text-[#2d493e] px-2 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-[#FAF7EE]"
          >
            <PhoneCall className="w-3 h-3" />
            <span>Dial</span>
          </button>
        </div>
      </div>
    </div>
  );
};
