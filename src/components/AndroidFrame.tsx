import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Maximize2, Minimize2, Smartphone, Shield, Radio } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  networkSsid: string;
  isDark?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isExpanded,
  onToggleExpand,
  networkSsid,
  isDark = true,
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isExpanded) {
    return (
      <div
        className={`w-full max-w-6xl h-[calc(100vh-5.5rem)] min-h-[640px] flex flex-col rounded-3xl border overflow-hidden shadow-2xl select-none mx-auto ring-1 transition-colors duration-200 ${
          isDark
            ? 'bg-[#111318] text-[#E2E8F0] border-[#262C38] ring-white/10 shadow-black/80'
            : 'bg-white text-slate-900 border-slate-300 ring-black/5 shadow-slate-300/60'
        }`}
      >
        {/* Top pro status bar */}
        <div
          className={`h-11 border-b px-4 sm:px-6 flex items-center justify-between text-xs shrink-0 transition-colors duration-200 ${
            isDark
              ? 'bg-[#1B1F28] border-[#262C38] text-[#94A3B8]'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4CC9F0] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4CC9F0]"></span>
            </span>
            <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentTime || '۱۲:۴۵'}</span>
            <span className={isDark ? 'text-[#334155]' : 'text-slate-300'}>|</span>
            <span className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Radio className="w-3.5 h-3.5 text-[#4CC9F0]" />
              {networkSsid}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                isDark
                  ? 'bg-[#4CC9F0]/10 text-[#4CC9F0] border-[#4CC9F0]/30'
                  : 'bg-sky-50 text-sky-700 border-sky-300'
              }`}
            >
              شبکه محلی مستقیم (۱۰۰٪ آفلاین)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border ${
                isDark
                  ? 'bg-[#111318] text-white/90 border-[#262C38]'
                  : 'bg-white text-slate-800 border-slate-200 shadow-sm'
              }`}
            >
              <Wifi className="w-3.5 h-3.5 text-[#70A5D8]" />
              <span className="font-mono text-[11px]">پینگ: ۱۲ms</span>
            </div>
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border ${
                isDark
                  ? 'bg-[#111318] text-white/90 border-[#262C38]'
                  : 'bg-white text-slate-800 border-slate-200 shadow-sm'
              }`}
            >
              <BatteryMedium className="w-4 h-4 text-[#4CC9F0]" />
              <span className="font-mono text-[11px]">۹۵٪</span>
            </div>
            <button
              onClick={onToggleExpand}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all shadow-sm ${
                isDark
                  ? 'bg-[#1B1F28] hover:bg-[#262C38] text-white border-[#262C38]'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
              title="تغییر به نمای فشرده موبایل"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#70A5D8]" />
              <span>نمای گوشی</span>
            </button>
          </div>
        </div>

        <div
          className={`flex-1 overflow-y-auto relative flex flex-col transition-colors duration-200 ${
            isDark ? 'bg-[#111318]' : 'bg-[#F8FAFC]'
          }`}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[460px] h-[calc(100vh-5.5rem)] min-h-[640px] max-h-[860px] flex flex-col mx-auto transition-all duration-300">
      {/* Outer Phone Shell - Deep Charcoal & Slate */}
      <div
        className={`w-full h-full rounded-[42px] sm:rounded-[46px] p-2.5 sm:p-3 shadow-2xl border-[2px] sm:border-[2.5px] relative flex flex-col overflow-hidden ring-1 transition-colors duration-200 ${
          isDark
            ? 'bg-[#0E1015] shadow-black border-[#262C38] ring-white/10'
            : 'bg-slate-200 shadow-slate-400/50 border-slate-300 ring-black/5'
        }`}
      >
        {/* Subtle Edge Ambient Glow */}
        <div className="absolute inset-0 rounded-[42px] pointer-events-none bg-gradient-to-b from-[#70A5D8]/5 via-transparent to-[#4CC9F0]/5" />

        {/* Screen Bezel */}
        <div
          className={`w-full h-full rounded-[34px] sm:rounded-[38px] overflow-hidden flex flex-col relative border transition-colors duration-200 ${
            isDark
              ? 'bg-[#111318] border-[#262C38]'
              : 'bg-[#F8FAFC] border-slate-200'
          }`}
        >
          {/* Dynamic Island / Status Bar */}
          <div
            className={`h-10 px-4 sm:px-5 flex items-center justify-between text-xs z-30 shrink-0 select-none border-b transition-colors duration-200 ${
              isDark
                ? 'bg-[#1B1F28] text-[#94A3B8] border-[#262C38]'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {/* Clock & Status */}
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentTime || '۱۲:۴۵'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4CC9F0]" />
            </div>

            {/* Dynamic Island Pill */}
            <div
              className={`h-5 px-3 rounded-full border flex items-center gap-2 shadow-inner ${
                isDark
                  ? 'bg-[#111318] border-[#262C38]'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#4CC9F0] animate-pulse" />
              <span className="text-[10px] text-[#4CC9F0] font-mono font-bold tracking-tight">LAN ACTIVE</span>
            </div>

            {/* Icons: Wi-Fi, Battery, and Toggle Expand */}
            <div className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-[#70A5D8]" />
              <div
                className={`flex items-center gap-0.5 font-mono text-[11px] ${
                  isDark ? 'text-[#E2E8F0]' : 'text-slate-700'
                }`}
              >
                <span>95%</span>
                <BatteryMedium className="w-3.5 h-3.5 text-[#4CC9F0]" />
              </div>
              <button
                onClick={onToggleExpand}
                className={`p-1 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-[#262C38] text-[#94A3B8] hover:text-white'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
                title="نمای بزرگ استودیویی"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#4CC9F0]" />
              </button>
            </div>
          </div>

          {/* App Body Content */}
          <div
            className={`flex-1 overflow-y-auto relative flex flex-col transition-colors duration-200 ${
              isDark ? 'bg-[#111318]' : 'bg-[#F8FAFC]'
            }`}
          >
            {children}
          </div>

          {/* Bottom Gestural Indicator Bar */}
          <div
            className={`h-4 flex items-center justify-center shrink-0 z-30 border-t ${
              isDark
                ? 'bg-[#1B1F28] border-[#262C38]'
                : 'bg-white border-slate-200'
            }`}
          >
            <div
              className={`w-28 h-1 rounded-full opacity-80 ${
                isDark ? 'bg-[#262C38]' : 'bg-slate-300'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
