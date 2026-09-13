import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Signal,
  Radio,
  Sparkles,
  Wifi,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Smartphone,
  CheckCircle2,
  Lock,
  Unlock,
  Sliders,
  Activity,
  BatteryMedium,
  Headphones,
  AlertCircle
} from 'lucide-react';
import { PeerDevice, UserProfile } from '../types';
import { playPttStartSound, playRogerBeep } from '../audio/walkieTalkieAudio';
import {
  checkSystemPermissions,
  requestMicrophonePermission,
  subscribePermissionChanges
} from '../utils/systemPermissions';

interface WalkieTalkieTabProps {
  peers: PeerDevice[];
  profile: UserProfile;
  activeSpeakerId: string | null;
  isDark?: boolean;
  onSetActiveSpeaker: (id: string | null) => void;
  onChannelChange?: (ch: number) => void;
  onAddCustomPeer?: (peer: PeerDevice) => void;
  onClearPeers?: () => void;
}

export const WalkieTalkieTab: React.FC<WalkieTalkieTabProps> = ({
  peers,
  profile,
  activeSpeakerId,
  isDark = true,
  onSetActiveSpeaker,
  onAddCustomPeer,
  onClearPeers,
}) => {
  const [isPttPressed, setIsPttPressed] = useState(false);
  const [isHandsFreeLocked, setIsHandsFreeLocked] = useState(false);
  const [micPermission, setMicPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [showDeviceManager, setShowDeviceManager] = useState(false);
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [customDeviceIp, setCustomDeviceIp] = useState('192.168.1.');
  const [noiseReduction, setNoiseReduction] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Request browser microphone for live waveform analysis & trigger Android RECORD_AUDIO runtime permission
  const requestRealMic = async (): Promise<boolean> => {
    try {
      const nativeReq = await requestMicrophonePermission();
      if (nativeReq.success || nativeReq.status === 'granted') {
        setMicPermission('granted');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: noiseReduction,
          autoGainControl: true,
        },
      });
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      setMicPermission('granted');

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setLiveVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
      return true;
    } catch (err) {
      console.warn('Microphone permission not granted or hardware unavailable', err);
      setMicPermission('denied');
      return false;
    }
  };

  useEffect(() => {
    // Check if mic permission is already granted so helper box disappears immediately
    checkSystemPermissions().then((status) => {
      if (status.microphone === 'granted') {
        setMicPermission('granted');
      }
    }).catch(() => {});

    const unsubscribe = subscribePermissionChanges((status) => {
      if (status.microphone === 'granted') {
        setMicPermission('granted');
      }
    });

    return () => {
      unsubscribe();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Handle PTT Press (Hold to talk)
  const handlePttDown = async () => {
    if (activeSpeakerId && activeSpeakerId !== 'me') {
      return;
    }

    // Trigger Android microphone runtime permission immediately on first press if not granted
    if (micPermission !== 'granted') {
      const granted = await requestRealMic();
      if (!granted) {
        return;
      }
    }

    setIsPttPressed(true);
    onSetActiveSpeaker('me');
    playPttStartSound();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
  };

  // Handle PTT Release
  const handlePttUp = () => {
    if (isHandsFreeLocked) return; // If locked, don't release on mouse up
    if (!isPttPressed) return;
    setIsPttPressed(false);
    onSetActiveSpeaker(null);
    playRogerBeep();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 40, 20]);
    }
  };

  // Toggle Hands-Free Lock mode (like Zello lock)
  const toggleHandsFreeLock = async () => {
    if (isHandsFreeLocked) {
      // Unlock and stop talking
      setIsHandsFreeLocked(false);
      setIsPttPressed(false);
      onSetActiveSpeaker(null);
      playRogerBeep();
    } else {
      if (micPermission !== 'granted') {
        const granted = await requestRealMic();
        if (!granted) return;
      }
      // Lock open mic
      setIsHandsFreeLocked(true);
      setIsPttPressed(true);
      onSetActiveSpeaker('me');
      playPttStartSound();
    }
  };

  // Simulate a peer transmission
  const simulatePeerSpeaking = (peer: PeerDevice) => {
    if (isPttPressed) return;
    if (activeSpeakerId === peer.id) {
      onSetActiveSpeaker(null);
      playRogerBeep();
    } else {
      onSetActiveSpeaker(peer.id);
      playPttStartSound();
    }
  };

  const handleAddNewDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDeviceName.trim()) return;
    if (onAddCustomPeer) {
      onAddCustomPeer({
        id: `custom-${Date.now()}`,
        name: customDeviceName.trim(),
        ip: customDeviceIp || `192.168.1.${Math.floor(Math.random() * 200 + 10)}`,
        port: 8080,
        battery: Math.floor(Math.random() * 40 + 60),
        rssi: -Math.floor(Math.random() * 30 + 35),
        isOnline: true,
        isTalking: false,
        role: 'client',
        cameraAvailable: true,
        isStreamingCamera: false,
        cameraFacing: 'back',
        torchActive: false,
        streamFps: 30,
        lastSeen: Date.now(),
      });
      setCustomDeviceName('');
      setShowDeviceManager(false);
    }
  };

  const currentSpeaker =
    activeSpeakerId === 'me'
      ? { name: profile.username + ' (شما)' }
      : peers.find((p) => p.id === activeSpeakerId);

  return (
    <div
      className={`flex-1 flex flex-col p-3 sm:p-3.5 relative select-none overflow-y-auto space-y-3 transition-colors duration-300 ${
        isDark ? 'bg-[#07090E] text-white' : 'bg-[#F8FAFC] text-slate-800'
      }`}
      dir="rtl"
      id="walkie-talkie-root"
    >
      {/* Background Ambient Glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 blur-[90px] pointer-events-none -z-10 ${
        isDark ? 'bg-[#00F59B]/10' : 'bg-[#00F59B]/5'
      }`} />

      {/* Top Section: Tactical HUD Header */}
      <div className="space-y-2.5 shrink-0">
        {/* Main Telemetry & Frequency HUD */}
        <div
          className={`rounded-2xl p-3 sm:p-3.5 transition-all duration-300 border relative overflow-hidden shadow-xl ${
            isPttPressed
              ? isDark
                ? 'bg-[#0E1524] border-[#00F59B] shadow-[#00F59B]/20 ring-1 ring-[#00F59B]/30'
                : 'bg-emerald-50 border-emerald-400 shadow-emerald-500/10 ring-1 ring-emerald-300'
              : activeSpeakerId
              ? isDark
                ? 'bg-[#0E1726] border-[#00D2FF] shadow-[#00D2FF]/20 ring-1 ring-[#00D2FF]/30'
                : 'bg-sky-50 border-sky-400 shadow-sky-500/10 ring-1 ring-sky-300'
              : isDark
              ? 'bg-[#0D111A]/95 border-[#1E2638]'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Subtle Top Accent Line */}
          <div
            className={`absolute top-0 left-0 right-0 h-[2px] ${
              isPttPressed
                ? 'bg-gradient-to-r from-transparent via-[#00F59B] to-transparent'
                : activeSpeakerId
                ? 'bg-gradient-to-r from-transparent via-[#00D2FF] to-transparent'
                : isDark
                ? 'bg-gradient-to-r from-transparent via-[#1E2638] to-transparent'
                : 'bg-gradient-to-r from-transparent via-slate-200 to-transparent'
            }`}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Status Glowing Pulse Ring */}
              <div className="relative flex items-center justify-center">
                {activeSpeakerId && (
                  <motion.div
                    className={`absolute -inset-2.5 rounded-full ${
                      isPttPressed ? 'bg-[#00F59B]/25' : 'bg-[#00D2FF]/25'
                    }`}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                  />
                )}
                <div
                  className={`w-4 h-4 rounded-full transition-all flex items-center justify-center ${
                    isPttPressed
                      ? 'bg-[#00F59B] shadow-md shadow-[#00F59B]'
                      : activeSpeakerId
                      ? 'bg-[#00D2FF] shadow-md shadow-[#00D2FF]'
                      : isDark
                      ? 'bg-[#2A364F]'
                      : 'bg-slate-300'
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-black/60" />
                </div>
              </div>

              <div>
                <div className="text-xs font-bold">
                  {isPttPressed ? (
                    <span className="text-[#059669] dark:text-[#00F59B] flex items-center gap-1.5 text-sm font-extrabold tracking-wide drop-shadow-[0_0_8px_rgba(0,245,155,0.4)]">
                      <span className="w-2 h-2 rounded-full bg-[#00F59B] animate-ping" />
                      در حال ارسال صوت (TRANSMITTING)...
                    </span>
                  ) : currentSpeaker ? (
                    <span className="text-[#0284C7] dark:text-[#00D2FF] font-extrabold text-sm flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(0,210,255,0.4)]">
                      <Volume2 className="w-4 h-4 text-[#00D2FF] animate-pulse" />
                      {currentSpeaker.name} در حال صحبت...
                    </span>
                  ) : (
                    <span className={`text-sm font-semibold flex items-center gap-1.5 ${isDark ? 'text-white/95' : 'text-slate-800'}`}>
                      <Activity className="w-3.5 h-3.5 text-[#00F59B]" />
                      فرکانس آزاد آماده ارتباط (STANDBY)
                    </span>
                  )}
                </div>

                <div className={`text-[11px] flex items-center gap-2 mt-1 font-mono ${isDark ? 'text-[#8B95A8]' : 'text-slate-500'}`}>
                  <span className="text-[#059669] dark:text-[#00F59B] font-semibold">OPUS HD 48kHz</span>
                  <span>•</span>
                  <span>تأخیر: ۱۶ms</span>
                  <span>•</span>
                  <span>شبکه مستقیم LAN</span>
                </div>
              </div>
            </div>

            {/* Live 12-Band Equalizer Sound Wave Visualizer */}
            <div className={`flex items-center gap-[3px] h-8 px-2.5 rounded-xl border shadow-inner ${
              isDark ? 'bg-[#06080D]/90 border-[#1E2638]' : 'bg-slate-100 border-slate-200'
            }`}>
              {[0.25, 0.6, 0.95, 0.45, 0.8, 1.0, 0.7, 0.4, 0.85, 0.5, 0.9, 0.3].map((height, i) => (
                <motion.div
                  key={i}
                  className={`w-1 rounded-full ${
                    isPttPressed
                      ? 'bg-gradient-to-t from-[#00F59B] to-[#00D2FF]'
                      : activeSpeakerId
                      ? 'bg-[#00D2FF]'
                      : isDark
                      ? 'bg-[#222E46]'
                      : 'bg-slate-300'
                  }`}
                  animate={{
                    height: activeSpeakerId
                      ? [4, Math.max(5, 26 * height), 4]
                      : 4,
                    opacity: activeSpeakerId ? 1 : 0.4,
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.3 + (i % 4) * 0.05,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mic Permission Helper - ONLY visible when permission is NOT granted */}
      {micPermission === 'idle' && (
        <div className={`p-2.5 border rounded-xl flex items-center justify-between text-[11px] shrink-0 transition-colors ${
          isDark
            ? 'bg-[#0D121F] border-[#1E2638] text-[#8B95A8]'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
        }`}>
          <span className="flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-[#00F59B]" />
            دسترسی به میکروفون برای ارسال صدا در بیسیم
          </span>
          <button
            onClick={() => requestRealMic()}
            className={`px-3 py-1 rounded-lg transition-all border font-bold cursor-pointer ${
              isDark
                ? 'bg-[#00F59B]/15 hover:bg-[#00F59B]/25 text-[#00F59B] border-[#00F59B]/30'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
            }`}
          >
            تأیید مجوز میکروفون
          </button>
        </div>
      )}

      {micPermission === 'denied' && (
        <div className="p-2.5 bg-red-950/40 border border-red-800/50 rounded-xl flex items-center justify-between text-[11px] shrink-0">
          <span className="text-red-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            مجوز میکروفون داده نشد. برای ارسال صدا در بیسیم، دسترسی لازم است.
          </span>
          <button
            onClick={() => requestRealMic()}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1 rounded-lg transition-all border border-red-500/30 font-bold shrink-0 cursor-pointer"
          >
            درخواست دوباره
          </button>
        </div>
      )}

      {/* Modern Tactical PTT Console Section */}
      <div className="flex flex-col items-center justify-center pt-1 pb-2 relative shrink-0">
        <div className="relative flex items-center justify-center my-2">
          {/* Animated Concentric Waves when PTT is pressed */}
          <AnimatePresence>
            {isPttPressed && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.75, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.3, ease: 'easeOut' }}
                  className="absolute w-36 h-36 rounded-full bg-[#00F59B]/30 -z-10 pointer-events-none"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: 1.45, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.3, delay: 0.4, ease: 'easeOut' }}
                  className="absolute w-36 h-36 rounded-full bg-[#00F59B]/40 -z-10 pointer-events-none"
                />
              </>
            )}
          </AnimatePresence>

          {/* Rotary Outer Tactical Ring with tick marks */}
          <div className={`absolute -inset-3 rounded-full border pointer-events-none opacity-60 flex items-center justify-center ${
            isDark ? 'border-[#222E46]' : 'border-slate-300'
          }`}>
            <div className="w-full h-full rounded-full border border-dashed border-[#00F59B]/20 animate-spin-slow" />
          </div>

          {/* Center Tactical PTT Disc */}
          <motion.button
            type="button"
            onPointerDown={handlePttDown}
            onPointerUp={handlePttUp}
            onPointerLeave={handlePttUp}
            onTouchStart={handlePttDown}
            onTouchEnd={handlePttUp}
            whileTap={{ scale: 0.94 }}
            className={`w-32 h-32 sm:w-34 sm:h-34 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-2xl relative select-none cursor-pointer ${
              isPttPressed
                ? 'bg-gradient-to-tr from-[#00F59B] via-[#00E5FF] to-[#00F59B] text-black shadow-[#00F59B]/60 ring-4 ring-[#00F59B]/50'
                : isDark
                ? 'bg-gradient-to-b from-[#161D2E] via-[#0D121F] to-[#070A10] text-white border-2 border-[#24314A] hover:border-[#00F59B]/60 shadow-black'
                : 'bg-gradient-to-b from-white via-slate-100 to-slate-200 text-slate-800 border-2 border-slate-300 hover:border-[#00F59B] shadow-xl'
            }`}
            id="ptt-main-button"
          >
            <div className="relative flex items-center justify-center">
              {isPttPressed ? (
                <Mic className="w-9 h-9 text-black animate-pulse stroke-[2.5]" />
              ) : (
                <Mic className="w-9 h-9 text-[#00F59B] drop-shadow-[0_0_10px_rgba(0,245,155,0.4)] stroke-[2.2]" />
              )}
            </div>

            <span
              className={`text-[12px] font-extrabold mt-1 tracking-tight ${
                isPttPressed ? 'text-black' : isDark ? 'text-white' : 'text-slate-800'
              }`}
            >
              {isPttPressed ? 'در حال ارسال صدا' : 'PTT لمس کنید'}
            </span>

            <span
              className={`text-[10px] font-medium font-mono ${
                isPttPressed ? 'text-black/80' : isDark ? 'text-[#8B95A8]' : 'text-slate-500'
              }`}
            >
              {isHandsFreeLocked ? 'مکالمه قفل است' : 'نگه‌دارید برای صحبت'}
            </span>
          </motion.button>

          {/* Hands-Free Lock Button */}
          <button
            onClick={toggleHandsFreeLock}
            className={`absolute -right-3.5 bottom-2 p-2.5 rounded-full border shadow-lg transition-all ${
              isHandsFreeLocked
                ? 'bg-[#00F59B] text-black border-[#00F59B] shadow-[#00F59B]/40 animate-pulse'
                : isDark
                ? 'bg-[#121826] hover:bg-[#1A2234] text-[#8B95A8] hover:text-white border-[#222E46]'
                : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-300 shadow-md'
            }`}
            title={isHandsFreeLocked ? 'غیرفعال‌سازی قفل میکروفون' : 'قفل میکروفون (صحبت مداوم بدون نگه‌داشتن دکمه)'}
          >
            {isHandsFreeLocked ? (
              <Lock className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className={`text-[11px] mt-1 text-center font-medium ${isDark ? 'text-[#8B95A8]' : 'text-slate-500'}`}>
          {isPttPressed
            ? 'صدای شما به صورت زنده و بدون تاخیر در شبکه پخش می‌شود'
            : 'برای مکالمه لحظه‌ای، دکمه PTT را نگه‌دارید یا آیکون قفل را لمس کنید'}
        </div>
      </div>

      {/* Network Explanation & Device Management Pill */}
      <div className={`space-y-2 shrink-0 pt-2 border-t ${isDark ? 'border-[#1E2638]' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5 text-[#8B95A8]">
            <Users className="w-3.5 h-3.5 text-[#00F59B]" />
            <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>شنوندگان حاضر در شبکه</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border font-bold ${
              isDark ? 'bg-[#141A26] text-[#00F59B] border-[#1E2638]' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {peers.length + 1}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setNoiseReduction(!noiseReduction)}
              className={`text-[10px] px-2 py-0.5 rounded-lg transition-all border flex items-center gap-1 font-medium ${
                noiseReduction
                  ? 'bg-[#00F59B]/10 text-[#00F59B] border-[#00F59B]/30'
                  : isDark
                  ? 'bg-[#141A26] text-[#8B95A8] border-[#1E2638]'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="کاهش نویز هوشمند میکروفون"
            >
              <Sliders className="w-3 h-3" />
              <span>حذف نویز</span>
            </button>

            <button
              onClick={() => setShowDeviceManager(!showDeviceManager)}
              className={`text-[10px] px-2 py-0.5 rounded-lg transition-all border flex items-center gap-1 font-medium ${
                isDark
                  ? 'bg-[#141A26] hover:bg-[#1E2638] text-white border-[#1E2638]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
              title="توضیحات دستگاه‌های واقعی"
            >
              <Smartphone className="w-3 h-3 text-[#00D2FF]" />
              <span>دستگاه‌های واقعی؟</span>
            </button>
          </div>
        </div>

        {/* Informational Banner */}
        <AnimatePresence>
          {showDeviceManager && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-xl p-2.5 text-xs space-y-2 overflow-hidden shadow-lg border ${
                isDark
                  ? 'bg-[#0E1422] border-[#00F59B]/30'
                  : 'bg-white border-slate-200 shadow-md'
              }`}
            >
              <div className={`flex items-start gap-2 leading-relaxed text-[11px] ${isDark ? 'text-[#CBD5E1]' : 'text-slate-700'}`}>
                <ShieldCheck className="w-3.5 h-3.5 text-[#00F59B] shrink-0 mt-0.5" />
                <div>
                  <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>نحوه اتصال گوشی‌های واقعی: </strong>
                  در <strong className="text-[#00F59B]">نسخه اصلی نصبی APK</strong>، تمام گوشی‌هایی که به یک مودم یا هات‌اسپات وصل شوند، به صورت خودکار شناسایی می‌شوند.
                </div>
              </div>

              {onClearPeers && peers.length > 0 && (
                <div className={`flex items-center gap-2 pt-1 border-t ${isDark ? 'border-[#1E2638]' : 'border-slate-200'}`}>
                  <button
                    onClick={onClearPeers}
                    className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>پاک کردن لیست دستگاه‌ها</span>
                  </button>
                </div>
              )}

              {/* Add Custom Device Form */}
              <form onSubmit={handleAddNewDevice} className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="نام گوشی دیگر (مثلاً: همراه ۲)"
                  value={customDeviceName}
                  onChange={(e) => setCustomDeviceName(e.target.value)}
                  className={`flex-1 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:border-[#00F59B] border ${
                    isDark
                      ? 'bg-[#07090E] border-[#1E2638] text-white placeholder-[#626E86]'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
                <button
                  type="submit"
                  className="bg-[#00F59B] hover:bg-[#00D687] text-black font-extrabold text-[11px] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  <span>افزودن</span>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connected Devices / Listeners List */}
      <div className="space-y-1.5 shrink-0">
        {/* Current Device (You) */}
        <div className={`rounded-xl p-2 flex items-center justify-between shadow-sm border ${
          isDark ? 'bg-[#0F1424]/90 border-[#1E2638]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="relative">
              {isPttPressed && (
                <div className="absolute -inset-1 rounded-xl bg-[#00F59B]/40 animate-ping" />
              )}
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#00F59B]/20 to-[#00D2FF]/20 border border-[#00F59B]/40 flex items-center justify-center text-[#00F59B] font-extrabold text-[11px] shadow-inner">
                {profile.username.slice(0, 1)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {profile.username} (گوشی شما)
                </span>
                <span className="text-[9px] bg-[#00F59B]/15 text-[#00F59B] px-1.5 py-0.2 rounded-full font-bold border border-[#00F59B]/30">
                  {profile.role === 'host' ? '⚡ میزبان' : '🔗 کلاینت'}
                </span>
              </div>
              <div className={`text-[10px] font-mono mt-0.2 flex items-center gap-1.5 ${isDark ? 'text-[#8B95A8]' : 'text-slate-500'}`}>
                <span>{profile.localIp}</span>
                <span>•</span>
                <span className="text-[#00F59B] flex items-center gap-0.5">
                  <Signal className="w-2.5 h-2.5" />
                  سیگنال عالی
                </span>
              </div>
            </div>
          </div>

          <div>
            {isPttPressed ? (
              <span className="text-[10px] text-black font-extrabold flex items-center gap-1 bg-[#00F59B] px-2 py-0.5 rounded-full shadow-md shadow-[#00F59B]/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                در حال ارسال
              </span>
            ) : (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${
                isDark ? 'text-[#8B95A8] bg-[#141A26] border-[#1E2638]' : 'text-slate-500 bg-slate-100 border-slate-200'
              }`}>
                آماده‌باش
              </span>
            )}
          </div>
        </div>

        {/* Other Devices (Compact Listeners) */}
        {peers.length === 0 ? (
          <div className={`py-5 text-center text-xs border border-dashed rounded-xl space-y-1 ${
            isDark ? 'text-[#8B95A8] border-[#1E2638] bg-[#0D111A]/40' : 'text-slate-500 border-slate-300 bg-slate-50'
          }`}>
            <Radio className="w-4 h-4 mx-auto text-[#00F59B] opacity-60 animate-pulse" />
            <div className="text-[11px]">در حال انتظار برای اتصال شنوندگان دیگر به شبکه...</div>
          </div>
        ) : (
          peers.map((peer) => {
            const isPeerTalking = activeSpeakerId === peer.id;
            return (
              <motion.div
                key={peer.id}
                onClick={() => simulatePeerSpeaking(peer)}
                whileTap={{ scale: 0.98 }}
                className={`rounded-xl p-2 border transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                  isPeerTalking
                    ? 'bg-[#0E1726] border-[#00D2FF] shadow-md shadow-[#00D2FF]/20 ring-1 ring-[#00D2FF]/40'
                    : isDark
                    ? 'bg-[#0D121F]/80 border-[#1E2638] hover:border-[#2F3E61] hover:bg-[#121828]'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    {isPeerTalking && (
                      <motion.div
                        className="absolute -inset-1 rounded-xl bg-[#00D2FF]/40"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                    )}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] transition-colors shadow-inner ${
                        isPeerTalking
                          ? 'bg-[#00D2FF] text-black shadow-md shadow-[#00D2FF]/40'
                          : isDark
                          ? 'bg-[#182032] text-white border border-[#26334D]'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {peer.name.slice(0, 1)}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {peer.name}
                      </span>
                      {peer.role === 'host' && (
                        <span className="text-[9px] bg-[#3B82F6]/20 text-[#3B82F6] px-1 py-0.2 rounded font-bold">
                          Host
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] font-mono mt-0.2 flex items-center gap-1.5 ${isDark ? 'text-[#8B95A8]' : 'text-slate-500'}`}>
                      <span>{peer.ip}</span>
                      <span>•</span>
                      <span className="text-[#00F59B] flex items-center gap-0.5">
                        <BatteryMedium className="w-2.5 h-2.5" />
                        {peer.battery}٪
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {isPeerTalking ? (
                    <div className="flex items-center gap-1 bg-[#00D2FF]/15 text-[#00D2FF] px-2 py-0.5 rounded-full border border-[#00D2FF]/30 text-[10px] font-bold">
                      <span className="animate-pulse">در حال پخش صدا</span>
                      <Volume2 className="w-3 h-3 animate-bounce" />
                    </div>
                  ) : (
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${
                      isDark ? 'text-[#8B95A8] bg-[#141A26] border-[#1E2638]' : 'text-slate-500 bg-slate-100 border-slate-200'
                    }`}>
                      شنونده
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
