import React from 'react';
import { motion } from 'motion/react';
import {
  Radio,
  Video,
  Wifi,
  Settings,
  QrCode,
  Compass,
  MessageSquare,
  ScreenShare,
  Network
} from 'lucide-react';
import { AppTab } from '../types';

interface TopSegmentedBarProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  peerCount: number;
  onOpenSettings: () => void;
  onOpenQR?: () => void;
  onOpenApkGuide?: () => void;
  onOpenArchitecture?: () => void;
  networkSsid: string;
  myRole: 'host' | 'client';
  isDark?: boolean;
}

const TABS: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: 'walkie', label: 'بیسیم PTT', icon: Radio, color: '#4CC9F0' },
  { id: 'cctv', label: 'دوربین مداربسته', icon: Video, color: '#70A5D8' },
  { id: 'radar', label: 'رادار شبکه', icon: Compass, color: '#4CC9F0' },
  { id: 'chat', label: 'چت و فایل', icon: MessageSquare, color: '#93C5FD' },
  { id: 'screen', label: 'تصویر زنده', icon: ScreenShare, color: '#818CF8' },
];

export const TopSegmentedBar: React.FC<TopSegmentedBarProps> = ({
  currentTab,
  onTabChange,
  peerCount,
  onOpenSettings,
  onOpenQR,
  onOpenArchitecture,
  networkSsid,
  myRole,
  isDark = true,
}) => {
  return (
    <div
      className={`w-full backdrop-blur-xl px-3 pt-3 pb-2.5 select-none shrink-0 border-b shadow-lg transition-colors duration-200 ${
        isDark
          ? 'bg-[#111318]/95 border-[#262C38]'
          : 'bg-white/95 border-slate-200'
      }`}
    >
      {/* Top System Network Status Row */}
      <div className="flex items-center justify-between mb-2.5 text-xs">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full border shadow-sm ${
              isDark
                ? 'bg-[#1B1F28] border-[#262C38]'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4CC9F0] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4CC9F0]"></span>
            </span>
            <Wifi className="w-3.5 h-3.5 text-[#4CC9F0]" />
            <span
              className={`font-semibold text-[11px] truncate max-w-[130px] ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {networkSsid}
            </span>
          </div>

          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              isDark
                ? 'bg-[#1B1F28] text-[#94A3B8] border-[#262C38]'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {myRole === 'host' ? '⚡ سازنده هات‌اسپات (Host)' : '🔗 متصل (Client)'}
          </span>
        </div>

        {/* Right side: QR, Architecture, Settings */}
        <div className="flex items-center gap-1.5">
          {onOpenQR && (
            <button
              onClick={onOpenQR}
              className={`w-7 h-7 rounded-full border flex items-center justify-center text-[#70A5D8] transition-all shadow-sm ${
                isDark
                  ? 'bg-[#1B1F28] hover:bg-[#262C38] border-[#262C38] hover:border-[#4CC9F0]/40'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-sky-600'
              }`}
              title="اتصال با بارکد QR"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenArchitecture && (
            <button
              onClick={onOpenArchitecture}
              className={`w-7 h-7 rounded-full border flex items-center justify-center text-[#818CF8] transition-all shadow-sm ${
                isDark
                  ? 'bg-[#1B1F28] hover:bg-[#262C38] border-[#262C38] hover:border-[#818CF8]/40'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-indigo-600'
              }`}
              title="مستندات و معماری سیستم"
            >
              <Network className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onTabChange('settings')}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all shadow-sm ${
              currentTab === 'settings'
                ? isDark
                  ? 'bg-[#4CC9F0]/20 border-[#4CC9F0] text-[#4CC9F0]'
                  : 'bg-sky-100 border-sky-400 text-sky-700'
                : isDark
                ? 'bg-[#1B1F28] hover:bg-[#262C38] border-[#262C38] text-[#94A3B8] hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
            }`}
            title="تنظیمات سیستم و تم"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Segmented Tab Navigation Capsule (5 Modules) */}
      <div
        className={`grid grid-cols-5 gap-1 p-1 rounded-2xl border relative shadow-inner ${
          isDark
            ? 'bg-[#111318] border-[#262C38]'
            : 'bg-slate-100 border-slate-200'
        }`}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 rounded-xl text-center transition-all duration-200 z-10 ${
                isActive
                  ? isDark
                    ? 'text-white'
                    : 'text-slate-900'
                  : isDark
                  ? 'text-[#94A3B8] hover:text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className={`absolute inset-0 rounded-xl border shadow-lg -z-10 ${
                    isDark
                      ? 'bg-gradient-to-b from-[#1B1F28] to-[#161922] border-[#262C38] shadow-black/60'
                      : 'bg-white border-slate-300 shadow-slate-200'
                  }`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={`w-4 h-4 mb-1 transition-all ${
                  isActive
                    ? 'text-[#4CC9F0] scale-110 drop-shadow-[0_0_8px_rgba(76,201,240,0.4)]'
                    : isDark
                    ? 'text-[#64748B]'
                    : 'text-slate-400'
                }`}
              />
              <span
                className={`text-[10px] leading-tight ${
                  isActive
                    ? isDark
                      ? 'font-bold text-white'
                      : 'font-bold text-slate-900'
                    : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

