import React from 'react';
import { X, MessageCircle, Volume2, Sparkles, MapPin, Calendar, Heart } from 'lucide-react';
import { ReminiscenceCard, LanguageCode } from '../types';
import { speakCompanionVoice } from '../lib/audioSpeech';

interface ReminiscenceVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: LanguageCode;
  onSelectPrompt: (prompt: string) => void;
  onPlayVoiceToast: (msg?: string) => void;
}

export const REMINISCENCE_CARDS: ReminiscenceCard[] = [
  {
    id: 'rc-wards-lake',
    title: 'Ward’s Lake Wooden Bridge & Pines',
    yearApprox: 'Circa 1976',
    location: 'Shillong, Meghalaya',
    description: 'Aita and Grandfather walking along the peaceful wooden bridge under blooming cherry blossoms and pine fragrance.',
    promptText: 'আইতা, ৱাৰ্ডছ লেকৰ সেই কাঠেৰে সজা দলংখনৰ কথা মনত আছে নে? বসন্তকালত তাত ৰঙা-গুলপীয়া ফুল ফুলিছিল। (Aita, remember the wooden bridge at Ward’s Lake in spring?)',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    tag: 'Shillong Memory',
  },
  {
    id: 'rc-magh-bihu',
    title: 'Magh Bihu Pitha & Bonfire in Tezpur',
    yearApprox: 'Circa 1982',
    location: 'Tezpur, Assam',
    description: 'Making sweet til pitha and ghila pitha over earthen hearth with younger sister Maya, laughing together at dawn.',
    promptText: 'আইতা, তেজপুৰৰ ভোগালী বিহুৰ সময়ত আপুনি আৰু মায়া মাহীয়ে বনোৱা তিল পিঠাৰ সুবাস এতিয়াও মনত আছে। (Aita, do you remember making warm til pitha with Maya during Magh Bihu?)',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
    tag: 'Bihu Festival',
  },
  {
    id: 'rc-verandah-orchid',
    title: 'The Verandah Purple Orchid',
    yearApprox: 'Circa 1994',
    location: 'Laitumkhrah Home',
    description: 'The prized purple Meghalaya wild orchid potted in clay, watered every morning with tea-strainer mist.',
    promptText: 'আইতা, আমাৰ ছিলঙৰ বাৰাণ্ডাৰ বেঙুনীয়া অৰ্কিডজোপা এতিয়াও ফুলি আছে। আপোনাৰ মৰমৰ বাৰাণ্ডাত শীতল বতাহ বলিছে। (Aita, the purple orchid you nurtured on the verandah is blooming right now.)',
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
    tag: 'Home Sanctuary',
  },
  {
    id: 'rc-brahmaputra-sunset',
    title: 'Brahmaputra River Sunset at Tezpur Ghat',
    yearApprox: 'Circa 1968',
    location: 'Brahmaputra Bank',
    description: 'The golden red waters reflecting the sunset, listening to distant boatman borgeet songs at dusk.',
    promptText: 'আইতা, ব্ৰহ্মপুত্ৰৰ ঘাটৰ সেই সোণালী বেলি লহিওৱা সময়খিনিৰ কথা মনত পৰিছে নে? শান্ত নাওৰ গান বাজি আছিল। (Aita, remember the golden river sunset and evening devotional melodies?)',
    image: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=600&q=80',
    tag: 'River Peace',
  },
];

export const ReminiscenceVaultModal: React.FC<ReminiscenceVaultModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onSelectPrompt,
  onPlayVoiceToast,
}) => {
  if (!isOpen) return null;

  const handleSpeakCard = (card: ReminiscenceCard) => {
    speakCompanionVoice(card.promptText, 'Kore');
    onPlayVoiceToast(card.promptText);
  };

  const handleStartAiChat = (card: ReminiscenceCard) => {
    onSelectPrompt(card.promptText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-[430px] h-[90vh] sm:h-[650px] bg-[#FAF7EE] rounded-t-[36px] sm:rounded-[36px] border border-[#E8E3D5] shadow-2xl flex flex-col overflow-hidden text-[#222B27]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#1A4335] to-[#2D493E] text-white flex items-center justify-between border-b border-[#567f6f]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-300">
              <Heart className="w-5 h-5 fill-emerald-300/30" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white font-bengali">
                সোণালী স্মৃতিৰ সঁফুৰা • Reminiscence Photo Cards
              </h3>
              <p className="text-[10px] text-[#e1ede7]">
                Gentle memory cues & conversational anchors for long-term comfort.
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

        {/* Scrollable Gallery */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 text-xs text-emerald-900 leading-relaxed">
            💡 <strong>Dementia Dignity Guide:</strong> Reminiscence triggers long-term episodic memories without testing or putting the patient on the spot. Tap <em>"Talk about this"</em> to let Ananya gently narrate the memory.
          </div>

          <div className="space-y-4">
            {REMINISCENCE_CARDS.map((card) => (
              <div
                key={card.id}
                className="bg-white border border-[#E8E3D5] rounded-3xl overflow-hidden shadow-sm hover:border-[#567f6f] transition-all group"
              >
                {/* Photo with overlay tag */}
                <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    {card.tag}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-md text-[#1A4335] px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow">
                    {card.yearApprox}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#616F68]">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{card.location}</span>
                  </div>

                  <h4 className="font-bold text-sm text-[#1A4335] leading-tight font-bengali">
                    {card.title}
                  </h4>

                  <p className="text-xs text-[#222B27] leading-relaxed">
                    {card.description}
                  </p>

                  <div className="bg-[#FAF7EE] p-3 rounded-2xl border border-[#E8E3D5] text-xs font-bengali text-[#2d493e] leading-relaxed italic">
                    "{card.promptText}"
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleSpeakCard(card)}
                      className="flex-1 py-2 px-3 rounded-2xl bg-[#f2f7f4] hover:bg-[#e1ede7] border border-[#c5dcd2] text-xs font-bold text-[#1e332b] flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Listen to Memory</span>
                    </button>

                    <button
                      onClick={() => handleStartAiChat(card)}
                      className="flex-1 py-2 px-3 rounded-2xl bg-[#1A4335] hover:bg-[#2d493e] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Talk with AI</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
