import React from 'react';
import { ShieldAlert, PhoneCall, MessageSquare, MapPin, X, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { UserProfile, LanguageCode } from '../types';

interface SosDispatchedModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  currentLang: LanguageCode;
  alertCoordinates?: { lat: number; lng: number };
  timestamp?: string;
}

export const SosDispatchedModal: React.FC<SosDispatchedModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  currentLang,
  alertCoordinates,
  timestamp,
}) => {
  if (!isOpen) return null;

  const lat = alertCoordinates?.lat || userProfile.safeZoneLat || 25.5788;
  const lng = alertCoordinates?.lng || userProfile.safeZoneLng || 91.8933;
  const mapLink = `https://maps.google.com/?q=${lat},${lng}`;

  const emergencyPhone = userProfile.emergencyPhone || userProfile.caregiverPhone || '+91 98640 67890';
  const caregiverPhone = userProfile.caregiverPhone || '+91 94350 12345';
  const patientName = userProfile.patientCallSign || userProfile.patientName || 'Aita Minoti';

  const defaultSmsText = `🚨 EMERGENCY ALERT (MindSync): ${patientName} needs immediate assistance in ${userProfile.homeCity || 'Shillong'}. Live location: ${mapLink}. Please call right away.`;

  const handleSendWhatsApp = () => {
    const cleanPhone = emergencyPhone.replace(/[^\d+]/g, '');
    const url = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(defaultSmsText)}`;
    window.open(url, '_blank');
  };

  const handleSendSms = () => {
    const cleanPhone = emergencyPhone.replace(/[^\d+]/g, '');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    window.location.href = `sms:${cleanPhone}${separator}body=${encodeURIComponent(defaultSmsText)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF7EE] border-2 border-rose-500 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp">
        {/* Urgent Header Banner */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white ring-4 ring-white/30 animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-white text-rose-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Emergency Active
                </span>
                <span className="text-xs text-rose-100 font-medium">
                  {timestamp || 'Just now'}
                </span>
              </div>
              <h2 className="text-lg font-bold font-bengali leading-tight mt-0.5">
                জৰুৰীকালীন সতৰ্কবাৰ্তা প্ৰেৰণ
              </h2>
              <p className="text-xs text-rose-100">
                Automated SMS & Alert Dispatched
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Status Box */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Automated notification triggered for {patientName}</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              Your registered emergency contact ({emergencyPhone}) has been provided with your coordinates. A comforting audio voice is reassuring {patientName}.
            </p>
          </div>

          {/* Location Details */}
          <div className="bg-white border border-[#E8E3D5] rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wide block">
                  Broadcast Coordinates
                </span>
                <span className="text-xs font-semibold text-stone-800">
                  {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                </span>
              </div>
            </div>

            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#1A4335] bg-[#FAF7EE] border border-[#E8E3D5] px-3 py-1.5 rounded-xl hover:bg-[#ece8dd] flex items-center gap-1 transition-colors"
            >
              <span>View Map</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Action Dispatch Buttons */}
          <div className="space-y-2 pt-1">
            {/* Primary SMS Re-Send / Confirm */}
            <button
              onClick={handleSendSms}
              className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send / Re-Open SMS to {emergencyPhone}</span>
            </button>

            {/* WhatsApp Alternative */}
            <button
              onClick={handleSendWhatsApp}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Send via WhatsApp ({emergencyPhone})</span>
            </button>

            {/* Direct Telephone Call */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${emergencyPhone}`}
                className="py-2.5 px-3 rounded-2xl bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Emergency</span>
              </a>

              <a
                href="tel:112"
                className="py-2.5 px-3 rounded-2xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Dial 112 (India)</span>
              </a>
            </div>
          </div>

          {/* Safe Dismissal */}
          <div className="pt-2 text-center">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline decoration-stone-300 underline-offset-4"
            >
              আইতা সুৰক্ষিত আছে • Cancel / Aita is Safe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
