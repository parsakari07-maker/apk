import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Radio, Wifi, Server, Check, ArrowRight, Shield } from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  profile,
  onSaveProfile,
  onClose
}) => {
  const [username, setUsername] = useState(profile.username);
  const [role, setRole] = useState<'host' | 'client'>(profile.role);
  const [networkSsid, setNetworkSsid] = useState(profile.networkSsid);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onSaveProfile({
      ...profile,
      username: username.trim(),
      role,
      networkSsid: networkSsid.trim() || 'کارگاه مرکزی (Wi-Fi Local)',
      localIp: role === 'host' ? '192.168.1.1' : '192.168.1.104',
    });
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-[#1E1E24] border border-[#2A2A35] rounded-3xl p-6 shadow-2xl text-white select-none relative"
      >
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00E676]/20 to-[#3A86FF]/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <Radio className="w-6 h-6 text-[#00E676]" />
        </div>

        <h2 className="text-xl font-bold text-center text-white">
          تنظیم هویت و شبکه محلی
        </h2>
        <p className="text-xs text-[#A0A0AB] text-center mt-1 mb-6">
          ارتباط آفلاین بی‌سیم و دوربین مداربسته بدون نیاز به اینترنت (Wi-Fi / Hotspot)
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5">
              نام یا شناسه مستعار شما (Nickname)
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثلاً: پارسا"
                maxLength={20}
                required
                className="w-full bg-[#121214] border border-[#3A3A4A] focus:border-[#00E676] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
              />
              <div className="absolute left-3 top-3 text-[#A0A0AB]">
                <User className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[11px] text-[#71717A] mt-1 block">
              در اندروید در دیتابیس محلی DataStore Preferences ذخیره می‌شود.
            </span>
          </div>

          {/* Network Role: Host vs Join */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5">
              نقش در شبکه محلی (Lobby Discovery)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Host Option */}
              <button
                type="button"
                onClick={() => setRole('host')}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1.5 ${
                  role === 'host'
                    ? 'bg-[#00E676]/10 border-[#00E676] text-white shadow-lg shadow-[#00E676]/10'
                    : 'bg-[#121214] border-[#2A2A35] text-[#A0A0AB] hover:border-[#3A3A4A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Server className={`w-4 h-4 ${role === 'host' ? 'text-[#00E676]' : 'text-[#71717A]'}`} />
                  {role === 'host' && <Check className="w-3.5 h-3.5 text-[#00E676]" />}
                </div>
                <div className="text-xs font-bold text-white">ایجاد شبکه (Host)</div>
                <div className="text-[10px] text-[#A0A0AB]">
                  هات‌اسپات محلی یا روتر
                </div>
              </button>

              {/* Client Join Option */}
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1.5 ${
                  role === 'client'
                    ? 'bg-[#3A86FF]/10 border-[#3A86FF] text-white shadow-lg shadow-[#3A86FF]/10'
                    : 'bg-[#121214] border-[#2A2A35] text-[#A0A0AB] hover:border-[#3A3A4A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Wifi className={`w-4 h-4 ${role === 'client' ? 'text-[#3A86FF]' : 'text-[#71717A]'}`} />
                  {role === 'client' && <Check className="w-3.5 h-3.5 text-[#3A86FF]" />}
                </div>
                <div className="text-xs font-bold text-white">اتصال به شبکه (Join)</div>
                <div className="text-[10px] text-[#A0A0AB]">
                  کشف خودکار با NsdManager
                </div>
              </button>
            </div>
          </div>

          {/* Wi-Fi SSID Name */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5">
              نام شبکه وای‌فای یا هات‌اسپات (SSID)
            </label>
            <input
              type="text"
              value={networkSsid}
              onChange={(e) => setNetworkSsid(e.target.value)}
              className="w-full bg-[#121214] border border-[#3A3A4A] focus:border-[#3A86FF] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#00E676] to-[#00C853] hover:from-[#00C853] hover:to-[#00B0FF] text-black font-bold text-sm py-3 px-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>ورود به برنامه و شروع ارتباط</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="bg-[#2A2A35] hover:bg-[#3A3A4A] text-[#A0A0AB] text-sm py-3 px-4 rounded-2xl transition-colors"
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
