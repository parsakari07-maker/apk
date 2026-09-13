import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Radio,
  Wifi,
  Volume2,
  Lock,
  Unlock,
  AlertCircle,
  BatteryMedium,
  CheckCircle2,
  Activity,
  Sliders,
  Smartphone,
  ShieldCheck,
  Signal,
  Trash2,
  Plus
} from 'lucide-react';
import { PeerDevice, UserProfile } from '../types';
import { playPttStartSound, playRogerBeep } from '../audio/walkieTalkieAudio';
import {
  checkSystemPermissions,
  requestMicrophonePermission,
  subscribePermissionChanges,
} from '../utils/systemPermissions';
import { meshManager } from '../utils/meshManager';

interface WalkieTalkieTabProps {
  peers: PeerDevice[];
  profile: UserProfile;
  activeSpeakerId: string | null;
  isDark?: boolean;
  onSetActiveSpeaker: (id: string | null) => void;
  onAddCustomPeer?: (peer: PeerDevice) => void;
  onClearPeers?: () => void;
}

export const WalkieTalkieTab: React.FC<WalkieTalkieTabProps> = ({
  peers,
  profile,
  activeSpeakerId,
  isDark = true,
  onSetActiveSpeaker,
  onClearPeers,
}) => {
  const [isPttPressed, setIsPttPressed] = useState(false);
  const [isHandsFreeLocked, setIsHandsFreeLocked] = useState(false);
  const [micPermission, setMicPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [noiseReduction, setNoiseReduction] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Request real microphone for live waveform analysis & trigger Android RECORD_AUDIO runtime permission
  const requestRealMic = async (): Promise<boolean> => {
    try {
      const nativeReq = await requestMicrophonePermission();
      if (nativeReq.success || nativeReq.status === 'granted') {
        setMicPermission('granted');
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return nativeReq.success;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: noiseReduction,
          autoGainControl: true,
        },
      });

      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    // Check if mic permission is already granted
    checkSystemPermissions()
      .then((status) => {
        if (status.microphone === 'granted') {
          setMicPermission('granted');
        }
      })
      .catch(() => {});

    const unsubscribePerm = subscribePermissionChanges((status) => {
      if (status.microphone === 'granted') {
        setMicPermission('granted');
      } else if (status.microphone === 'denied') {
        setMicPermission('denied');
      }
    });

    // Listen to real PTT events from mesh network
    const unsubscribeMesh = meshManager.subscribe((event) => {
      if (event.type === 'PTT_STATE') {
        if (event.isSpeaking) {
          onSetActiveSpeaker(event.senderId);
          playPttStartSound();
        } else {
          onSetActiveSpeaker(null);
          playRogerBeep();
        }
      }
    });

    return () => {
      unsubscribePerm();
      unsubscribeMesh();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [onSetActiveSpeaker]);

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
    meshManager.sendPttState(true);
    playPttStartSound();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
  };

  // Handle PTT Release
  const handlePttUp = () => {
    if (isHandsFreeLocked) return;
    if (!isPttPressed) return;
    setIsPttPressed(false);
    onSetActiveSpeaker(null);
    meshManager.sendPttState(false);
    playRogerBeep();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 40, 20]);
    }
  };

  // Toggle Hands-Free Lock mode
  const toggleHandsFreeLock = async () => {
    if (isHandsFreeLocked) {
      setIsHandsFreeLocked(false);
      setIsPttPressed(false);
      onSetActiveSpeaker(null);
      meshManager.sendPttState(false);
      playRogerBeep();
    } else {
      if (micPermission !== 'granted') {
        const granted = await requestRealMic();
        if (!granted) return;
      }
      setIsHandsFreeLocked(true);
      setIsPttPressed(true);
      onSetActiveSpeaker('me');
      meshManager.sendPttState(true);
      playPttStartSound();
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
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 blur-[90px] pointer-events-none -z-10 ${
          isDark ? 'bg-[#00F59B]/10' : 'bg-[#00F59B]/5'
        }`}
      />

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
                    <span
                      className={`text-sm font-semibold flex items-center gap-1.5 ${
                        isDark ? 'text-white/95' : 'text-slate-800'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5 text-[#00F59B]" />
                      فرکانس آزاد آماده ارتباط (STANDBY)
                    </span>
                  )}
                </div>

                <div
                  className={`text-[11px] flex items-center gap-2 mt-1 font-mono ${
                    isDark ? 'text-[#8B95A8]' : 'text-slate-500'
                  }`}
                >
                  <span className="text-[#059669] dark:text-[#00F59B] font-semibold">
                    OPUS HD 48kHz
                  </span>
                  <span>•</span>
                  <span>تأخیر: ۱۶ms</span>
                  <span>•</span>
                  <span>شبکه مستقیم LAN</span>
                </div>
              </div>
            </div>

            {/* Live 12-Band Equalizer Sound Wave Visualizer */}
            <div
              className={`flex items-center gap-[3px] h-8 px-2.5 rounded-xl border shadow-inner ${
                isDark ? 'bg-[#06080D]/90 border-[#1E2638]' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {[0.25, 0.6, 0.95, 0.45, 0.8, 1.0, 0.7, 0.4, 0.85, 0.5, 0.9, 0.3].map((height, i) => (
                <motion.div
                  key={i}
                  className={`w-1 rounded-full ${
                    isPttPressed
                      ? 'bg-gradient-to-t from-[#00F59B] to-[#00D2FF]'
                      : activeSpeakerId
                      ? 'bg-[#00D2FF]'
                      : isDark
                      ? 'bg-[#1E2638]'
                      : 'bg-slate-300'
                  }`}
                  animate={{
                    height: isPttPressed
                      ? `${Math.max(15, (liveVolume * height) + Math.random() * 20)}%`
                      : activeSpeakerId
                      ? `${Math.max(20, Math.sin(Date.now() / 150 + i) * 35 + 50)}%`
                      : '15%',
                  }}
                  transition={{ duration: 0.08 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Permission Request Alert Banner */}
        {micPermission === 'denied' && (
          <div className="rounded-xl p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>دسترسی میکروفون غیرفعال است. جهت ارسال صوت، مجوز را فعال کنید.</span>
            </div>
            <button
              onClick={requestRealMic}
              className="bg-red-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg hover:bg-red-600 transition-colors shrink-0"
            >
              اعطای دسترسی
            </button>
          </div>
        )}
      </div>

      {/* Center Tactical PTT Button Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto py-2 shrink-0">
        <div className="relative flex items-center justify-center">
          {/* Animated Radial Waves when Transmitting */}
          {isPttPressed && (
            <>
              <motion.div
                className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-[#00F59B]/15 border border-[#00F59B]/30 pointer-events-none"
                animate={{ scale: [1, 1.4, 1.8], opacity: [0.8, 0.4, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-[#00F59B]/20 pointer-events-none"
                animate={{ scale: [1, 1.25, 1.5], opacity: [0.9, 0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut', delay: 0.2 }}
              />
            </>
          )}

          {/* Hands-Free Toggle Button on Side */}
          <button
            onClick={toggleHandsFreeLock}
            className={`absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all shadow-lg border cursor-pointer ${
              isHandsFreeLocked
                ? 'bg-[#00F59B] text-black border-[#00F59B] shadow-[#00F59B]/40 ring-2 ring-[#00F59B]/50'
                : isDark
                ? 'bg-[#101624] text-[#8B95A8] border-[#1E2638] hover:text-white hover:border-[#2F3E61]'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 shadow-md'
            }`}
            title="حالت قفل مکالمه بدون نگه داشتن دست (Hands-Free Lock)"
          >
            {isHandsFreeLocked ? (
              <Lock className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Unlock className="w-4 h-4 stroke-[2]" />
            )}
            <span className="text-[8px] font-bold mt-0.5">
              {isHandsFreeLocked ? 'قفل' : 'آزاد'}
            </span>
          </button>

          {/* MAIN TACTICAL PTT BUTTON */}
          <motion.button
            id="ptt-talk-button"
            onMouseDown={handlePttDown}
            onMouseUp={handlePttUp}
            onTouchStart={handlePttDown}
            onTouchEnd={handlePttUp}
            whileTap={{ scale: 0.94 }}
            className={`relative w-40 h-40 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-2xl cursor-pointer border-[5px] select-none ${
              isPttPressed
                ? 'bg-gradient-to-b from-[#00F59B] to-[#00B871] text-black border-[#00F59B] shadow-[#00F59B]/50 scale-95'
                : activeSpeakerId
                ? 'bg-gradient-to-b from-[#141A26] to-[#0D121F] text-[#475569] border-[#1E2638] opacity-70 cursor-not-allowed'
                : isDark
                ? 'bg-gradient-to-b from-[#161F33] to-[#0D1322] text-white border-[#222E47] hover:border-[#00F59B]/40 shadow-black/80'
                : 'bg-gradient-to-b from-white to-slate-100 text-slate-800 border-slate-300 hover:border-emerald-400 shadow-slate-300'
            }`}
          >
            {/* Inner Metallic Bezel Ring */}
            <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center border transition-all ${
              isPttPressed
                ? 'border-black/20 bg-black/5'
                : isDark
                ? 'border-[#222E47]/70 bg-gradient-to-b from-transparent to-black/30'
                : 'border-slate-200 bg-slate-50/50'
            }`}>
              <Mic
                className={`w-10 h-10 transition-transform ${
                  isPttPressed ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'
                }`}
              />
              <span className="text-xs font-black tracking-wider mt-1">
                {isPttPressed ? 'رها کنید' : 'نگه دارید'}
              </span>
              <span className={`text-[9px] font-mono tracking-widest ${
                isPttPressed ? 'text-black/80 font-bold' : isDark ? 'text-[#8B95A8]' : 'text-slate-500'
              }`}>
                PTT VOICE
              </span>
            </div>
          </motion.button>
        </div>

        {/* Live Audio Level Meter */}
        <div className="w-56 mt-3 space-y-1">
          <div className="flex justify-between text-[10px] font-mono">
            <span className={isDark ? 'text-[#8B95A8]' : 'text-slate-500'}>سطح سیگنال صوتی:</span>
            <span className={`font-bold ${isPttPressed ? 'text-[#00F59B]' : 'text-[#8B95A8]'}`}>
              {isPttPressed ? `${liveVolume} dB` : 'خاموش'}
            </span>
          </div>
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${
            isDark ? 'bg-[#141A26]' : 'bg-slate-200'
          }`}>
            <div
              className="h-full bg-gradient-to-r from-[#00F59B] via-[#00D2FF] to-cyan-300 transition-all duration-75"
              style={{ width: `${isPttPressed ? Math.max(5, liveVolume) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Connected Devices / Listeners List */}
      <div className="space-y-1.5 shrink-0">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Radio className="w-3.5 h-3.5 text-[#00F59B]" />
            <span>دستگاه‌های متصل در شبکه محلی:</span>
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
            >
              <Sliders className="w-3 h-3" />
              <span>حذف نویز سخت‌افزاری</span>
            </button>
          </div>
        </div>

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
                {profile.username.slice(0, 1) || 'من'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {profile.username || 'این دستگاه'} (گوشی شما)
                </span>
                <span className="text-[9px] bg-[#00F59B]/15 text-[#00F59B] px-1.5 py-0.2 rounded-full font-bold border border-[#00F59B]/30">
                  {profile.role === 'host' ? '⚡ میزبان (Host AP)' : '🔗 کلاینت'}
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

        {/* Other Real Devices (Connected Listeners) */}
        {peers.length === 0 ? (
          <div className={`py-4 text-center text-xs border border-dashed rounded-xl space-y-1 ${
            isDark ? 'text-[#8B95A8] border-[#1E2638] bg-[#0D111A]/40' : 'text-slate-500 border-slate-300 bg-slate-50'
          }`}>
            <Radio className="w-4 h-4 mx-auto text-[#00F59B] opacity-60 animate-pulse" />
            <div className="text-[11px]">در حال انتظار برای اتصال شنوندگان دیگر به شبکه...</div>
            <div className="text-[10px] text-slate-500">
              برای برقراری ارتباط دوطرفه، از دکمه «اتصال» در نوار بالا استفاده کنید.
            </div>
          </div>
        ) : (
          peers.map((peer) => {
            const isPeerTalking = activeSpeakerId === peer.id;
            return (
              <div
                key={peer.id}
                className={`rounded-xl p-2 border transition-all flex items-center justify-between shadow-sm ${
                  isPeerTalking
                    ? 'bg-[#0E1726] border-[#00D2FF] shadow-md shadow-[#00D2FF]/20 ring-1 ring-[#00D2FF]/40'
                    : isDark
                    ? 'bg-[#0D121F]/80 border-[#1E2638]'
                    : 'bg-white border-slate-200'
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
                      <span className="text-[9px] bg-[#3B82F6]/20 text-[#3B82F6] px-1 py-0.2 rounded font-bold">
                        {peer.role === 'host' ? 'Host' : 'Client'}
                      </span>
                    </div>
                    <div className={`text-[10px] font-mono mt-0.2 flex items-center gap-1.5 ${isDark ? 'text-[#8B95A8]' : 'text-slate-500'}`}>
                      <span>{peer.ip}:{peer.port}</span>
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
