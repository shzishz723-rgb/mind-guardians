import React, { useState } from 'react';
import { ChevronLeft, Check, Plus, Bell, Clock, Calendar, Sparkles } from 'lucide-react';
import { LanguageCode, ReminderItem } from '../types';
import { I18N } from '../data/i18n';

interface RemindersViewProps {
  currentLang: LanguageCode;
  onBackToHaven: () => void;
  onPlayVoiceToast: (msg?: string) => void;
}

const INITIAL_REMINDERS: ReminderItem[] = [
  {
    id: 'r1',
    time: '8:30 AM',
    period: 'Morning',
    titleKey: 'remind1Title',
    title: 'তুলসী চাহ আৰু নিয়মীয়া ঔষধ',
    description: 'Warm tulsi tea and herbal drops are gently placed on your veranda table. Take your time.',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    completed: false,
    statusBadge: 'Up Next',
  },
  {
    id: 'r2',
    time: '12:30 PM',
    period: 'Afternoon',
    titleKey: 'remind2Title',
    title: 'দুপৰীয়াৰ পুষ্টিকৰ আহাৰ',
    description: 'Steamed Joha rice, sweet pumpkin, and lentils served warm with love.',
    completed: false,
    statusBadge: 'Later today',
  },
  {
    id: 'r3',
    time: '4:30 PM',
    period: 'Evening',
    titleKey: 'remind3Title',
    title: 'বাৰাণ্ডাত শান্ত পদযাত্ৰা আৰু বিশ্ৰাম',
    description: 'A few peaceful steps admiring the veranda orchids and drinking fresh water.',
    completed: false,
    statusBadge: 'Evening',
  },
];

export const RemindersView: React.FC<RemindersViewProps> = ({
  currentLang,
  onBackToHaven,
  onPlayVoiceToast,
}) => {
  const dict = I18N[currentLang] || I18N.as;
  const [reminders, setReminders] = useState<ReminderItem[]>(INITIAL_REMINDERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('03:00 PM');
  const [newDesc, setNewDesc] = useState('');

  const toggleComplete = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextState = !r.completed;
          if (nextState) {
            onPlayVoiceToast('ৰুটিন শান্তভাৱে সম্পন্ন কৰা হ’ল (Completed with warmth)');
          }
          return { ...r, completed: nextState };
        }
        return r;
      })
    );
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: ReminderItem = {
      id: `r-${Date.now()}`,
      time: newTime,
      period: 'Custom',
      titleKey: 'custom',
      title: newTitle,
      description: newDesc || 'Gentle personal routine for Aita Minoti.',
      completed: false,
      statusBadge: 'Scheduled',
    };

    setReminders((prev) => [newItem, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
    onPlayVoiceToast('নতুন শান্ত দিনলিপি যোগ কৰা হ’ল (New reminder saved)');
  };

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
        <span className="text-xs font-bold text-[#1A4335] font-bengali">
          {dict.remindersTitle}
        </span>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-[11px] font-bold text-[#1e332b] bg-[#e1ede7] px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-[#c5dcd2] transition-colors"
          title="Add routine item"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Routine list */}
      <div className="space-y-3.5">
        {reminders.map((item, idx) => {
          // Dynamic title based on translation dictionary if standard
          let displayTitle = item.title;
          let displayDesc = item.description;
          if (item.id === 'r1') {
            displayTitle = dict.remind1Title;
            displayDesc = dict.remind1Desc;
          } else if (item.id === 'r2') {
            displayTitle = dict.remind2Title;
            displayDesc = dict.remind2Desc;
          }

          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-4 shadow-sm space-y-3 transition-all ${
                item.completed
                  ? 'border border-emerald-300 bg-emerald-50/20 opacity-90'
                  : idx === 0
                  ? 'border-2 border-[#567f6f]/60'
                  : 'border border-[#E8E3D5]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e1ede7] text-[#1e332b]">
                  {item.time} • {item.period}
                </span>
                {item.completed ? (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3 stroke-[3]" /> Done
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    {item.statusBadge || 'Scheduled'}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-[#222B27] font-bengali">
                  {displayTitle}
                </h3>
                <p className="text-xs text-[#616F68] mt-1 leading-relaxed">
                  {displayDesc}
                </p>
              </div>

              {item.image && (
                <div className="rounded-2xl overflow-hidden h-36 bg-stone-100 border border-stone-200 shadow-inner">
                  <img
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                    src={item.image}
                  />
                </div>
              )}

              <button
                onClick={() => toggleComplete(item.id)}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all ${
                  item.completed
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-[#2d493e] hover:bg-[#1e332b] text-white'
                }`}
              >
                {item.completed ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>✓ Done with Warmth • শান্তভাৱে সম্পন্ন</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{dict.remindBtnDone}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Routine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-[380px] bg-[#FAF7EE] rounded-[32px] border border-[#E8E3D5] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E3D5]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2d493e]" />
                <h3 className="font-extrabold text-sm text-[#1A4335]">
                  Add Gentle Routine
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-[#F5F2E8] border border-[#E8E3D5] flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#616F68] block mb-1">
                  Routine Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon warm water & almond"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs bg-white border border-[#E8E3D5] rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#567f6f]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#616F68] block mb-1">
                  Preferred Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 03:30 PM"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full text-xs bg-white border border-[#E8E3D5] rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#567f6f]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#616F68] block mb-1">
                  Gentle Note for Aita
                </label>
                <textarea
                  rows={2}
                  placeholder="Soothing note or instructions..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs bg-white border border-[#E8E3D5] rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#567f6f]"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E8E3D5] text-xs font-bold text-stone-600 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2d493e] text-white text-xs font-bold hover:bg-[#1e332b]"
                >
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
