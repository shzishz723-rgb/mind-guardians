import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, Volume2, UserCheck, Plus, Check, Sparkles } from 'lucide-react';
import { VoiceNoteAnchor, LanguageCode } from '../types';
import { getVoiceNotes, saveVoiceNote } from '../lib/firebase';
import { speakCompanionVoice, getUnlockedAudioContext } from '../lib/audioSpeech';

interface CaregiverVoiceAnchorsProps {
  currentLang: LanguageCode;
  onPlayVoiceToast: (msg?: string) => void;
}

export const CaregiverVoiceAnchors: React.FC<CaregiverVoiceAnchorsProps> = ({
  currentLang,
  onPlayVoiceToast,
}) => {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNoteAnchor[]>([]);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [speakerName, setSpeakerName] = useState('');
  const [relation, setRelation] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [transcript, setTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const notes = await getVoiceNotes();
    setVoiceNotes(notes);
  };

  const handlePlayVoice = (note: VoiceNoteAnchor) => {
    getUnlockedAudioContext();

    if (activePlayingId === note.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setActivePlayingId(null);
      return;
    }

    // Stop any existing playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setActivePlayingId(note.id);

    if (note.audioBase64) {
      const audio = new Audio(note.audioBase64);
      currentAudioRef.current = audio;
      audio.onended = () => {
        setActivePlayingId(null);
        currentAudioRef.current = null;
      };
      audio.onerror = () => {
        // Fallback to speech engine
        speakCompanionVoice(note.transcript || note.title, 'Kore', undefined, () => setActivePlayingId(null));
      };
      audio.play().catch(() => {
        speakCompanionVoice(note.transcript || note.title, 'Kore', undefined, () => setActivePlayingId(null));
      });
    } else {
      // Speak transcript using companion voice
      speakCompanionVoice(
        note.transcript,
        note.speakerName.toLowerCase().includes('debo') ? 'Puck' : 'Kore',
        undefined,
        () => setActivePlayingId(null)
      );
    }

    onPlayVoiceToast(`${note.speakerName}: "${note.title}"`);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const newNote = await saveVoiceNote({
            speakerName: speakerName || 'Family Member',
            relation: relation || 'Loved One',
            title: noteTitle || 'Warm Reassurance',
            transcript: transcript || 'Aita, we are right here at home with you.',
            audioBase64: base64data,
            durationSec: recordingSeconds || 6,
            recordedAt: 'Just now',
          });
          setVoiceNotes((prev) => [newNote, ...prev]);
          setShowRecordModal(false);
          setIsRecording(false);
          setRecordingSeconds(0);
          onPlayVoiceToast('Voice anchor recorded and saved safely.');
        };
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 20) {
            stopRecording();
            return 20;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone recording error', err);
      alert('Microphone permission required to record loved one’s voice.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  return (
    <div className="bg-white border border-[#E8E3D5] rounded-3xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1A4335] uppercase tracking-wider font-bengali">
              মৰমৰ আপোনজনৰ মাত • Loved-One Voice Anchors
            </h3>
            <p className="text-[11px] text-[#616F68]">
              Tap to hear comforting authentic voices of family members.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowRecordModal(true)}
          className="text-xs font-bold text-[#2d493e] flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7EE] border border-[#E8E3D5] hover:border-[#567f6f] active:scale-95 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record</span>
        </button>
      </div>

      {/* Voice Anchors Grid */}
      <div className="grid grid-cols-1 gap-2.5">
        {voiceNotes.map((note) => {
          const isPlaying = activePlayingId === note.id;
          return (
            <div
              key={note.id}
              onClick={() => handlePlayVoice(note)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isPlaying
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-[#FAF7EE] border-[#E8E3D5] hover:border-[#567f6f]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
                    isPlaying
                      ? 'bg-emerald-600 text-white shadow-md animate-pulse'
                      : 'bg-white text-[#2d493e] border border-[#E8E3D5] shadow-sm'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#222B27] truncate font-bengali">
                      {note.speakerName}
                    </span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/60 px-1.5 py-0.2 rounded font-medium">
                      {note.relation}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#567f6f] font-medium truncate">
                    {note.title}
                  </p>
                  <p className="text-[10px] text-[#616F68] truncate font-bengali">
                    {note.transcript}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-[10px] text-stone-400 font-medium">
                  {note.durationSec ? `${note.durationSec}s` : '8s'}
                </span>
                {isPlaying && (
                  <span className="text-[9px] font-bold text-emerald-700 animate-bounce">
                    Playing...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recording Modal for family members */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-[360px] bg-white rounded-3xl p-5 border border-[#E8E3D5] shadow-2xl space-y-4 text-[#222B27]">
            <div>
              <h3 className="font-bold text-base text-[#1A4335]">
                Record Familiar Voice Anchor
              </h3>
              <p className="text-xs text-[#616F68]">
                Record a 10-second reassurance message that Aita can play with one tap when feeling disoriented.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-semibold block text-[#2d493e] mb-1">
                  Your Name (e.g. Ananya, Debo)
                </label>
                <input
                  type="text"
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  placeholder="Ananya Baruah"
                  className="w-full p-2.5 rounded-xl border border-[#E8E3D5] bg-[#FAF7EE] focus:outline-none focus:border-[#567f6f]"
                />
              </div>

              <div>
                <label className="font-semibold block text-[#2d493e] mb-1">
                  Relationship to Patient
                </label>
                <input
                  type="text"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  placeholder="Granddaughter"
                  className="w-full p-2.5 rounded-xl border border-[#E8E3D5] bg-[#FAF7EE] focus:outline-none focus:border-[#567f6f]"
                />
              </div>

              <div>
                <label className="font-semibold block text-[#2d493e] mb-1">
                  Message Title / Purpose
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Making tea in the kitchen"
                  className="w-full p-2.5 rounded-xl border border-[#E8E3D5] bg-[#FAF7EE] focus:outline-none focus:border-[#567f6f]"
                />
              </div>

              <div>
                <label className="font-semibold block text-[#2d493e] mb-1">
                  Reassurance Words (Transcript)
                </label>
                <textarea
                  rows={2}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Aita, it's Ananya. You are safe at home in Shillong, and I am right here."
                  className="w-full p-2.5 rounded-xl border border-[#E8E3D5] bg-[#FAF7EE] focus:outline-none focus:border-[#567f6f]"
                />
              </div>
            </div>

            {/* Audio Recording Controller */}
            <div className="bg-[#FAF7EE] p-4 rounded-2xl border border-[#E8E3D5] text-center space-y-2">
              <div className="text-sm font-bold text-[#1A4335]">
                {isRecording ? `Recording: ${recordingSeconds}s / 20s` : 'Ready to record voice'}
              </div>

              <div className="flex justify-center">
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg animate-pulse"
                  >
                    <Square className="w-5 h-5 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-14 h-14 rounded-full bg-[#1A4335] hover:bg-[#2d493e] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#616F68]">
                {isRecording ? 'Tap square to finish recording' : 'Tap mic to start speaking'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  stopRecording();
                  setShowRecordModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#616F68] hover:bg-stone-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
