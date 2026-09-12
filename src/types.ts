export type LanguageCode = 'as' | 'kha' | 'bdo' | 'mni' | 'gro' | 'lus' | 'en' | 'hi';

export type Mode = 'patient' | 'caregiver';

export type TabType = 'haven' | 'reminders' | 'recall' | 'sequence' | 'vault' | 'caregiver' | 'assistant';

export interface ReminderItem {
  id: string;
  time: string;
  period: string;
  titleKey: string;
  title: string;
  description: string;
  image?: string;
  completed: boolean;
  statusBadge?: string;
}

export interface FamilyPerson {
  id: string;
  name: string;
  relation: string;
  location: string;
  hint: string;
  image: string;
  isCurrentQuestion?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isAudio?: boolean;
}

export interface CaregiverNote {
  id: string;
  time: string;
  mood: 'peaceful' | 'calm' | 'thoughtful' | 'disoriented' | 'restless';
  text: string;
  author: string;
}

export interface UserProfile {
  id?: string;
  patientName: string;
  patientCallSign: string;
  caregiverName: string;
  caregiverPhone: string;
  emergencyPhone: string;
  homeCity: string;
  safeZoneLat: number;
  safeZoneLng: number;
  safeZoneRadiusMeters: number;
  language: LanguageCode;
  stage: 'early' | 'moderate' | 'advanced';
  calmingTriggers: string;
  updatedAt?: string;
}

export interface LocationStatus {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isWithinSafeZone: boolean;
  distanceFromHomeMeters: number | null;
  lastUpdated: string | null;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  isTracking: boolean;
}

export interface VoiceNoteAnchor {
  id: string;
  speakerName: string;
  relation: string;
  title: string;
  audioBase64?: string;
  durationSec?: number;
  recordedAt: string;
  transcript: string;
}

export interface ReminiscenceCard {
  id: string;
  title: string;
  yearApprox: string;
  location: string;
  description: string;
  promptText: string;
  image: string;
  tag: string;
}

export interface CaregiverCheckin {
  id?: string;
  date: string;
  strainScore: number;
  energyLevel: 'low' | 'moderate' | 'high';
  emotionalState: string;
  notes?: string;
  timestamp: string;
}

export interface SosAlert {
  id?: string;
  timestamp: string;
  status: 'triggered' | 'delivered';
  contactPhone: string;
  patientName: string;
  message: string;
  latitude?: number;
  longitude?: number;
}



