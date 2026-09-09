import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import {
  QrCode,
  ScanLine,
  X,
  Copy,
  Check,
  Camera,
  Wifi,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info,
  Radio,
  Zap
} from 'lucide-react';
import { UserProfile, PeerDevice } from '../types';
import { triggerTacticalHaptic } from '../audio/walkieTalkieAudio';

interface QRConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
  hostIp?: string;
  hostPort?: number;
  hostName?: string;
  onAddPeerFromQR?: (newPeer: PeerDevice) => void;
  onConnectToScannedHost?: (ip: string, port: number, name: string) => void;
  onNavigateToCode?: () => void;
}

export const QRConnectionModal: React.FC<QRConnectionModalProps> = ({
  isOpen,
  onClose,
  profile,
  hostIp,
  hostPort = 8888,
  hostName,
  onAddPeerFromQR,
  onConnectToScannedHost,
  onNavigateToCode,
}) => {
  const [activeMode, setActiveMode] = useState<'generate' | 'scan'>('generate');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentIp = profile?.localIp || hostIp || '192.168.43.1';
  const currentHostName = profile?.username || hostName || 'پارسا (میزبان)';
  const currentPort = hostPort || 8888;

  // Connection payload JSON format specified by user
  const hostPayload = JSON.stringify({
    ip: currentIp,
    port: currentPort,
    hostName: currentHostName,
  });

  // Generate QR Code bitmap when modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(hostPayload, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#00E676',
          light: '#121214',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR', err));
    }
  }, [isOpen, hostPayload]);

  // Handle Camera start for QR Scanner
  const startCameraScanner = async () => {
    setCameraError(null);
    setIsScanning(true);
    setScanSuccess(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera not available for scan', err);
      setCameraError('دسترسی به دوربین داده نشد یا در شبیه‌ساز نیست. می‌توانید با دکمه تست سریع، اسکن را شبیه‌سازی کنید.');
    }
  };

  const stopCameraScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen && activeMode === 'scan') {
      startCameraScanner();
    } else {
      stopCameraScanner();
    }
    return () => {
      stopCameraScanner();
    };
  }, [isOpen, activeMode]);

  // Simulate or perform successful QR detection
  const handleDetectPayload = (payloadString: string) => {
    try {
      const data = JSON.parse(payloadString);
      if (data.ip && data.port && data.hostName) {
        triggerTacticalHaptic('qrScan');
        setScanSuccess(`میزبان شناسایی شد: ${data.hostName} (${data.ip}:${data.port})`);

        const newPeer: PeerDevice = {
          id: 'peer-qr-' + Date.now(),
          name: data.hostName,
          ip: data.ip,
          port: data.port,
          battery: 92,
          rssi: -48,
          isOnline: true,
          isTalking: false,
          role: 'host',
          cameraAvailable: true,
          isStreamingCamera: false,
          cameraFacing: 'back',
          torchActive: false,
          streamFps: 25,
          lastSeen: Date.now(),
        };

        setTimeout(() => {
          if (onAddPeerFromQR) onAddPeerFromQR(newPeer);
          if (onConnectToScannedHost) onConnectToScannedHost(data.ip, data.port, data.hostName);
          stopCameraScanner();
          onClose();
        }, 1200);
      }
    } catch (e) {
      setCameraError('فرمت بارکد معتبر نیست.');
    }
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(hostPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-lg bg-[#16161A] border border-[#2A2A35] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 bg-[#1E1E24] border-b border-[#2A2A35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00E676]/15 border border-[#00E676]/30 flex items-center justify-center text-[#00E676]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                اتصال سریع شبکه محلی با QR Code
              </h3>
              <p className="text-[11px] text-[#A0A0AB]">
                هندشیک خودکار سوکت با ML Kit بدون نیاز به تایپ دستی IP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#2A2A35] hover:bg-[#3A3A4A] text-[#A0A0AB] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher: Generate (Host) vs Scan (Client) */}
        <div className="p-3 bg-[#131316] border-b border-[#2A2A35] flex items-center gap-2">
          <button
            onClick={() => setActiveMode('generate')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeMode === 'generate'
                ? 'bg-[#00E676] text-black shadow-md shadow-[#00E676]/20'
                : 'text-[#A0A0AB] hover:text-white bg-[#1E1E24]/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>نمایش QR میزبان (Host)</span>
          </button>

          <button
            onClick={() => setActiveMode('scan')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeMode === 'scan'
                ? 'bg-[#3A86FF] text-white shadow-md shadow-[#3A86FF]/20'
                : 'text-[#A0A0AB] hover:text-white bg-[#1E1E24]/60'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>اسکنر دوربین (Client)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeMode === 'generate' ? (
            /* Mode 1: Host QR Code Display */
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative p-4 rounded-3xl bg-[#121214] border-2 border-[#00E676]/40 shadow-xl shadow-[#00E676]/10 flex flex-col items-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-56 h-56 rounded-2xl p-1 bg-[#121214] border border-[#2A2A35]"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-[#A0A0AB] text-xs">
                    در حال ساخت بارکد...
                  </div>
                )}

                {/* Floating badge */}
                <div className="mt-2 text-[11px] font-mono text-[#00E676] flex items-center gap-1.5 bg-[#00E676]/10 px-3 py-1 rounded-full border border-[#00E676]/20">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{currentIp}:{currentPort}</span>
                </div>
              </div>

              {/* JSON Payload Preview Box */}
              <div className="w-full bg-[#121214] border border-[#2A2A35] rounded-2xl p-3 text-right">
                <div className="flex items-center justify-between text-[11px] text-[#A0A0AB] mb-1.5">
                  <span className="font-semibold">داده کدگذاری شده (JSON Payload):</span>
                  <button
                    onClick={handleCopyPayload}
                    className="flex items-center gap-1 text-[10px] text-[#00E676] hover:underline"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
                  </button>
                </div>
                <code className="text-xs text-[#3A86FF] font-mono block break-all dir-ltr text-left bg-[#18181D] p-2 rounded-xl">
                  {hostPayload}
                </code>
              </div>

              <div className="text-xs text-[#A0A0AB] leading-relaxed">
                همکاران شما با باز کردن اسکنر در تب روبه‌رو یا در اپلیکیشن اندروید، این بارکد را اسکن کرده و فوراً به کانال بیسیم و دوربین مداربسته شما متصل می‌شوند.
              </div>
            </div>
          ) : (
            /* Mode 2: Client Camera QR Scanner */
            <div className="flex flex-col items-center space-y-4">
              {/* Viewfinder Frame */}
              <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-3xl border-2 border-[#3A86FF]/50 overflow-hidden shadow-2xl flex items-center justify-center">
                {/* Real video if available */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Tactical HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                  {/* Corner brackets */}
                  <div className="flex justify-between">
                    <div className="w-7 h-7 border-t-2 border-r-2 border-[#00E676]" />
                    <div className="w-7 h-7 border-t-2 border-l-2 border-[#00E676]" />
                  </div>

                  {/* Laser scanline animation */}
                  <motion.div
                    animate={{ y: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                    className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#00E676] to-transparent shadow-[0_0_12px_#00E676]"
                  />

                  <div className="flex justify-between">
                    <div className="w-7 h-7 border-b-2 border-r-2 border-[#00E676]" />
                    <div className="w-7 h-7 border-b-2 border-l-2 border-[#00E676]" />
                  </div>
                </div>

                {/* Scan success banner */}
                <AnimatePresence>
                  {scanSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-x-3 bottom-3 bg-[#00E676] text-black font-bold text-xs p-2.5 rounded-2xl text-center shadow-lg shadow-[#00E676]/40 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{scanSuccess}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {cameraError && (
                <div className="text-[11px] text-[#FFB74D] bg-[#FFB74D]/10 border border-[#FFB74D]/20 p-2.5 rounded-xl text-center">
                  {cameraError}
                </div>
              )}

              {/* Quick simulation buttons for desktop/test */}
              <div className="w-full flex flex-col gap-2">
                <span className="text-[11px] text-[#A0A0AB] text-center">
                  تست بدون دوربین فیزیکی:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      handleDetectPayload(
                        JSON.stringify({
                          ip: '192.168.1.102',
                          port: 8888,
                          hostName: 'رضا (سرپرست کارگاه)',
                        })
                      )
                    }
                    className="bg-[#1E1E24] hover:bg-[#2A2A35] text-white text-xs p-2.5 rounded-xl border border-[#2A2A35] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#00E676]" />
                    <span>اسکن بارکد رضا</span>
                  </button>

                  <button
                    onClick={() =>
                      handleDetectPayload(
                        JSON.stringify({
                          ip: '192.168.1.108',
                          port: 8888,
                          hostName: 'نگهبانی انبار شماره ۲',
                        })
                      )
                    }
                    className="bg-[#1E1E24] hover:bg-[#2A2A35] text-white text-xs p-2.5 rounded-xl border border-[#2A2A35] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#3A86FF]" />
                    <span>اسکن بارکد انبار ۲</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Kotlin Code link */}
        <div className="p-4 bg-[#141417] border-t border-[#2A2A35] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#A0A0AB]">
            <ShieldCheck className="w-4 h-4 text-[#00E676]" />
            <span>پروتکل امن UDP محلی</span>
          </div>

          {onNavigateToCode && (
            <button
              onClick={() => {
                onClose();
                onNavigateToCode();
              }}
              className="text-xs text-[#3A86FF] hover:text-[#5B9BFF] flex items-center gap-1 font-medium transition-colors"
            >
              <span>مشاهده سورس‌کد کاتلین (`QRCodeUtils`)</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
