import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles, X, ChevronDown, Bot, RefreshCw, Volume1 } from 'lucide-react';
import { LanguageCode, Mode, ChatMessage } from '../types';
import { I18N } from '../data/i18n';
import { speakCompanionVoice, stopAllSpeech, getUnlockedAudioContext } from '../lib/audioSpeech';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: LanguageCode;
  currentMode: Mode;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  currentMode,
}) => {
  const dict = I18N[currentLang] || I18N.as;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize initial greeting when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: 'greet',
        sender: 'assistant',
        text:
          currentMode === 'caregiver'
            ? 'Hello Ananya. I am your MindSync Sanctuary clinical & daily support companion. How can I assist you with Aita Minoti’s care today?'
            : `${dict.heroGreeting}। মই অনন্যা, আপোনাৰ কাষতেই আছো। আজি আপোনাৰ মনটো শান্ত আছে নে? (I am Ananya, right beside you. How is your heart feeling today?)`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initialGreeting]);
      if (!audioMuted) {
        speakText(initialGreeting.text);
      }
    }
  }, [isOpen, currentMode, currentLang]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Select speech language code
      const langMap: Record<LanguageCode, string> = {
        as: 'as-IN',
        kha: 'en-IN',
        bdo: 'hi-IN',
        mni: 'hi-IN',
        gro: 'en-IN',
        lus: 'en-IN',
        en: 'en-IN',
        hi: 'hi-IN',
      };

      recognition.lang = langMap[currentLang] || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          sendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission required for voice chat.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [currentLang]);

  // Text to speech playback using unified multi-tier audio engine
  const speakText = async (text: string) => {
    if (audioMuted) return;
    getUnlockedAudioContext();

    await speakCompanionVoice(
      text,
      currentMode === 'caregiver' ? 'Puck' : 'Kore',
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleTestAudio = () => {
    getUnlockedAudioContext();
    const testPhrase =
      currentMode === 'caregiver'
        ? 'Audio test: MindSync Caregiver Sanctuary voice is active.'
        : 'নমস্কাৰ আইতা, আপোনাৰ অনন্যাৰ মাত শুনিছেনে? (Hello Aita, can you hear my voice?)';
    speakText(testPhrase);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not supported in this browser. You can type below!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Error starting mic', err);
      }
    }
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const aiMsgId = `ai-${Date.now()}`;
    let accumulatedText = '';

    try {
      // Attempt ultra-fast SSE streaming first
      const streamRes = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
          mode: currentMode,
          language: currentLang,
        }),
      });

      if (streamRes.ok && streamRes.body) {
        // Add placeholder AI message
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            sender: 'assistant',
            text: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('data:')) {
              try {
                const parsed = JSON.parse(cleanLine.substring(5).trim());
                if (parsed.chunk) {
                  accumulatedText += parsed.chunk;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === aiMsgId ? { ...m, text: accumulatedText } : m))
                  );
                }
              } catch (_) {}
            }
          }
        }

        if (accumulatedText.trim()) {
          speakText(accumulatedText);
          setIsLoading(false);
          return;
        }
      }

      // Fallback to standard chat endpoint if streaming returns empty
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
          mode: currentMode,
          language: currentLang,
        }),
      });

      const data = await response.json();
      const replyText =
        data.reply ||
        (currentMode === 'caregiver'
          ? 'Maintain a reassuring tone and create steady daily routines for Aita.'
          : 'নমস্কাৰ আইতা, আপুনি আপোনাৰ শান্ত বাৰাণ্ডাত আছে। সকলো কুশলে আছে।');

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== aiMsgId);
        return [
          ...filtered,
          {
            id: aiMsgId,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      });

      speakText(replyText);
    } catch (err) {
      console.warn('Chat request error, providing gentle comfort fallback:', err);
      const fallbackText =
        currentMode === 'caregiver'
          ? 'Maintain a steady, loving presence. Sensory cues and warm lighting help soothe evening agitation.'
          : 'আইতা, আপুনি আপোনাৰ শিলঙৰ মৰমৰ বাৰাণ্ডাত বহি আছে। সকলো কুশলে আছে, একো চিন্তা নকৰিব। (You are resting peacefully with family.)';

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== aiMsgId);
        return [
          ...filtered,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      });
      speakText(fallbackText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-[430px] h-[90vh] sm:h-[650px] bg-[#FAF7EE] rounded-t-[36px] sm:rounded-[36px] border border-[#E8E3D5] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#1A4335] to-[#2D493E] text-white flex items-center justify-between border-b border-[#567f6f]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-300 relative">
              <Bot className="w-5 h-5" />
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm leading-tight text-white font-bengali">
                  {currentMode === 'caregiver'
                    ? 'Caregiver AI Sanctuary'
                    : 'অনন্যা • Hearth Voice Companion'}
                </h3>
                <span className="text-[9px] bg-emerald-400/20 text-emerald-200 px-1.5 py-0.5 rounded font-bold">
                  Gemini
                </span>
              </div>
              <p className="text-[10px] text-[#e1ede7]">
                {currentMode === 'caregiver'
                  ? 'Clinical Dementia Advice'
                  : 'Gentle Voice Conversation & Presence'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTestAudio}
              className="px-2 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[10px] font-bold text-white flex items-center gap-1 border border-white/20 transition-all active:scale-95"
              title="Test Companion Audio"
            >
              <Volume1 className="w-3 h-3 text-emerald-300" />
              <span>Test Voice</span>
            </button>

            <button
              onClick={() => {
                stopAllSpeech();
                setAudioMuted(!audioMuted);
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 transition-colors"
              title={audioMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {audioMuted ? (
                <VolumeX className="w-4 h-4 text-rose-300" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-300" />
              )}
            </button>

            <button
              onClick={() => {
                stopAllSpeech();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Voice Orb Visualizer in center */}
        <div className="bg-gradient-to-b from-[#f2f7f4] to-[#FAF7EE] py-4 px-5 border-b border-[#E8E3D5] flex items-center justify-center relative overflow-hidden">
          <div className="text-center relative z-10 flex flex-col items-center">
            {/* Concentric pulsing rings */}
            <div className="relative flex items-center justify-center my-1">
              {isSpeaking && (
                <>
                  <div className="absolute w-28 h-28 rounded-full bg-[#567f6f]/20 animate-ping" />
                  <div className="absolute w-24 h-24 rounded-full bg-[#567f6f]/30 animate-pulse" />
                </>
              )}
              {isListening && (
                <>
                  <div className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-ping" />
                  <div className="absolute w-24 h-24 rounded-full bg-rose-500/30 animate-pulse" />
                </>
              )}

              <button
                onClick={toggleMic}
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 relative z-10 ${
                  isListening
                    ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse'
                    : isSpeaking
                    ? 'bg-[#1e332b] text-white ring-4 ring-[#c5dcd2]'
                    : 'bg-[#2d493e] hover:bg-[#1e332b] text-white ring-4 ring-[#e1ede7]'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-7 h-7" />
                ) : (
                  <Mic className="w-7 h-7" />
                )}
                <span className="text-[9px] font-bold mt-1">
                  {isListening ? 'Listening' : isSpeaking ? 'Speaking' : 'Tap Mic'}
                </span>
              </button>
            </div>

            <p className="text-xs font-semibold text-[#1e332b] mt-2">
              {isListening
                ? dict.aiListening
                : isSpeaking
                ? 'Ananya is speaking gently...'
                : dict.aiTapToSpeak}
            </p>
            {speechError && (
              <p className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full mt-1 border border-rose-200">
                {speechError}
              </p>
            )}
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-3xl p-3.5 text-xs leading-relaxed shadow-sm font-medium ${
                  m.sender === 'user'
                    ? 'bg-[#2d493e] text-white rounded-br-none'
                    : 'bg-white border border-[#E8E3D5] text-[#222B27] rounded-bl-none font-bengali'
                }`}
              >
                {m.text}
              </div>
              <div className="flex items-center gap-1.5 mt-1 px-1">
                <span className="text-[9px] text-[#616F68]">{m.timestamp}</span>
                {m.sender === 'assistant' && (
                  <button
                    onClick={() => speakText(m.text)}
                    className="text-[9px] text-[#567f6f] hover:underline flex items-center gap-0.5"
                  >
                    <Volume2 className="w-2.5 h-2.5" /> Speak
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#567f6f] p-2 bg-white/60 rounded-2xl w-fit border border-[#E8E3D5]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Thinking with care...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-[#F5F2E8] border-t border-[#E8E3D5] overflow-x-auto hide-scrollbar flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#616F68] flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3 h-3 text-[#567f6f]" />
            Prompt:
          </span>
          {dict.aiQuickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(prompt)}
              className="text-[11px] font-medium bg-white hover:bg-[#e1ede7] text-[#1e332b] px-3 py-1 rounded-full border border-[#E8E3D5] whitespace-nowrap active:scale-95 transition-all shadow-2xs font-bengali"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Bottom Input Field */}
        <form
          onSubmit={handleFormSubmit}
          className="p-3 bg-white border-t border-[#E8E3D5] flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleMic}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              isListening
                ? 'bg-rose-600 text-white'
                : 'bg-[#FAF7EE] border border-[#E8E3D5] text-[#2d493e] hover:bg-[#e1ede7]'
            }`}
            title="Speech to Text"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={dict.aiPlaceholder}
            className="flex-1 bg-[#F5F2E8] text-xs rounded-2xl px-3.5 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#567f6f] border border-[#E8E3D5]"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-[#2d493e] hover:bg-[#1e332b] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
