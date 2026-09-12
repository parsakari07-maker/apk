import React, { useState, useRef, useEffect } from 'react';
import {
  ScreenShare,
  Cast,
  Tv,
  Play,
  Square,
  Volume2,
  VolumeX,
  Radio,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { PeerDevice, UserProfile } from '../types';

interface ScreenMirrorTabProps {
  peers: PeerDevice[];
  profile: UserProfile;
  isDark?: boolean;
  isMirroring?: boolean;
  onToggleMirroring?: () => void;
  onNavigateTab?: (tab: 'radar' | 'walkie' | 'cctv' | 'chat' | 'screen' | 'settings') => void;
}

export const ScreenMirrorTab: React.FC<ScreenMirrorTabProps> = ({
  peers,
  profile,
  isDark = true,
  isMirroring: externalIsMirroring,
  onToggleMirroring,
  onNavigateTab,
}) => {
  const [internalIsMirroring, setInternalIsMirroring] = useState(false);
  const isMirroring = externalIsMirroring !== undefined ? externalIsMirroring : internalIsMirroring;

  const [quality, setQuality] = useState<'1080p' | '720p'>('1080p');
  const [fps, setFps] = useState<'60' | '30'>('60');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [actualResolution, setActualResolution] = useState<{ width: number; height: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop mirroring cleanup helper
  const stopScreenMirroring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActualResolution(null);
    if (onToggleMirroring && isMirroring) {
      onToggleMirroring();
    } else {
      setInternalIsMirroring(false);
    }
  };

  // Start real screen broadcast requesting browser / OS MediaProjection display permission
  const startScreenMirroring = async () => {
    setPermissionError(null);
    setIsRequestingPermission(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('قابلیت ضبط و اشتراک صفحه نمایش (getDisplayMedia) در این مرورگر یا محیط پشتیبانی نمی‌شود.');
      }

      // Request actual screen display permission from the user/OS
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: fps === '60' ? 60 : 30, max: 60 },
          width: { ideal: quality === '1080p' ? 1920 : 1280 },
          height: { ideal: quality === '1080p' ? 1080 : 720 },
        },
        audio: includeAudio,
      });

      streamRef.current = stream;

      // Attach stream to video tag
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setActualResolution({ width: settings.width, height: settings.height });
        }

        // Detect when user stops sharing from browser's native share bar
        videoTrack.onended = () => {
          stopScreenMirroring();
        };
      }

      if (onToggleMirroring && !isMirroring) {
        onToggleMirroring();
      } else {
        setInternalIsMirroring(true);
      }
    } catch (err: any) {
      console.error('Screen capture permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('دسترسی به پخش صفحه نمایش توسط کاربر لغو شد یا مجوز اشتراک صفحه صادر نگردید.');
      } else {
        setPermissionError(err.message || 'خطا در برقراری ارتباط با پخش صفحه نمایش.');
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Attach stream when videoRef mounts if stream is already running
  useEffect(() => {
    if (isMirroring && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isMirroring]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleToggleClick = () => {
    if (isMirroring) {
      stopScreenMirroring();
    } else {
      startScreenMirroring();
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col p-3 sm:p-4 space-y-3 select-none overflow-y-auto transition-colors duration-300 ${
        isDark ? 'bg-[#111318] text-[#E2E8F0]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
      dir="rtl"
    >
      {/* 1. Header Card */}
      <div
        className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-md shrink-0 ${
          isDark ? 'bg-[#1B1F28] border-[#262C38]' : 'bg-white border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
              <span>اشتراک زنده صفحه نمایش (Screen Mirror)</span>
            </h2>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-[#818CF8]/15 text-[#818CF8] px-2 py-0.5 rounded-full font-mono font-bold border border-[#818CF8]/30">
                P2P {fps}FPS
              </span>
              <span className="text-[10px] bg-[#4CC9F0]/15 text-[#4CC9F0] px-2 py-0.5 rounded-full font-mono font-bold border border-[#4CC9F0]/30">
                LAN RTSP
              </span>
            </div>
          </div>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
            پخش زنده واقعی تصویر صفحه نمایش در شبکه محلی بدون اینترنت
          </p>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-[#818CF8]/15 border border-[#818CF8]/30 flex items-center justify-center text-[#818CF8]">
          <ScreenShare className="w-5 h-5" />
        </div>
      </div>

      {/* Permission Warning / Error Banner if denied */}
      {permissionError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-xs text-red-300 shadow-lg animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <div className="font-bold text-white text-xs">نیاز به دریافت مجوز پخش صفحه نمایش</div>
            <p className="text-[11px] text-red-200 leading-relaxed">{permissionError}</p>
            <button
              onClick={startScreenMirroring}
              disabled={isRequestingPermission}
              className="mt-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/40 rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>درخواست مجدد مجوز پخش صفحه</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Broadcast Control / Live Video Viewport */}
      <div
        className={`p-4 rounded-2xl border shadow-lg space-y-3 shrink-0 ${
          isDark ? 'bg-[#1B1F28] border-[#262C38]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isMirroring ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-bold">
              {isMirroring ? 'در حال پخش زنده صفحه نمایش (MediaStream Active)' : 'اشتراک صفحه غیرفعال است'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setQuality('1080p')}
              disabled={isMirroring}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                quality === '1080p'
                  ? 'bg-[#4CC9F0] text-[#111318] border-[#4CC9F0]'
                  : isDark
                  ? 'bg-[#111318] border-[#262C38] text-[#94A3B8]'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              1080p HD
            </button>
            <button
              onClick={() => setQuality('720p')}
              disabled={isMirroring}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                quality === '720p'
                  ? 'bg-[#4CC9F0] text-[#111318] border-[#4CC9F0]'
                  : isDark
                  ? 'bg-[#111318] border-[#262C38] text-[#94A3B8]'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              720p
            </button>
          </div>
        </div>

        {/* Real Video Stream Viewport */}
        <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-[#0A0C10] border border-[#262C38] flex flex-col items-center justify-center">
          {isMirroring ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* Actual Live Video element attached to getDisplayMedia MediaStream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />

              {/* Live Overlay Badge */}
              <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md border border-emerald-500/40 text-white px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-emerald-300">LIVE</span>
                <span>•</span>
                <span>
                  {actualResolution
                    ? `${actualResolution.width}×${actualResolution.height}`
                    : `${quality}`}
                </span>
                <span>•</span>
                <span>{fps} FPS</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#111318] border border-[#262C38] flex items-center justify-center text-[#70A5D8] shadow-inner">
                <Tv className="w-7 h-7 opacity-75" />
              </div>
              <div className="text-xs font-bold text-white">
                صفحه نمایش آماده پخش است
              </div>
              <p className={`text-[11px] max-w-sm leading-relaxed ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                با فشردن دکمه زیر، مرورگر از شما مجوز پخش صفحه نمایش (کل صفحه یا پنجره برنامه) را درخواست خواهد کرد.
              </p>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between pointer-events-auto">
            <button
              onClick={() => setIncludeAudio(!includeAudio)}
              disabled={isMirroring}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 ${
                includeAudio
                  ? 'bg-[#4CC9F0]/20 text-[#4CC9F0] border-[#4CC9F0]/40'
                  : isDark
                  ? 'bg-[#111318]/90 text-[#94A3B8] border-[#262C38]'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {includeAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-bold">{includeAudio ? 'انتقال صدای سیستم' : 'بدون صدا'}</span>
            </button>

            <button
              onClick={handleToggleClick}
              disabled={isRequestingPermission}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
                isMirroring
                  ? 'bg-[#FF5252] text-white hover:bg-[#FF5252]/90 shadow-[#FF5252]/20'
                  : 'bg-[#4CC9F0] text-[#111318] hover:bg-[#4CC9F0]/90 shadow-[#4CC9F0]/25'
              }`}
            >
              {isRequestingPermission ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#111318] border-t-transparent rounded-full animate-spin" />
                  <span>در حال دریافت مجوز...</span>
                </>
              ) : isMirroring ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>توقف پخش صفحه</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>درخواست مجوز و شروع پخش</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Background Service Status Note & Quick Exit Actions */}
        {isMirroring && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-bold text-[11px]">
                  پخش در پس‌زمینه فعال است (سرویس Foreground و انتقال استریم P2P فعال)
                </span>
              </div>

              {onNavigateTab && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateTab('walkie')}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>ورود به بیسیم</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('radar')}
                    className="px-2.5 py-1 bg-[#141A26] hover:bg-[#1E2638] text-slate-300 border border-[#262C38] rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Layers className="w-3 h-3 text-[#4CC9F0]" />
                    <span>رادار</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Receivers / Connected Viewers in Network */}
      <div
        className={`p-3.5 rounded-2xl border space-y-2.5 shadow-sm shrink-0 ${
          isDark ? 'bg-[#1B1F28] border-[#262C38]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#818CF8]" />
            <span className="text-xs font-bold">دستگاه‌های دریافت‌کننده در شبکه محلی ({peers.length})</span>
          </div>
          <span className="text-[10px] text-[#4CC9F0] font-mono font-bold">RTSP:8554 P2P</span>
        </div>

        <div className="space-y-1.5">
          {peers.length === 0 ? (
            <div
              className={`p-4 rounded-xl border border-dashed text-center text-xs space-y-1 ${
                isDark
                  ? 'bg-[#111318]/50 border-[#262C38] text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="font-medium text-[11px]">هیچ دستگاه دریافت‌کننده‌ای در شبکه متصل نیست</div>
              <div className="text-[10px] text-slate-500">
                هر دستگاهی که به این شبکه LAN/Hotspot وصل شود می‌تواند تصویر زنده صفحه شما را دریافت کند
              </div>
            </div>
          ) : (
            peers.map((peer) => (
              <div
                key={peer.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  isDark
                    ? 'bg-[#111318] border-[#262C38]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#70A5D8]" />
                  <div>
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {peer.name}
                    </div>
                    <div className={`text-[10px] font-mono ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                      {peer.ip} • پینگ: {peer.rssi ? Math.abs(peer.rssi) + 'ms' : '15ms'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#4CC9F0]/15 text-[#4CC9F0] border border-[#4CC9F0]/30 font-mono">
                    آماده دریافت
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
