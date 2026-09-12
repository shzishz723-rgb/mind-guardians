import React, { useState, useEffect } from 'react';
import { MapPin, ShieldCheck, AlertTriangle, Navigation, RefreshCw, CheckCircle2, Home, Share2, PhoneCall, Volume2, MessageSquare } from 'lucide-react';
import { LocationStatus, Mode, UserProfile } from '../types';
import { recordLocationTelemetry } from '../lib/firebase';
import { ambientSanctuary } from '../lib/audioSpeech';

interface LocationAccessCardProps {
  currentMode: Mode;
  userProfile: UserProfile;
  onUpdateSafeZone?: (lat: number, lng: number) => void;
}

// Haversine formula to compute distance between two coords in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const LocationAccessCard: React.FC<LocationAccessCardProps> = ({
  currentMode,
  userProfile,
  onUpdateSafeZone,
}) => {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>({
    latitude: userProfile.safeZoneLat || 25.5788,
    longitude: userProfile.safeZoneLng || 91.8933,
    accuracy: 12,
    isWithinSafeZone: true,
    distanceFromHomeMeters: 18,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    error: null,
    permissionStatus: 'prompt',
    isTracking: false,
  });

  const [isRequesting, setIsRequesting] = useState(false);
  const [justSavedHome, setJustSavedHome] = useState(false);

  // Check permission state on mount if supported
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          setLocationStatus((prev) => ({
            ...prev,
            permissionStatus: status.state as any,
          }));
          if (status.state === 'granted') {
            requestLocation(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const requestLocation = (silent = false) => {
    if (!navigator.geolocation) {
      setLocationStatus((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
        permissionStatus: 'unsupported',
      }));
      return;
    }

    if (!silent) setIsRequesting(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const dist = calculateDistance(
          latitude,
          longitude,
          userProfile.safeZoneLat,
          userProfile.safeZoneLng
        );
        const withinSafe = dist <= (userProfile.safeZoneRadiusMeters || 500);

        const updated: LocationStatus = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          isWithinSafeZone: withinSafe,
          distanceFromHomeMeters: dist,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          error: null,
          permissionStatus: 'granted',
          isTracking: true,
        };

        setLocationStatus(updated);
        setIsRequesting(false);

        // Sync to backend database
        recordLocationTelemetry({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          isWithinSafeZone: withinSafe,
          distanceFromHomeMeters: dist,
          timestamp: new Date().toISOString(),
        });
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setIsRequesting(false);
        setLocationStatus((prev) => ({
          ...prev,
          permissionStatus: err.code === 1 ? 'denied' : 'prompt',
          error:
            err.code === 1
              ? 'Location permission was denied. Tap to grant permission in browser settings.'
              : 'Unable to retrieve high-precision GPS. Reverted to Shillong home sanctuary.',
          isWithinSafeZone: true,
          distanceFromHomeMeters: 25,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  const handleSetCurrentAsHome = () => {
    if (locationStatus.latitude && locationStatus.longitude && onUpdateSafeZone) {
      onUpdateSafeZone(locationStatus.latitude, locationStatus.longitude);
      setJustSavedHome(true);
      setTimeout(() => setJustSavedHome(false), 2500);
    }
  };

  if (currentMode === 'patient') {
    // Dignity-first calming presentation for Aita
    return (
      <div
        id="patient-location-card"
        className="bg-[#FAF7EE] border border-[#2D493E]/15 rounded-2xl p-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1A4335]/10 text-[#1A4335] flex items-center justify-center shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1A4335]">
                Safe Sanctuary Anchor
              </p>
            </div>
            <p className="font-serif text-base text-[#1C2826] font-medium leading-tight">
              {userProfile.homeCity || 'Laitumkhrah, Shillong'}
            </p>
            <p className="text-xs text-[#2D493E]/80 mt-0.5">
              {locationStatus.isWithinSafeZone
                ? 'আইতা, আপুনি আপোনাৰ নিৰাপদ ঘৰতেই আছে। (Aita, you are safely at home.)'
                : 'Family is right with you in Shillong.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Caregiver detailed telemetry & geofence monitor
  return (
    <div
      id="caregiver-location-card"
      className="bg-white border border-[#2D493E]/15 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              locationStatus.isWithinSafeZone
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {locationStatus.isWithinSafeZone ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="font-serif text-base font-semibold text-[#1C2826] flex items-center gap-2">
              Safe Zone GPS Telemetry
              {locationStatus.isWithinSafeZone ? (
                <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Inside Perimeter
                </span>
              ) : (
                <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  Perimeter Alert
                </span>
              )}
            </h4>
            <p className="text-xs text-[#5C6B64]">
              Anchored to: <span className="font-medium text-[#1C2826]">{userProfile.homeCity}</span>
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-gps"
          onClick={() => requestLocation(false)}
          disabled={isRequesting}
          className="p-2 text-[#2D493E] hover:bg-[#FAF7EE] rounded-lg transition-colors border border-[#2D493E]/10"
          title="Refresh GPS Telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${isRequesting ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {locationStatus.error && (
        <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <span>{locationStatus.error}</span>
            {locationStatus.permissionStatus !== 'granted' && (
              <button
                onClick={() => requestLocation(false)}
                className="mt-1 block font-semibold text-amber-900 underline"
              >
                Allow Browser Location Access
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid of Geolocation Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
        <div className="p-2.5 rounded-xl bg-[#FAF7EE] border border-[#2D493E]/10">
          <p className="text-[#5C6B64] text-[11px]">Distance to Home</p>
          <p className="font-medium text-sm text-[#1C2826] mt-0.5">
            {locationStatus.distanceFromHomeMeters !== null
              ? `${locationStatus.distanceFromHomeMeters} m`
              : 'Verandah'}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-[#FAF7EE] border border-[#2D493E]/10">
          <p className="text-[#5C6B64] text-[11px]">Safe Perimeter</p>
          <p className="font-medium text-sm text-[#1C2826] mt-0.5">
            {userProfile.safeZoneRadiusMeters || 500} m
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-[#FAF7EE] border border-[#2D493E]/10">
          <p className="text-[#5C6B64] text-[11px]">GPS Accuracy</p>
          <p className="font-medium text-sm text-[#1C2826] mt-0.5">
            ±{locationStatus.accuracy || 12} m
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-[#FAF7EE] border border-[#2D493E]/10">
          <p className="text-[#5C6B64] text-[11px]">Last Synchronized</p>
          <p className="font-medium text-sm text-[#1C2826] mt-0.5">
            {locationStatus.lastUpdated || 'Live'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#2D493E]/10">
        <div className="flex items-center gap-1.5 text-xs text-[#5C6B64]">
          <Navigation className="w-3.5 h-3.5 text-[#1A4335]" />
          <span>
            {locationStatus.latitude?.toFixed(4)}, {locationStatus.longitude?.toFixed(4)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onUpdateSafeZone && (
            <button
              id="btn-set-home-coords"
              onClick={handleSetCurrentAsHome}
              className="px-2.5 py-1 text-xs font-medium text-[#1A4335] bg-[#1A4335]/10 hover:bg-[#1A4335]/15 rounded-lg transition-colors flex items-center gap-1"
            >
              {justSavedHome ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Saved
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  Set As Home Safe-Zone
                </>
              )}
            </button>
          )}

          {locationStatus.permissionStatus !== 'granted' && (
            <button
              id="btn-request-location"
              onClick={() => requestLocation(false)}
              className="px-3 py-1 text-xs font-medium text-white bg-[#1A4335] hover:bg-[#15362a] rounded-lg transition-colors shadow-xs"
            >
              Gain Location Access
            </button>
          )}
        </div>
      </div>

      {/* Emergency Wandering Geofence SOS Broadcast */}
      <div className="mt-2 pt-2.5 border-t border-[#2D493E]/10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[11px] font-bold text-rose-900 tracking-wide uppercase">
              জরুৰীকালীন সাহায্য • One-Tap Safe-Zone SOS
            </span>
          </div>
          <span className="text-[10px] text-stone-500">
            Automated Family & Community Alert
          </span>
        </div>

        {(() => {
          const mapUrl = `https://maps.google.com/?q=${locationStatus.latitude},${locationStatus.longitude}`;
          const sosText = `🚨 MINDSYNC SAFE-ZONE ALERT: ${userProfile.patientName || 'Aita Minoti'} may need assistance or has moved past the home perimeter (${locationStatus.distanceFromHomeMeters || 0}m from home). Live GPS Coordinates: ${mapUrl}. Primary Caregiver: ${userProfile.caregiverName || 'Ananya'} (${userProfile.caregiverPhone || '+91 98620 00000'}).`;
          const waUrl = `https://wa.me/?text=${encodeURIComponent(sosText)}`;
          const smsUrl = `sms:${userProfile.emergencyPhone || userProfile.caregiverPhone || ''}?body=${encodeURIComponent(sosText)}`;
          const telUrl = `tel:${userProfile.emergencyPhone || userProfile.caregiverPhone || ''}`;

          return (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center justify-center gap-1 text-center shadow-xs transition-transform active:scale-95"
              >
                <Share2 className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>

              <a
                href={smsUrl}
                className="py-2 px-2 rounded-xl bg-[#1A4335] hover:bg-[#2D493E] text-white text-[11px] font-bold flex items-center justify-center gap-1 text-center shadow-xs transition-transform active:scale-95"
              >
                <MessageSquare className="w-3 h-3" />
                <span>SMS Dispatch</span>
              </a>

              <a
                href={telUrl}
                className="py-2 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 text-center shadow-xs transition-transform active:scale-95"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Call Caregiver</span>
              </a>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
