import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Check,
  Volume2,
  Cpu,
  User,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Bell,
  Power
} from 'lucide-react';
import { ThemeMode, UserProfile } from '../types';
import { backgroundService } from '../utils/backgroundService';

interface SettingsScreenTabProps {
  profile: UserProfile;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenArchitecture?: () => void;
  isDark: boolean;
}

export const SettingsScreenTab: React.FC<SettingsScreenTabProps> = ({
  profile,
  currentTheme,
  onThemeChange,
  onUpdateProfile,
  isDark,
}) => {
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isBgEnabled, setIsBgEnabled] = useState(() => {
    return localStorage.getItem('netmaster_background_service_enabled') === 'true';
  });
  const [isRequestingBg, setIsRequestingBg] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'not_supported';
  });

  const handleToggleBg = async () => {
    if (isBgEnabled) {
      backgroundService.releaseBackgroundService();
      setIsBgEnabled(false);
    } else {
      setIsRequestingBg(true);
      try {
        const res = await backgroundService.requestBackgroundPermissions();
        setIsBgEnabled(true);
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setNotificationStatus(Notification.permission);
        }
      } catch (e) {
        console.warn('Background error:', e);
      } finally {
        setIsRequestingBg(false);
      }
    }
  };

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      onUpdateProfile({ username: usernameInput.trim() });
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 2000);
    }
  };

  const isHost = profile.role === 'host';

  return (
    <div
      className={`flex-1 overflow-y-auto p-4 select-none space-y-4 transition-colors duration-300 ${
        isDark ? 'bg-[#111318] text-[#E2E8F0]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
      dir="rtl"
    >
      {/* Top Header Card */}
      <div
        className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${
          isDark
            ? 'bg-[#1B1F28] border-[#262C38]'
            : 'bg-white border-[#E2E8F0]'
        }`}
      >
        <div>
          <h2 className="text-sm font-extrabold flex items-center gap-2">
            <span>تنظیمات سیستم (System Settings)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                isDark
                  ? 'bg-[#4CC9F0]/15 text-[#4CC9F0] border border-[#4CC9F0]/30'
                  : 'bg-sky-50 text-sky-700 border border-sky-300'
              }`}
            >
              Jetpack DataStore
            </span>
          </h2>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? 'text-[#94A3B8]' : 'text-slate-500'
            }`}
          >
            پیکربندی هویت دستگاه، وضعیت شبکه محلی، قالب ظاهری و پردازش صوت
          </p>
        </div>
      </div>

      {/* 1. Device Identity & Strictly READ-ONLY Network Role */}
      <div
        className={`p-4 rounded-2xl border shadow-sm space-y-4 ${
          isDark
            ? 'bg-[#1B1F28] border-[#262C38]'
            : 'bg-white border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-[#111318] text-[#4CC9F0]' : 'bg-sky-50 text-sky-600'
            }`}
          >
            <User className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold">هویت دستگاه و نقش شبکه</span>
        </div>

        {/* Editable Username Field */}
        <form onSubmit={handleSaveUsername} className="space-y-2">
          <label
            className={`block text-xs font-semibold ${
              isDark ? 'text-[#94A3B8]' : 'text-slate-600'
            }`}
          >
            نام کاربری شما (در شبکه محلی نمایش داده می‌شود):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="مثال: پارسا (فرمانده)"
              className={`flex-1 px-3 py-2 text-xs rounded-xl border transition-all focus:outline-none ${
                isDark
                  ? 'bg-[#111318] border-[#262C38] text-white focus:border-[#4CC9F0]'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#4CC9F0] text-[#111318] hover:bg-[#4CC9F0]/90 transition-colors shadow-sm cursor-pointer"
            >
              ذخیره
            </button>
          </div>
          {isSavedToast && (
            <div className="flex items-center gap-1.5 text-xs text-[#4CC9F0] font-semibold pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>نام کاربری با موفقیت در DataStore ذخیره شد.</span>
            </div>
          )}
        </form>

        {/* STRICTLY READ-ONLY Network Role Badge */}
        <div
          className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
            isDark
              ? 'bg-[#111318] border-[#262C38]'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-medium ${
                isDark ? 'text-[#94A3B8]' : 'text-slate-600'
              }`}
            >
              نقش فعال در شبکه:
            </span>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                isHost
                  ? isDark
                    ? 'bg-[#4CC9F0]/15 text-[#4CC9F0] border-[#4CC9F0]/30'
                    : 'bg-sky-100 text-sky-800 border-sky-300'
                  : isDark
                  ? 'bg-[#70A5D8]/15 text-[#70A5D8] border-[#70A5D8]/30'
                  : 'bg-blue-100 text-blue-800 border-blue-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isHost ? 'bg-[#4CC9F0]' : 'bg-[#70A5D8]'
                }`}
              />
              <span>
                {isHost
                  ? '⚡ سازنده هات‌اسپات (Host / Hotspot Creator)'
                  : '🔗 مهمان متصل (Guest / Connected Client)'}
              </span>
            </div>
          </div>
          <div
            className={`text-[11px] flex items-center gap-1 ${
              isDark ? 'text-[#94A3B8]' : 'text-slate-500'
            }`}
          >
            <Lock className="w-3 h-3 text-[#70A5D8]" />
            <span>
              این گزینه فقط‌خواندنی (Read-Only) است و بر اساس وضعیت واقعی شبکه Wi-Fi دستگاه تعیین می‌گردد.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Theming (Light, Dark, System) */}
      <div
        className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
          isDark
            ? 'bg-[#1B1F28] border-[#262C38]'
            : 'bg-white border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-[#111318] text-[#70A5D8]' : 'bg-sky-50 text-sky-600'
            }`}
          >
            <Sun className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold">قالب ظاهری و تم سیستم (Dynamic Theming)</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {/* Dark Mode Option */}
          <button
            onClick={() => onThemeChange('dark')}
            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              currentTheme === 'dark'
                ? 'bg-[#4CC9F0]/15 border-[#4CC9F0] text-white shadow-sm'
                : isDark
                ? 'bg-[#111318] border-[#262C38] text-[#94A3B8] hover:border-[#4CC9F0]/40'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Moon className="w-4 h-4 text-[#4CC9F0]" />
              {currentTheme === 'dark' && <Check className="w-3.5 h-3.5 text-[#4CC9F0]" />}
            </div>
            <span className="text-xs font-semibold">حالت تیره (Dark)</span>
            <span className="text-[10px] opacity-75">Deep Charcoal</span>
          </button>

          {/* Light Mode Option */}
          <button
            onClick={() => onThemeChange('light')}
            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              currentTheme === 'light'
                ? isDark
                  ? 'bg-[#70A5D8]/15 border-[#70A5D8] text-white shadow-sm'
                  : 'bg-sky-50 border-sky-500 text-sky-950 font-bold'
                : isDark
                ? 'bg-[#111318] border-[#262C38] text-[#94A3B8] hover:border-[#70A5D8]/40'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Sun className="w-4 h-4 text-[#70A5D8]" />
              {currentTheme === 'light' && <Check className="w-3.5 h-3.5 text-[#70A5D8]" />}
            </div>
            <span className="text-xs font-semibold">حالت روشن (Light)</span>
            <span className="text-[10px] opacity-75">Executive Light</span>
          </button>

          {/* System Default Option */}
          <button
            onClick={() => onThemeChange('system')}
            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              currentTheme === 'system'
                ? isDark
                  ? 'bg-[#818CF8]/15 border-[#818CF8] text-white shadow-sm'
                  : 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold'
                : isDark
                ? 'bg-[#111318] border-[#262C38] text-[#94A3B8] hover:border-[#70A5D8]/40'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Laptop className="w-4 h-4 text-[#818CF8]" />
              {currentTheme === 'system' && <Check className="w-3.5 h-3.5 text-[#818CF8]" />}
            </div>
            <span className="text-xs font-semibold">پیروی از سیستم</span>
            <span className="text-[10px] opacity-75">Auto Default</span>
          </button>
        </div>
      </div>

      {/* 3. Audio & Noise Suppressor (DSP) */}
      <div
        className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
          isDark
            ? 'bg-[#1B1F28] border-[#262C38]'
            : 'bg-white border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-[#111318] text-[#4CC9F0]' : 'bg-sky-50 text-sky-600'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">تنظیمات بیسیم و پردازش صوت (Audio DSP)</div>
            <div
              className={`text-[11px] ${
                isDark ? 'text-[#94A3B8]' : 'text-slate-500'
              }`}
            >
              فیلتر سخت‌افزاری نویز و شبیه‌سازی Roger Beep
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {/* Noise Suppressor Toggle */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl ${
              isDark ? 'bg-[#111318]' : 'bg-slate-50'
            }`}
          >
            <div>
              <div className="text-xs font-semibold">حذف نویز سخت‌افزاری (NoiseSuppressor)</div>
              <div
                className={`text-[10px] ${
                  isDark ? 'text-[#94A3B8]' : 'text-slate-500'
                }`}
              >
                استفاده از DSP داخلی گوشی جهت حذف صدای باد و همهمه محیطی
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateProfile({ noiseSuppression: !profile.noiseSuppression })
              }
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                profile.noiseSuppression
                  ? 'bg-[#4CC9F0]'
                  : isDark
                  ? 'bg-[#262C38]'
                  : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-[#111318] transition-transform ${
                  profile.noiseSuppression ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Accept CCTV */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl ${
              isDark ? 'bg-[#111318]' : 'bg-slate-50'
            }`}
          >
            <div>
              <div className="text-xs font-semibold">تأیید خودکار اتصال دوربین (CCTV Auto-Accept)</div>
              <div
                className={`text-[10px] ${
                  isDark ? 'text-[#94A3B8]' : 'text-slate-500'
                }`}
              >
                پذیرش اتصال مانیتورینگ بدون نیاز به لمس صفحه (مخصوص حالت استقرار ثابت)
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateProfile({ autoAcceptCctv: !profile.autoAcceptCctv })
              }
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                profile.autoAcceptCctv
                  ? 'bg-[#70A5D8]'
                  : isDark
                  ? 'bg-[#262C38]'
                  : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-[#111318] transition-transform ${
                  profile.autoAcceptCctv ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Background Reliability & WakeLock Info */}
      <div
        className={`p-4 rounded-2xl border shadow-sm space-y-2.5 ${
          isDark
            ? 'bg-[#1B1F28] border-[#262C38]'
            : 'bg-white border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-[#111318] text-[#70A5D8]' : 'bg-blue-50 text-blue-600'
            }`}
          >
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">تضمین پایداری در پس‌زمینه (Background & WakeLock)</div>
            <div
              className={`text-[11px] ${
                isDark ? 'text-[#94A3B8]' : 'text-slate-500'
              }`}
            >
              جلوگیری از قطع ارتباط و قطعی سوکت در زمان قفل شدن صفحه نمایش
            </div>
          </div>
        </div>

        <div
          className={`p-3 rounded-xl space-y-2 text-xs ${
            isDark ? 'bg-[#111318] text-[#CBD5E1]' : 'bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between py-1 border-b border-[#262C38]/40">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isBgEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="font-bold">وضعیت سرویس پس‌زمینه و مجوز بیداری (WakeLock):</span>
            </div>
            <button
              onClick={handleToggleBg}
              disabled={isRequestingBg}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isBgEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#4CC9F0] text-[#111318] hover:bg-[#4CC9F0]/90'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isBgEnabled ? 'سرویس فعال است (خاموش کردن)' : 'درخواست مجوز و فعال‌سازی'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[#4CC9F0] font-semibold text-[11px]">
            <Check className="w-3.5 h-3.5" />
            <span>مجوز اعلان‌ها (Notifications): {notificationStatus === 'granted' ? 'تأیید شده' : 'نیاز به درخواست'}</span>
          </div>
          <div className="flex items-center gap-2 text-[#70A5D8] font-semibold text-[11px]">
            <Check className="w-3.5 h-3.5" />
            <span>کسب خودکار Partial WakeLock جهت جلوگیری از Sleep پردازنده</span>
          </div>
          <div className="flex items-center gap-2 text-[#93C5FD] font-semibold text-[11px]">
            <Check className="w-3.5 h-3.5" />
            <span>سرویس صوتی پایدار (Keep-Alive Audio Oscillator) برای حفظ سوکت‌های PTT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
