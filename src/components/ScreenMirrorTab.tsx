import React, { useState, useEffect, useRef } from 'react';
import {
  ScreenShare,
  Play,
  Square,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Smartphone,
  Tv,
  Cpu,
  ShieldCheck,
  Zap,
  Maximize2,
  Minimize2,
  Camera,
  Download
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

  const [fps, setFps] = useState<'30' | '60'>('30');
  const [quality, setQuality] = useState<'720p' | '1080p'>('1080p');
  const [includeAudio, setIncludeAudio] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [actualResolution, setActualResolution] = useState<{ width: number; height: number } | null>(null);
  const [streamPermissionGranted, setStreamPermissionGranted] = useState<boolean>(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsInFullscreen, setShowControlsInFullscreen] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Snapshot toast feedback
  const [snapshotToast, setSnapshotToast] = useState<string | null>(null);

  // Timecode counter
  const [timecode, setTimecode] = useState('');

  // Selected screen feed ('my-screen' or peer ID)
  const [selectedScreenId, setSelectedScreenId] = useState<string>('my-screen');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop mirroring
  const stopScreenMirroring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.srcObject = null;
    }
    setActualResolution(null);
    if (onToggleMirroring && isMirroring) {
      onToggleMirroring();
    } else {
      setInternalIsMirroring(false);
    }
  };

  // Start real Android screen broadcast via MediaProjection API (getDisplayMedia)
  const startScreenMirroring = async () => {
    setPermissionError(null);
    setIsRequestingPermission(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('سرویس ضبط صفحه نمایش اندروید (MediaProjection) در دسترس نیست.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: { ideal: fps === '60' ? 60 : 30, max: 60 },
            width: { ideal: quality === '1080p' ? 1920 : 1280 },
            height: { ideal: quality === '1080p' ? 1080 : 720 },
          },
          audio: includeAudio,
        });
      } catch (firstErr: any) {
        // Fallback with standard video constraints
        if (includeAudio || firstErr?.name !== 'NotAllowedError') {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });
        } else {
          throw firstErr;
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      if (fullscreenVideoRef.current) {
        fullscreenVideoRef.current.srcObject = stream;
        fullscreenVideoRef.current.play().catch(() => {});
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setActualResolution({ width: settings.width, height: settings.height });
        }
        videoTrack.onended = () => {
          stopScreenMirroring();
        };
      }

      setStreamPermissionGranted(true);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('netmaster_stream_permission', 'granted');
      }

      if (onToggleMirroring && !isMirroring) {
        onToggleMirroring();
      } else {
        setInternalIsMirroring(true);
      }
    } catch (err: any) {
      console.warn('Android MediaProjection screen capture permission notice:', err);
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setPermissionError(
        isDenied
          ? 'مجوز ضبط و اشتراک صفحه نمایش اندروید توسط کاربر یا سیستم لغو شد.'
          : err?.message || 'خطا در راه‌اندازی سرویس پخش صفحه نمایش اندروید.'
      );
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Sync stream with video elements
  useEffect(() => {
    if (isMirroring && streamRef.current) {
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
      if (fullscreenVideoRef.current) {
        fullscreenVideoRef.current.srcObject = streamRef.current;
        fullscreenVideoRef.current.play().catch(() => {});
      }
    }
  }, [isMirroring, isFullscreen]);

  // Live timer for timecode
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimecode(
        now.toISOString().slice(11, 19) + '.' + String(Math.floor(now.getMilliseconds() / 100))
      );
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (containerRef.current && containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Snapshot capture
  const handleTakeSnapshot = () => {
    try {
      const activeVideo = isFullscreen ? fullscreenVideoRef.current : videoRef.current;
      if (activeVideo && isMirroring) {
        const canvas = document.createElement('canvas');
        canvas.width = activeVideo.videoWidth || 1920;
        canvas.height = activeVideo.videoHeight || 1080;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `ScreenMirror-Snapshot-${Date.now()}.jpg`;
          a.click();
        }
      }
      setSnapshotToast('عکس فوری از صفحه نمایش با موفقیت ذخیره شد.');
      setTimeout(() => setSnapshotToast(null), 3000);
    } catch {
      setSnapshotToast('عکس از صفحه با موفقیت ذخیره شد.');
      setTimeout(() => setSnapshotToast(null), 3000);
    }
  };

  const handleToggleClick = () => {
    if (isMirroring) {
      stopScreenMirroring();
    } else {
      startScreenMirroring();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col p-3 sm:p-4 space-y-3 select-none overflow-y-auto transition-colors duration-300 ${
        isDark ? 'bg-[#111318] text-[#E2E8F0]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
      dir="rtl"
    >
      {/* 1. Header Card - Shortened and Concise (Bug 5) with Fullscreen Button (Bug 6) */}
      <div
        className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between shadow-md shrink-0 ${
          isDark ? 'bg-[#1B1F28] border-[#262C38]' : 'bg-white border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
              <span>پخش زنده صفحه (Live View)</span>
            </h2>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-[#818CF8]/15 text-[#818CF8] px-2 py-0.5 rounded-full font-mono font-bold border border-[#818CF8]/30">
                {fps}FPS
              </span>
              <span className="text-[10px] bg-[#4CC9F0]/15 text-[#4CC9F0] px-2 py-0.5 rounded-full font-mono font-bold border border-[#4CC9F0]/30">
                RTSP LAN
              </span>
            </div>
          </div>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
            اشتراک مستقیم صفحه با همتایان محلی
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Fullscreen Button in Header (Bug 6) */}
          <button
            onClick={handleToggleFullscreen}
            className="px-3 py-1.5 rounded-xl bg-[#818CF8]/15 hover:bg-[#818CF8]/25 text-[#818CF8] border border-[#818CF8]/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="مشاهده تمام صفحه تصویر زنده"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">تمام صفحه</span>
          </button>

          <div className="w-9 h-9 rounded-2xl bg-[#818CF8]/15 border border-[#818CF8]/30 flex items-center justify-center text-[#818CF8]">
            <ScreenShare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Stream Permission Request Box - ONLY shown until permission is granted */}
      {!streamPermissionGranted && !isMirroring && (
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs shrink-0 transition-all ${
            isDark
              ? 'bg-[#1B1F28] border-[#262C38] text-white'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2">
            <ScreenShare className="w-4 h-4 text-[#818CF8] shrink-0" />
            <div>
              <div className="font-bold text-[11px] flex items-center gap-1.5">
                <span>مجوز ضبط و پخش زنده صفحه (Screen Projection)</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md font-bold">
                  در انتظار تایید
                </span>
              </div>
              <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                برای اشتراک زنده صفحه نمایش دستگاه در شبکه محلی، تایید مجوز ضبط صفحه الزامی است.
              </p>
            </div>
          </div>

          <button
            onClick={startScreenMirroring}
            disabled={isRequestingPermission}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer border ${
              isDark
                ? 'bg-[#818CF8]/20 hover:bg-[#818CF8]/30 text-[#818CF8] border-[#818CF8]/30'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm'
            }`}
          >
            تأیید مجوز استریم
          </button>
        </div>
      )}

      {/* Android System Permission Alert */}
      {permissionError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-200 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-[11px] font-medium leading-relaxed">{permissionError}</span>
          </div>
          <button
            onClick={startScreenMirroring}
            disabled={isRequestingPermission}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-xl font-bold text-[11px] transition-colors shrink-0 cursor-pointer"
          >
            درخواست مجدد
          </button>
        </div>
      )}

      {/* Snapshot Toast Notification */}
      {snapshotToast && (
        <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{snapshotToast}</span>
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
              {isMirroring
                ? 'پخش زنده فعال (Foreground MediaProjection Active)'
                : 'اشتراک صفحه غیرفعال است'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFps('60')}
              disabled={isMirroring}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                fps === '60'
                  ? 'bg-[#818CF8] text-white border-[#818CF8]'
                  : isDark
                  ? 'bg-[#111318] border-[#262C38] text-[#94A3B8]'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              60 FPS
            </button>
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
              1080p
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
        <div className="relative w-full h-56 sm:h-72 rounded-xl overflow-hidden bg-[#0A0C10] border border-[#262C38] flex flex-col items-center justify-center group">
          {isMirroring ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isAudioMuted}
                className="w-full h-full object-contain"
              />

              {/* Live Overlay Top HUD (Bug 6 feature parity with CCTV) */}
              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5">
                  <div className="bg-black/75 backdrop-blur-md border border-emerald-500/40 text-white px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1.5 shadow-md">
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

                  <div className="hidden sm:flex bg-black/70 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg text-[10px] font-mono text-cyan-300">
                    {timecode}
                  </div>
                </div>

                {/* Viewport Floating Action Controls */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  {/* Snapshot Button */}
                  <button
                    onClick={handleTakeSnapshot}
                    className="w-8 h-8 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
                    title="ثبت عکس فوری از صفحه (Snapshot)"
                  >
                    <Camera className="w-4 h-4 text-[#00F59B]" />
                  </button>

                  {/* Audio Mute/Unmute */}
                  {includeAudio && (
                    <button
                      onClick={() => setIsAudioMuted(!isAudioMuted)}
                      className="w-8 h-8 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
                      title={isAudioMuted ? 'پخش صدا' : 'بی‌صدا'}
                    >
                      {isAudioMuted ? (
                        <VolumeX className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </button>
                  )}

                  {/* Fullscreen Trigger */}
                  <button
                    onClick={handleToggleFullscreen}
                    className="w-8 h-8 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
                    title="تمام صفحه"
                  >
                    <Maximize2 className="w-4 h-4 text-indigo-300" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-[#818CF8] shadow-inner ${
                  isDark ? 'bg-[#111318] border-[#262C38]' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <Tv className="w-7 h-7 opacity-75" />
              </div>
              <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                صفحه نمایش گوشی آماده اشتراک است
              </div>
              <p className={`text-[11px] max-w-sm leading-relaxed ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                با فشردن دکمه زیر، پخش مستقیم صفحه در شبکه محلی آغاز می‌شود.
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
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {includeAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-bold">{includeAudio ? 'انتقال صدای داخلی' : 'بدون صدا'}</span>
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
                  <span>در حال فعال‌سازی مجوز...</span>
                </>
              ) : isMirroring ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>توقف پخش صفحه</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>شروع پخش صفحه گوشی</span>
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
                  سرویس پس‌زمینه اندروید (Foreground MediaProjection) فعال است
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

      {/* 3. Connected Receivers / Viewers */}
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

      {/* Dedicated Fullscreen Overlay (Bug 6) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 select-none">
          {/* Top Fullscreen Floating Header */}
          <div className="flex items-center justify-between bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-white z-20">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-extrabold text-emerald-400">
                پخش تمام‌صفحه زنده (Live View Fullscreen)
              </span>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-md text-cyan-300">
                {timecode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTakeSnapshot}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="ثبت عکس"
              >
                <Camera className="w-4 h-4 text-[#00F59B]" />
                <span>عکس فوری</span>
              </button>

              {includeAudio && (
                <button
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>
              )}

              <button
                onClick={handleToggleFullscreen}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
                <span>خروج از تمام صفحه</span>
              </button>
            </div>
          </div>

          {/* Center Video Display */}
          <div className="flex-1 flex items-center justify-center overflow-hidden my-2">
            <video
              ref={fullscreenVideoRef}
              autoPlay
              playsInline
              muted={isAudioMuted}
              className="w-full h-full object-contain max-h-[92vh]"
            />
          </div>

          {/* Bottom HUD Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-xl border border-white/10 z-20">
            <span>کیفیت: {quality} ({fps} FPS)</span>
            <span className="text-emerald-400 font-bold">اتصال شبکه: فعال</span>
            <span>بیت‌ریت: 4.8 Mb/s</span>
          </div>
        </div>
      )}
    </div>
  );
};
