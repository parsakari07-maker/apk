import React, { useState } from 'react';
import {
  ScreenShare,
  Cast,
  Tv,
  Play,
  Square,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  Maximize2,
  Radio,
  Wifi,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers
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
  const [selectedViewer, setSelectedViewer] = useState<string>('all');
  const [activeWatchStream, setActiveWatchStream] = useState<string | null>(null);

  const toggleMirroring = () => {
    if (onToggleMirroring) {
      onToggleMirroring();
    } else {
      setInternalIsMirroring((prev) => !prev);
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col p-3 space-y-3 select-none overflow-y-auto transition-colors duration-300 ${
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
            <h2 className="text-xs font-extrabold flex items-center gap-1.5">
              <span>اشتراک و آینه‌کردن صفحه (Screen Mirror)</span>
            </h2>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-[#818CF8]/15 text-[#818CF8] px-2 py-0.5 rounded-full font-mono font-bold border border-[#818CF8]/30">
                P2P {fps}FPS
              </span>
              <span className="text-[10px] bg-[#4CC9F0]/15 text-[#4CC9F0] px-2 py-0.5 rounded-full font-mono font-bold border border-[#4CC9F0]/30">
                ۲۴~ ms
              </span>
            </div>
          </div>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
            اشتراک و پخش زنده تصویر صفحه نمایش در شبکه محلی
          </p>
        </div>

        <div className="w-9 h-9 rounded-2xl bg-[#818CF8]/15 border border-[#818CF8]/30 flex items-center justify-center text-[#818CF8]">
          <ScreenShare className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Main Broadcast Control / Preview Screen */}
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
              {isMirroring ? 'در حال پخش زنده صفحه نمایش' : 'اشتراک صفحه غیرفعال است'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setQuality('1080p')}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
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
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
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

        {/* Video Canvas / Mock Viewport */}
        <div className="relative w-full h-44 rounded-xl overflow-hidden bg-[#0A0C10] border border-[#262C38] flex flex-col items-center justify-center">
          {isMirroring ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#111318]/90 via-[#0A0C10] to-[#111318]/90">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400/80 flex items-center justify-center text-emerald-400 mb-2 shadow-lg shadow-emerald-500/20 animate-pulse">
                <Cast className="w-7 h-7" />
              </div>
              <div className="text-xs font-bold text-white">در حال پخش صفحه نمایش</div>
              <div className="text-[10px] text-[#4CC9F0] font-mono mt-0.5">
                {quality} @ {fps}fps • Latency: 18ms
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#111318] border border-[#262C38] flex items-center justify-center text-[#70A5D8] mb-2">
                <Tv className="w-6 h-6 opacity-60" />
              </div>
              <div className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                صفحه نمایش آماده پخش است
              </div>
            </div>
          )}

          {/* Floating Action Button */}
          <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between">
            <button
              onClick={() => setIncludeAudio(!includeAudio)}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                includeAudio
                  ? 'bg-[#4CC9F0]/20 text-[#4CC9F0] border-[#4CC9F0]/40'
                  : isDark
                  ? 'bg-[#111318]/80 text-[#94A3B8] border-[#262C38]'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {includeAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-bold">{includeAudio ? 'انتقال صدای داخلی' : 'بدون صدا'}</span>
            </button>

            <button
              onClick={toggleMirroring}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                isMirroring
                  ? 'bg-[#FF5252] text-white hover:bg-[#FF5252]/90 shadow-[#FF5252]/20'
                  : 'bg-[#4CC9F0] text-[#111318] hover:bg-[#4CC9F0]/90 shadow-[#4CC9F0]/25'
              }`}
            >
              {isMirroring ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>توقف پخش صفحه</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>شروع اشتراک صفحه</span>
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
                  پخش در پس‌زمینه فعال است
                </span>
              </div>

              {onNavigateTab && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateTab('walkie')}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>ورود به بیسیم</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('radar')}
                    className="px-2.5 py-1 bg-[#141A26] hover:bg-[#1E2638] text-slate-300 border border-[#262C38] rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
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
            <span className="text-xs font-bold">دستگاه‌های متصل در شبکه ({peers.length})</span>
          </div>
          <span className="text-[10px] text-[#4CC9F0] font-mono font-bold">RTSP:8554</span>
        </div>

        <div className="space-y-1.5">
          {peers.map((peer) => (
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
                    {peer.ip} • پینگ: {peer.pingMs}ms
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#4CC9F0]/15 text-[#4CC9F0] border border-[#4CC9F0]/30 font-mono">
                  آماده دریافت
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
