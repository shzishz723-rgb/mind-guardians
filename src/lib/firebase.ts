import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, CaregiverNote, VoiceNoteAnchor, CaregiverCheckin, SosAlert } from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the designated firestore database instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Test connection on boot as mandated by Firestore guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'profiles', 'health_check'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('Firebase client is offline, using local persistent fallback.');
    }
    return false;
  }
}

// Initial default profile for Aita Minoti & Ananya in Shillong
export const DEFAULT_PROFILE: UserProfile = {
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
  stage: 'moderate',
  calmingTriggers: 'Tulsi tea in porcelain cup, morning Borgeet chants, looking at the pine hills from the verandah.',
  updatedAt: new Date().toISOString(),
};

const PROFILE_LOCAL_KEY = 'mindsync_profile_cache';

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  // Always update local cache
  try {
    localStorage.setItem(PROFILE_LOCAL_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Local storage write error', e);
  }

  // Persist to Firestore
  try {
    const profileDocRef = doc(db, 'profiles', 'primary_patient');
    await setDoc(profileDocRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore profile save warning (using local persistent state):', err);
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  // Try Firestore first
  try {
    const profileDocRef = doc(db, 'profiles', 'primary_patient');
    const snap = await getDoc(profileDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      localStorage.setItem(PROFILE_LOCAL_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Firestore profile fetch warning, falling back to local storage:', err);
  }

  // Fallback to local storage
  try {
    const local = localStorage.getItem(PROFILE_LOCAL_KEY);
    if (local) {
      return JSON.parse(local) as UserProfile;
    }
  } catch (e) {
    console.warn('Local storage read error', e);
  }

  return DEFAULT_PROFILE;
}

export async function recordLocationTelemetry(record: {
  latitude: number;
  longitude: number;
  accuracy: number;
  isWithinSafeZone: boolean;
  distanceFromHomeMeters: number;
  timestamp: string;
}): Promise<void> {
  try {
    const locRef = doc(db, 'locations', 'latest');
    await setDoc(locRef, record, { merge: true });
  } catch (err) {
    console.warn('Firestore location telemetry save warning:', err);
  }
}

export async function saveCaregiverLog(log: Omit<CaregiverNote, 'id'>): Promise<void> {
  try {
    const logsCol = collection(db, 'care_logs');
    await addDoc(logsCol, {
      ...log,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore care log save warning:', err);
  }
}

export async function getCaregiverLogs(): Promise<CaregiverNote[]> {
  try {
    const logsCol = collection(db, 'care_logs');
    const q = query(logsCol, orderBy('timestamp', 'desc'), limit(15));
    const snap = await getDocs(q);
    const logs: CaregiverNote[] = [];
    snap.forEach((d) => {
      const data = d.data();
      logs.push({
        id: d.id,
        time: data.time || 'Just now',
        mood: data.mood || 'calm',
        text: data.text || data.notes || '',
        author: data.author || 'Caregiver',
      });
    });
    return logs;
  } catch (err) {
    console.warn('Firestore care logs query warning:', err);
    return [];
  }
}

export const DEFAULT_VOICE_NOTES: VoiceNoteAnchor[] = [
  {
    id: 'vn-ananya-tea',
    speakerName: 'Ananya (অনন্যা)',
    relation: 'Granddaughter',
    title: 'Warm Tea in Kitchen',
    transcript: 'মৰমৰ আইতা, মই অনন্যা। মই পাকঘৰত আপোনাৰ কাৰণে গৰম তুলসী চাহ বনাই আছো। আপুনি নিৰাপদে বাৰাণ্ডাত বহক, মই এতিয়াই আনি আছো। (Dear Aita, I am Ananya. I am making warm tea in the kitchen for you. Rest peacefully on the verandah, I am bringing it right now.)',
    recordedAt: 'Today, 4:15 PM',
    durationSec: 8,
  },
  {
    id: 'vn-debo-call',
    speakerName: 'Debo (দেৱজিত)',
    relation: 'Loving Son in Bangalore',
    title: 'Evening Blessings Call',
    transcript: 'আইতা, মই দেবো। বাংগালোৰৰ পৰা ফোন কৰিছো। আপুনি সদায় মোৰ হৃদয়ত আছে। আপুনি সকলোতকৈ সুৰক্ষিত ঠাইত আছে। শান্তিৰে জিৰণি লওক। (Aita, it is Debo calling from Bangalore. You are always in my heart. Rest peacefully.)',
    recordedAt: 'Yesterday, 7:00 PM',
    durationSec: 10,
  },
  {
    id: 'vn-maya-sister',
    speakerName: 'Maya (মায়া ভণ্টি)',
    relation: 'Sister in Guwahati',
    title: 'Guwahati Verandah Memories',
    transcript: 'মিনোতি বা, মই মায়া। গুৱাহাটীত ব্ৰহ্মপুত্ৰৰ বতাহ বলিছে। আপোনাৰ মৰমৰ বৰগীতৰ কথা মনত পৰিছে। আমি সকলো কুশলে আছো। (Minoti Ba, it is Maya. Gentle breeze on the Brahmaputra. Everything is well with us.)',
    recordedAt: '2 days ago',
    durationSec: 9,
  },
];

const VOICE_NOTES_LOCAL_KEY = 'mindsync_voice_notes_cache';

export async function saveVoiceNote(note: Omit<VoiceNoteAnchor, 'id'>): Promise<VoiceNoteAnchor> {
  const newNote: VoiceNoteAnchor = {
    ...note,
    id: `vn-${Date.now()}`,
  };

  try {
    const existing = await getVoiceNotes();
    const updated = [newNote, ...existing];
    localStorage.setItem(VOICE_NOTES_LOCAL_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Local storage voice note save error', e);
  }

  try {
    const col = collection(db, 'voice_notes');
    await addDoc(col, {
      ...newNote,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore voice note save warning (saved locally):', err);
  }

  return newNote;
}

export async function getVoiceNotes(): Promise<VoiceNoteAnchor[]> {
  try {
    const col = collection(db, 'voice_notes');
    const q = query(col, limit(12));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const notes: VoiceNoteAnchor[] = [];
      snap.forEach((d) => {
        const data = d.data();
        notes.push({
          id: d.id,
          speakerName: data.speakerName,
          relation: data.relation || 'Family',
          title: data.title,
          transcript: data.transcript || '',
          audioBase64: data.audioBase64,
          recordedAt: data.recordedAt || 'Recently',
          durationSec: data.durationSec || 8,
        });
      });
      return notes;
    }
  } catch (err) {
    console.warn('Firestore voice notes fetch error, reading cached notes:', err);
  }

  try {
    const local = localStorage.getItem(VOICE_NOTES_LOCAL_KEY);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {}

  return DEFAULT_VOICE_NOTES;
}

export async function saveCaregiverCheckin(checkin: CaregiverCheckin): Promise<void> {
  try {
    const col = collection(db, 'caregiver_checkins');
    await addDoc(col, {
      ...checkin,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore caregiver checkin save warning:', err);
  }
}

const SOS_LOCAL_KEY = 'mindsync_sos_alerts_cache';

export async function saveSosAlert(alert: SosAlert): Promise<string | null> {
  const alertWithTime: SosAlert = {
    ...alert,
    timestamp: alert.timestamp || new Date().toISOString(),
  };

  // Cache locally
  try {
    const existing = JSON.parse(localStorage.getItem(SOS_LOCAL_KEY) || '[]');
    localStorage.setItem(SOS_LOCAL_KEY, JSON.stringify([alertWithTime, ...existing].slice(0, 20)));
  } catch (_) {}

  // Save to Firestore
  try {
    const col = collection(db, 'sos_alerts');
    const docRef = await addDoc(col, alertWithTime);
    return docRef.id;
  } catch (err) {
    console.warn('Firestore SOS alert save warning (saved locally):', err);
    return 'local-' + Date.now();
  }
}

export async function getLatestSosAlerts(): Promise<SosAlert[]> {
  try {
    const col = collection(db, 'sos_alerts');
    const q = query(col, limit(10));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: SosAlert[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          timestamp: data.timestamp,
          status: data.status,
          contactPhone: data.contactPhone,
          patientName: data.patientName,
          message: data.message,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      });
      return list;
    }
  } catch (err) {
    console.warn('Firestore SOS fetch error, reading cached alerts:', err);
  }

  try {
    const local = localStorage.getItem(SOS_LOCAL_KEY);
    if (local) return JSON.parse(local);
  } catch (_) {}

  return [];
}


