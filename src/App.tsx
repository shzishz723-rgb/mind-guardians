import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HavenView } from './components/HavenView';
import { RemindersView } from './components/RemindersView';
import { FaceRecallView } from './components/FaceRecallView';
import { SequenceGameView } from './components/SequenceGameView';
import { MemoryVaultView } from './components/MemoryVaultView';
import { CaregiverView } from './components/CaregiverView';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { LanguageModal } from './components/LanguageModal';
import { ProfileRegistrationModal } from './components/ProfileRegistrationModal';
import { ReminiscenceVaultModal } from './components/ReminiscenceVaultModal';
import { CaregiverRespiteModal } from './components/CaregiverRespiteModal';
import { SosDispatchedModal } from './components/SosDispatchedModal';
import { BottomNav } from './components/BottomNav';
import { VoiceToast } from './components/VoiceToast';
import { LanguageCode, Mode, TabType, UserProfile } from './types';
import { I18N } from './data/i18n';
import { getUserProfile, saveUserProfile } from './lib/firebase';
import { speakCompanionVoice, getUnlockedAudioContext } from './lib/audioSpeech';

const DEFAULT_PROFILE: UserProfile = {
  patientName: 'Minoti Baruah',
  patientCallSign: 'Aita Minoti',
  caregiverName: 'Ananya Baruah',
  caregiverPhone: '+91 94350 12345',
  emergencyPhone: '+91 98640 67890',
  homeCity: 'Laitumkhrah, Shillong, Meghalaya',
  safeZoneLat: 25.5788,
  safeZoneLng: 91.8933,
  safeZoneRadiusMeters: 500,
  language: 'as',
  stage: 'early',
  calmingTriggers: 'Warm Tulsi tea, morning Borgeet chants, touching pine needles on verandah',
  updatedAt: new Date().toISOString(),
};

export default function App() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>('as');
  const [currentMode, setCurrentMode] = useState<Mode>('patient');
  const [currentTab, setCurrentTab] = useState<TabType>('haven');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isReminiscenceOpen, setIsReminiscenceOpen] = useState<boolean>(false);
  const [isRespiteOpen, setIsRespiteOpen] = useState<boolean>(false);
  const [isSundowningActive, setIsSundowningActive] = useState<boolean>(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);
  const [sosAlertData, setSosAlertData] = useState<{ lat: number; lng: number; timestamp: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const dict = I18N[currentLang] || I18N.as;

  const handleSosTriggered = (data: { lat: number; lng: number; timestamp: string }) => {
    setSosAlertData(data);
    setIsSosModalOpen(true);
  };

  // Hydrate user profile from Firestore / local storage on mount
  useEffect(() => {
    getUserProfile().then((stored) => {
      if (stored) {
        setUserProfile(stored);
        if (stored.language) {
          setCurrentLang(stored.language);
        }
      }
    });
  }, []);

  // Update safe zone coordinates
  const handleUpdateSafeZone = async (lat: number, lng: number) => {
    const updated: UserProfile = {
      ...userProfile,
      safeZoneLat: lat,
      safeZoneLng: lng,
    };
    setUserProfile(updated);
    await saveUserProfile(updated);
    showVoiceToast('Home Sanctuary safe-zone coordinates updated.');
  };

  // Handle mode switches
  const handleModeChange = (mode: Mode) => {
    setCurrentMode(mode);
    if (mode === 'caregiver') {
      setCurrentTab('caregiver');
    } else {
      setCurrentTab('haven');
    }
  };

  // Play voice toast helper using unified speech engine
  const showVoiceToast = (msg?: string) => {
    const text = msg || dict.audioToast;
    setToastMessage(text);
    getUnlockedAudioContext();

    speakCompanionVoice(text, currentMode === 'caregiver' ? 'Puck' : 'Kore');

    setTimeout(() => {
      setToastMessage(null);
    }, 6500);
  };

  const handleReminiscencePrompt = (prompt: string) => {
    setIsReminiscenceOpen(false);
    setIsVoiceModalOpen(true);
    showVoiceToast(prompt);
  };

  return (
    <div className={`min-h-screen flex justify-center selection:bg-[#c5dcd2] selection:text-[#1e332b] transition-colors duration-700 ${
      isSundowningActive ? 'bg-[#211a12] text-[#FBF3E4]' : 'bg-[#ECE8DD] text-[#222B27]'
    }`}>
      {/* Mobile Device Viewport Shell Container */}
      <div className={`w-full max-w-[430px] min-h-screen flex flex-col shadow-2xl relative border-x transition-colors duration-700 ${
        isSundowningActive
          ? 'bg-[#2b2216] border-amber-900/40'
          : 'bg-[#FAF7EE] border-[#E8E3D5]'
      }`}>
        {/* Floating Voice Toast */}
        <VoiceToast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />

        {/* Top Header */}
        <Header
          currentLang={currentLang}
          currentMode={currentMode}
          userProfile={userProfile}
          onSelectLangClick={() => setIsLangModalOpen(true)}
          onModeChange={handleModeChange}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onSosTriggered={handleSosTriggered}
        />

        {/* Main View Panel */}
        <main className="flex-1 p-4 pb-28 overflow-y-auto hide-scrollbar">
          {currentTab === 'haven' && (
            <HavenView
              currentLang={currentLang}
              userProfile={userProfile}
              isSundowningActive={isSundowningActive}
              onToggleSundowning={(active) => setIsSundowningActive(active)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onPlayVoiceNote={() => showVoiceToast()}
              onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
              onOpenReminiscence={() => setIsReminiscenceOpen(true)}
              onOpenRespite={() => setIsRespiteOpen(true)}
              onPlayVoiceToast={showVoiceToast}
              onSosTriggered={handleSosTriggered}
            />
          )}

          {currentTab === 'reminders' && (
            <RemindersView
              currentLang={currentLang}
              onBackToHaven={() => setCurrentTab('haven')}
              onPlayVoiceToast={showVoiceToast}
            />
          )}

          {currentTab === 'recall' && (
            <FaceRecallView
              currentLang={currentLang}
              onBackToHaven={() => setCurrentTab('haven')}
              onPlayVoiceToast={showVoiceToast}
            />
          )}

          {currentTab === 'sequence' && (
            <SequenceGameView
              currentLang={currentLang}
              onBackToHaven={() => setCurrentTab('haven')}
              onPlayVoiceToast={showVoiceToast}
            />
          )}

          {currentTab === 'vault' && (
            <MemoryVaultView
              currentLang={currentLang}
              onBackToHaven={() => setCurrentTab('haven')}
              onPlayVoiceToast={showVoiceToast}
            />
          )}

          {currentTab === 'caregiver' && (
            <CaregiverView
              currentLang={currentLang}
              userProfile={userProfile}
              onLanguageChange={(lang) => setCurrentLang(lang)}
              onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
              onPlayVoiceToast={showVoiceToast}
              onOpenProfileRegistration={() => setIsProfileModalOpen(true)}
              onUpdateSafeZone={handleUpdateSafeZone}
              onOpenRespite={() => setIsRespiteOpen(true)}
              onSosTriggered={handleSosTriggered}
            />
          )}
        </main>

        {/* Bottom Navigation Dock */}
        <BottomNav
          currentTab={currentTab}
          currentLang={currentLang}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'caregiver') {
              setCurrentMode('caregiver');
            } else {
              setCurrentMode('patient');
            }
          }}
          onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
        />

        {/* AI Voice Assistant & Voice Chat Modal */}
        <VoiceAssistantModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          currentLang={currentLang}
          currentMode={currentMode}
        />

        {/* Heart Languages Modal */}
        <LanguageModal
          isOpen={isLangModalOpen}
          currentLang={currentLang}
          onSelectLanguage={(lang) => {
            setCurrentLang(lang);
            handleUpdateSafeZone(userProfile.safeZoneLat, userProfile.safeZoneLng);
          }}
          onClose={() => setIsLangModalOpen(false)}
        />

        {/* Profile Registration & Safe Zone Modal */}
        <ProfileRegistrationModal
          isOpen={isProfileModalOpen}
          profile={userProfile}
          onClose={() => setIsProfileModalOpen(false)}
          onSaveProfile={(updated) => {
            setUserProfile(updated);
            if (updated.language) {
              setCurrentLang(updated.language);
            }
            showVoiceToast('Profile registration updated.');
          }}
        />

        {/* Reminiscence Photo Cards Modal */}
        <ReminiscenceVaultModal
          isOpen={isReminiscenceOpen}
          onClose={() => setIsReminiscenceOpen(false)}
          currentLang={currentLang}
          onSelectPrompt={handleReminiscencePrompt}
          onPlayVoiceToast={showVoiceToast}
        />

        {/* Caregiver Micro-Respite & Burnout Check-in Modal */}
        <CaregiverRespiteModal
          isOpen={isRespiteOpen}
          onClose={() => setIsRespiteOpen(false)}
          onPlayVoiceToast={showVoiceToast}
        />

        {/* High-Visibility Automated SOS Alert Dispatched Modal */}
        <SosDispatchedModal
          isOpen={isSosModalOpen}
          onClose={() => setIsSosModalOpen(false)}
          userProfile={userProfile}
          currentLang={currentLang}
          alertCoordinates={sosAlertData ? { lat: sosAlertData.lat, lng: sosAlertData.lng } : undefined}
          timestamp={sosAlertData?.timestamp}
        />
      </div>
    </div>
  );
}
