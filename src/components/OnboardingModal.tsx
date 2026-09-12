import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Radio, Wifi, Server, Check, ArrowRight, Shield, Cpu, Bell, BatteryCharging, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile, enableBgService?: boolean) => void;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  profile,
  onSaveProfile,
  onClose,
  canDismiss = false,
}) => {
  const [username, setUsername] = useState(profile.username || '');
  const [role, setRole] = useState<'host' | 'client'>(profile.role || 'client');
  const [networkSsid, setNetworkSsid] = useState(profile.networkSsid || '');
  const [enableBgService, setEnableBgService] = useState(true);
  const [errorText, setErrorText] = useState('');

  if (!isOpen) return null;

  const isNameValid = username.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid) {
      setErrorText('لطفاً نام یا شناسه مستعار خود را وارد کنید (حداقل ۲ کاراکتر)');
      return;
    }
    setErrorText('');
    onSaveProfile(
      {
        ...profile,
        username: username.trim(),
        role,
        networkSsid: networkSsid.trim() || 'شبکه محلی (Wi-Fi Local)',
        localIp: role === 'host' ? '192.168.1.1' : '192.168.1.104',
      },
      enableBgService
    );
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-[#1E1E24] border border-[#2A2A35] rounded-3xl p-6 shadow-2xl text-white select-none relative my-auto"
      >
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00E676]/20 to-[#3A86FF]/20 border border-white/10 flex items-center justify-center mx-auto mb-3">
          <Radio className="w-6 h-6 text-[#00E676]" />
        </div>

        <h2 className="text-xl font-bold text-center text-white">
          تنظیم هویت و دسترسی‌های اولیه
        </h2>
        <p className="text-xs text-[#A0A0AB] text-center mt-1 mb-4">
          جهت اتصال به شبکه محلی، نام کاربری و مجوز فعالیت پایدار را مشخص فرمایید
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5">
              نام یا شناسه مستعار دستگاه شما <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorText) setErrorText('');
                }}
                placeholder="نام خود را وارد کنید..."
                maxLength={24}
                autoFocus
                required
                className="w-full bg-[#121214] border border-[#3A3A4A] focus:border-[#00E676] rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
              />
              <div className="absolute left-3 top-3 text-[#A0A0AB]">
                <User className="w-4 h-4" />
              </div>
            </div>
            {errorText ? (
              <span className="text-[11px] text-red-400 mt-1 block font-medium">
                {errorText}
              </span>
            ) : (
              <span className="text-[10px] text-[#71717A] mt-1 block">
                این شناسه به عنوان نام دستگاه شما در بیسیم و دوربین برای دیگران نمایش داده می‌شود.
              </span>
            )}
          </div>

          {/* Background Execution & Notifications Permission Card */}
          <div
            onClick={() => setEnableBgService((prev) => !prev)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer select-none ${
              enableBgService
                ? 'bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                : 'bg-[#141822] border-[#2A3346] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    enableBgService
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      فعال‌سازی مجوز فعالیت در پس‌زمینه
                    </span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      پیشنهادی
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                    جلوگیری از قطع مکالمه بیسیم (PTT)، حفظ تماس‌های صوتی و اعلان‌ها هنگام خاموش شدن صفحه یا جابجایی بین برنامه‌ها (WakeLock).
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  enableBgService
                    ? 'bg-emerald-500 border-emerald-400 text-black'
                    : 'border-slate-600 bg-slate-800'
                }`}
              >
                {enableBgService && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Network Role: Host vs Join */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5">
              نقش در شبکه محلی
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Host Option */}
              <button
                type="button"
                onClick={() => setRole('host')}
                className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                  role === 'host'
                    ? 'bg-[#00E676]/10 border-[#00E676] text-white shadow-lg shadow-[#00E676]/10'
                    : 'bg-[#121214] border-[#2A2A35] text-[#A0A0AB] hover:border-[#3A3A4A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Server className={`w-4 h-4 ${role === 'host' ? 'text-[#00E676]' : 'text-[#71717A]'}`} />
                  {role === 'host' && <Check className="w-3.5 h-3.5 text-[#00E676]" />}
                </div>
                <div className="text-xs font-bold text-white">ایجاد شبکه (میزبان)</div>
                <div className="text-[10px] text-[#A0A0AB]">
                  هات‌اسپات محلی یا روتر
                </div>
              </button>

              {/* Client Join Option */}
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                  role === 'client'
                    ? 'bg-[#3A86FF]/10 border-[#3A86FF] text-white shadow-lg shadow-[#3A86FF]/10'
                    : 'bg-[#121214] border-[#2A2A35] text-[#A0A0AB] hover:border-[#3A3A4A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Wifi className={`w-4 h-4 ${role === 'client' ? 'text-[#3A86FF]' : 'text-[#71717A]'}`} />
                  {role === 'client' && <Check className="w-3.5 h-3.5 text-[#3A86FF]" />}
                </div>
                <div className="text-xs font-bold text-white">اتصال به شبکه (عضو)</div>
                <div className="text-[10px] text-[#A0A0AB]">
                  کشف خودکار دیگران
                </div>
              </button>
            </div>
          </div>

          {/* Wi-Fi SSID Name */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1">
              نام شبکه وای‌فای یا هات‌اسپات (SSID)
            </label>
            <input
              type="text"
              value={networkSsid}
              placeholder="مثلاً: Wi-Fi Local"
              onChange={(e) => setNetworkSsid(e.target.value)}
              className="w-full bg-[#121214] border border-[#3A3A4A] focus:border-[#3A86FF] rounded-2xl px-4 py-2 text-xs text-white focus:outline-none transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={!isNameValid}
              className={`flex-1 font-bold text-sm py-3 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                isNameValid
                  ? 'bg-gradient-to-r from-[#00E676] to-[#00C853] hover:from-[#00C853] hover:to-[#00B0FF] text-black cursor-pointer active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
              }`}
            >
              <span>تأیید و ورود به برنامه</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            {canDismiss && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="bg-[#2A2A35] hover:bg-[#3A3A4A] text-[#A0A0AB] text-sm py-3 px-4 rounded-2xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};
