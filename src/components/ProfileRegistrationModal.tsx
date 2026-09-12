import React, { useState } from 'react';
import { X, User, Heart, Phone, MapPin, Shield, Check, Globe, Sparkles } from 'lucide-react';
import { UserProfile, LanguageCode } from '../types';
import { saveUserProfile } from '../lib/firebase';

const HEART_LANGUAGES: Array<{ code: LanguageCode; name: string; nativeName: string }> = [
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'kha', name: 'Khasi', nativeName: 'Ka Ktien Khasi' },
  { code: 'bdo', name: 'Bodo', nativeName: 'बोड़ो' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
  { code: 'gro', name: 'Garo', nativeName: 'A·chik' },
  { code: 'lus', name: 'Mizo', nativeName: 'Mizo ṭawng' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];

interface ProfileRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

export const ProfileRegistrationModal: React.FC<ProfileRegistrationModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await saveUserProfile(formData);
      onSaveProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="profile-registration-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="profile-registration-card"
        className="bg-[#FAF7EE] border border-[#2D493E]/20 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#1A4335] text-[#FAF7EE] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#E8DCC4]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold tracking-tight">
                Profile Registration & Care Anchor
              </h3>
              <p className="text-xs text-[#E8DCC4]/80">
                Persistent database storage for patient & caregiver circle
              </p>
            </div>
          </div>
          <button
            id="btn-close-profile-modal"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Patient Details */}
          <div className="bg-white border border-[#2D493E]/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#1A4335] font-semibold text-xs uppercase tracking-wider">
              <Heart className="w-4 h-4 text-rose-600" />
              <span>Patient Profile & Dignity Anchor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1C2826] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  placeholder="e.g. Minoti Baruah"
                  className="w-full px-3 py-2 rounded-xl border border-[#2D493E]/20 focus:border-[#1A4335] focus:outline-hidden bg-[#FAF7EE]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C2826] mb-1">
                  Loving Call-Sign / Pet Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.patientCallSign}
                  onChange={(e) => setFormData({ ...formData, patientCallSign: e.target.value })}
                  placeholder="e.g. Aita Minoti"
                  className="w-full px-3 py-2 rounded-xl border border-[#2D493E]/20 focus:border-[#1A4335] focus:outline-hidden bg-[#FAF7EE]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-[#1C2826] mb-1">
                  Care Stage
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) =>
                    setFormData({ ...formData, stage: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#2D493E]/20 focus:border-[#1A4335] focus:outline-hidden bg-[#FAF7EE]/50 text-xs"
                >
                  <option value="early">Early Stage (Mild Memory Slips)</option>
                  <option value="moderate">Moderate Stage (Needs Verbal Anchors)</option>
                  <option value="advanced">Advanced (Sensory & Soft Music Focus)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C2826] mb-1">
                  Primary Heart Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value as LanguageCode })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#2D493E]/20 focus:border-[#1A4335] focus:outline-hidden bg-[#FAF7EE]/50 text-xs"
                >
                  {HEART_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1C2826] mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Calming Triggers & Comfort Anchors
              </label>
              <textarea
                rows={2}
                value={formData.calmingTriggers}
                onChange={(e) => setFormData({ ...formData, calmingTriggers: e.target.value })}
                placeholder="e.g. Warm Tulsi tea, morning Borgeet chants, touching pine needles..."
                className="w-full px-3 py-2 rounded-xl border border-[#2D493E]/20 focus:border-[#1A4335] focus:outline-hidden bg-[#FAF7EE]/50 text-xs"
              />
            </div>
          </div>

          {/* Caregiver & Emergency Contacts */}
          <div className="bg-white border border-[#2D493E]/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#1A4335] font-semibold text-xs uppercase tracking-wider">
              <Phone className="w-4 h-4 text-emerald-700" />
              <span>Primary Caregiver & Emergency Circle</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1C2826] mb-1">
                  Caregiver Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.caregiverName}
                  onChange={(e) => setFormData({ ...formData, caregiverName: e.target.value })}
                  placeholder="e.g. Ananya Baruah"
                  className="w-full px-3 py-2 rounded-xl border border-[#2D493E]/20 focus:border-[#1A4335] focus:outline-hidden bg-[#FAF7EE]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C2826] mb-1">
                  Caregiver Phone
                </label>
                <input
                  type="tel"
                  value={formData.caregiverPhone}
                  onChange={(e) => setFormData({ ...formData, caregiverPhone: e.target.value })}
                  placeholder="+91 94350 12345"
                  className="w-full px-3 py-2 rounded-xl border border-[#2D493E]/20 focus:border-[#1A4335] focus:outline-hidden bg-[#FAF7EE]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1C2826] mb-1">
                Emergency Doctor / Clinic Line
              </label>
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="+91 98640 67890 (Civil Hospital Shillong)"
                className="w-full px-3 py-2 rounded-xl border border-[#2D493E]/20 focus:border-[#1A4335] focus:outline-hidden bg-[#FAF7EE]/50"
              />
            </div>
          </div>

          {/* Safe Zone Geofence Settings */}
          <div className="bg-white border border-[#2D493E]/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#1A4335] font-semibold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4 text-sky-700" />
              <span>Safe Sanctuary Geofence Perimeter</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1C2826] mb-1">
                Home Sanctuary Address / City
              </label>
              <input
                type="text"
                value={formData.homeCity}
                onChange={(e) => setFormData({ ...formData, homeCity: e.target.value })}
                placeholder="e.g. Laitumkhrah, Shillong, Meghalaya"
                className="w-full px-3 py-2 rounded-xl border border-[#2D493E]/20 focus:border-[#1A4335] focus:outline-hidden bg-[#FAF7EE]/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1C2826] mb-1">
                  Safe Perimeter Radius
                </label>
                <select
                  value={formData.safeZoneRadiusMeters || 500}
                  onChange={(e) =>
                    setFormData({ ...formData, safeZoneRadiusMeters: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#2D493E]/20 focus:border-[#1A4335] focus:outline-hidden bg-[#FAF7EE]/50 text-xs"
                >
                  <option value={200}>200 meters (Immediate Verandah & Garden)</option>
                  <option value={500}>500 meters (Neighborhood Sanctuary)</option>
                  <option value={1000}>1,000 meters (Local Ward)</option>
                  <option value={2000}>2,000 meters (Extended Town)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C2826] mb-1">
                  Anchor Coordinates
                </label>
                <div className="px-3 py-2 rounded-xl bg-[#FAF7EE] border border-[#2D493E]/15 text-xs text-[#5C6B64]">
                  {formData.safeZoneLat?.toFixed(4)}, {formData.safeZoneLng?.toFixed(4)}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Save Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#2D493E] hover:bg-black/5 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-medium text-white bg-[#1A4335] hover:bg-[#15362a] rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Saved to Firestore!
                </>
              ) : isSaving ? (
                <>Saving...</>
              ) : (
                <>Save Profile Registration</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
