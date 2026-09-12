import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Radio,
  Check,
  ArrowRight,
  Cpu,
  Mic,
  Camera,
  Bell,
  Sparkles,
  ShieldCheck,
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types';
import { detectLocalNetworkAndRole } from '../utils/networkDetector';
import {
  checkSystemPermissions,
  requestMicrophonePermission,
  requestCameraPermission,
  requestNotificationPermission,
  requestBackgroundPermission,
  DevicePermissionStatus
} from '../utils/systemPermissions';

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
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Permission States
  const [micStatus, setMicStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [cameraStatus, setCameraStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [bgStatus, setBgStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [requestingMic, setRequestingMic] = useState(false);
  const [requestingCamera, setRequestingCamera] = useState(false);
  const [requestingBg, setRequestingBg] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  // Automatic Network Role & IP Detection State (Auto handled in background, NOT chosen manually)
  const [detectedRole, setDetectedRole] = useState<'host' | 'client'>(profile.role || 'client');
  const [detectedIp, setDetectedIp] = useState<string>(profile.localIp || '192.168.1.104');
  const [detectedSsid, setDetectedSsid] = useState<string>(profile.networkSsid || 'شبکه محلی (Wi-Fi Local)');

  // Refresh hardware permissions status
  const refreshStatus = async () => {
    try {
      const status: DevicePermissionStatus = await checkSystemPermissions();
      setMicStatus(status.microphone);
      setCameraStatus(status.camera);
      if (status.notification === 'granted' || status.wakeLock) {
        setBgStatus('granted');
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshStatus();

    // Auto-detect role and IP silently
    detectLocalNetworkAndRole().then((info) => {
      setDetectedRole(info.role);
      setDetectedIp(info.localIp);
      setDetectedSsid(info.networkSsid);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const isNameValid = username.trim().length >= 2;

  // Direct 1-tap real microphone prompt
  const handleRequestMic = async () => {
    setRequestingMic(true);
    setPermissionNotice(null);
    try {
      const res = await requestMicrophonePermission();
      if (res.success) {
        setMicStatus('granted');
        setPermissionNotice('مجوز میکروفون با موفقیت توسط گوشی صادر شد.');
      } else {
        setMicStatus('denied');
        setPermissionNotice(res.error || 'دسترسی میکروفون رد شد.');
      }
    } catch (e: any) {
      setMicStatus('denied');
      setPermissionNotice(e?.message || 'خطا در صدور مجوز میکروفون');
    } finally {
      setRequestingMic(false);
    }
  };

  // Direct 1-tap real camera prompt
  const handleRequestCamera = async () => {
    setRequestingCamera(true);
    setPermissionNotice(null);
    try {
      const res = await requestCameraPermission();
      if (res.success) {
        setCameraStatus('granted');
        setPermissionNotice('مجوز دوربین با موفقیت توسط گوشی صادر شد.');
      } else {
        setCameraStatus('denied');
        setPermissionNotice(res.error || 'دسترسی دوربین رد شد.');
      }
    } catch (e: any) {
      setCameraStatus('denied');
      setPermissionNotice(e?.message || 'خطا در صدور مجوز دوربین');
    } finally {
      setRequestingCamera(false);
    }
  };

  // Direct 1-tap real background & notifications prompt
  const handleRequestBg = async () => {
    setRequestingBg(true);
    setPermissionNotice(null);
    try {
      const bgRes = await requestBackgroundPermission();
      if (bgRes.notificationGranted || bgRes.wakeLockAcquired) {
        setBgStatus('granted');
        setPermissionNotice('سرویس پس‌زمینه و حالت بیداری پردازنده (WakeLock) فعال شد.');
      } else {
        setBgStatus('denied');
      }
    } catch (e: any) {
      setBgStatus('denied');
      setPermissionNotice(e?.message || 'خطا در فعال‌سازی سرویس پس‌زمینه');
    } finally {
      setRequestingBg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid) {
      setErrorText('لطفاً نام یا شناسه مستعار خود را وارد کنید (حداقل ۲ کاراکتر)');
      return;
    }
    setErrorText('');
    setIsSubmitting(true);

    // If permissions not yet granted, trigger prompts
    if (micStatus !== 'granted') {
      try {
        await requestMicrophonePermission();
      } catch {
        // Continue
      }
    }

    if (cameraStatus !== 'granted') {
      try {
        await requestCameraPermission();
      } catch {
        // Continue
      }
    }

    try {
      await requestBackgroundPermission();
    } catch {
      // Continue
    }

    // Save profile with automatically detected network role and IP
    onSaveProfile(
      {
        ...profile,
        username: username.trim(),
        role: detectedRole,
        networkSsid: detectedSsid,
        localIp: detectedIp,
      },
      true
    );

    setIsSubmitting(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-[#161922] border border-[#262C38] rounded-3xl p-6 shadow-2xl text-white select-none relative my-auto"
        dir="rtl"
      >
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00F59B]/20 to-[#4CC9F0]/20 border border-[#00F59B]/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#00F59B]/10">
          <Radio className="w-6 h-6 text-[#00F59B]" />
        </div>

        <h2 className="text-lg font-black text-center text-white">
          تنظیم هویت و دسترسی‌های گوشی
        </h2>
        <p className="text-xs text-[#94A3B8] text-center mt-1 mb-4">
          نام کاربری را وارد کنید و مجوزهای سخت‌افزاری را فعال نمایید
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
              نام یا شناسه شما در شبکه <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorText) setErrorText('');
                }}
                placeholder="مثلاً: ایستگاه ۱، فرمانده..."
                maxLength={24}
                autoFocus
                required
                className="w-full bg-[#0D1017] border border-[#2E384D] focus:border-[#00F59B] rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              <div className="absolute left-3 top-3 text-[#94A3B8]">
                <User className="w-4 h-4" />
              </div>
            </div>
            {errorText ? (
              <span className="text-[11px] text-red-400 mt-1 block font-medium">
                {errorText}
              </span>
            ) : null}
          </div>

          {/* Real Permission Request Action Cards */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#CBD5E1]">
                مجوزهای سخت‌افزاری مورد نیاز:
              </label>
              <span className="text-[10px] text-[#00F59B] font-mono font-bold">
                درخواست مستقیم از سیستم‌عامل
              </span>
            </div>

            {/* 1. Direct Microphone Permission Prompt Button */}
            <div
              className={`p-3 rounded-2xl border transition-all ${
                micStatus === 'granted'
                  ? 'bg-emerald-950/30 border-emerald-500/50'
                  : micStatus === 'denied'
                  ? 'bg-red-950/20 border-red-500/30'
                  : 'bg-[#0E131E] border-[#222B3D]'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      micStatus === 'granted'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>مجوز میکروفون (بیسیم صوتی)</span>
                      {micStatus === 'granted' ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                          تأیید شد
                        </span>
                      ) : (
                        <span className="text-[9px] bg-[#00F59B]/20 text-[#00F59B] px-1.5 py-0.2 rounded font-mono">
                          ضروری
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      ارسال صوت بیسیم PTT در شبکه محلی
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestMic}
                  disabled={requestingMic || micStatus === 'granted'}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    micStatus === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                      : 'bg-[#00F59B] text-[#0A0D14] hover:bg-[#00F59B]/90 shadow-sm'
                  }`}
                >
                  {requestingMic ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : micStatus === 'granted' ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>درخواست دسترسی</span>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Direct Camera Permission Prompt Button */}
            <div
              className={`p-3 rounded-2xl border transition-all ${
                cameraStatus === 'granted'
                  ? 'bg-emerald-950/30 border-emerald-500/50'
                  : cameraStatus === 'denied'
                  ? 'bg-red-950/20 border-red-500/30'
                  : 'bg-[#0E131E] border-[#222B3D]'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      cameraStatus === 'granted'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>مجوز دوربین (CCTV و استریم)</span>
                      {cameraStatus === 'granted' ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                          تأیید شد
                        </span>
                      ) : (
                        <span className="text-[9px] bg-[#4CC9F0]/20 text-[#4CC9F0] px-1.5 py-0.2 rounded font-mono">
                          مداربسته
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      اشتراک تصویر زنده دوربین و مانیتورینگ امنیتی
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestCamera}
                  disabled={requestingCamera || cameraStatus === 'granted'}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    cameraStatus === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                      : 'bg-[#4CC9F0] text-[#0A0D14] hover:bg-[#4CC9F0]/90 shadow-sm'
                  }`}
                >
                  {requestingCamera ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : cameraStatus === 'granted' ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>درخواست دسترسی</span>
                  )}
                </button>
              </div>
            </div>

            {/* 3. Direct Background Execution & WakeLock Button */}
            <div
              className={`p-3 rounded-2xl border transition-all ${
                bgStatus === 'granted'
                  ? 'bg-sky-950/30 border-sky-500/50'
                  : 'bg-[#0E131E] border-[#222B3D]'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      bgStatus === 'granted'
                        ? 'bg-sky-500/20 text-[#4CC9F0] border border-sky-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>سرویس پس‌زمینه و اعلان (WakeLock)</span>
                      {bgStatus === 'granted' && (
                        <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-mono font-bold">
                          فعال
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      جلوگیری از قطع ارتباط سوکت‌ها هنگام خاموشی صفحه
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestBg}
                  disabled={requestingBg || bgStatus === 'granted'}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    bgStatus === 'granted'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 cursor-default'
                      : 'bg-[#2E384D] hover:bg-[#3D4B66] text-white'
                  }`}
                >
                  {requestingBg ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : bgStatus === 'granted' ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>فعال‌سازی</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Feedback message if any */}
          {permissionNotice && (
            <div className="p-2.5 rounded-xl bg-[#0E131E] border border-[#2E384D] text-[11px] text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#00F59B] shrink-0" />
              <span>{permissionNotice}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={!isNameValid || isSubmitting}
              className={`flex-1 font-extrabold text-xs sm:text-sm py-3 px-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${
                isNameValid && !isSubmitting
                  ? 'bg-[#00F59B] text-[#0A0D14] hover:bg-[#00F59B]/90 shadow-[#00F59B]/25 cursor-pointer active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال فعال‌سازی دسترسی‌ها...</span>
                </>
              ) : (
                <>
                  <span>تأیید و ورود به برنامه</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
            {canDismiss && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="bg-[#262C38] hover:bg-[#343D4E] text-[#94A3B8] text-xs sm:text-sm py-3 px-4 rounded-2xl transition-colors cursor-pointer"
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
