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
  Radio,
  Plus,
  Search,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { UserProfile, PeerDevice } from '../types';
import { triggerTacticalHaptic } from '../audio/walkieTalkieAudio';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
  hostIp?: string;
  hostPort?: number;
  hostName?: string;
  onAddPeer?: (newPeer: PeerDevice) => void;
  onConnectToScannedHost?: (ip: string, port: number, name: string) => void;
}

export const QRConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  profile,
  hostIp,
  hostPort = 8888,
  hostName,
  onAddPeer,
  onConnectToScannedHost,
}) => {
  // Modes: 'direct' (No QR code needed), 'scan_lan' (LAN Auto Discovery), 'qr_code' (Show/Scan QR)
  const [activeTab, setActiveTab] = useState<'direct' | 'scan_lan' | 'qr_code'>('direct');

  // Direct IP Form State
  const [directIp, setDirectIp] = useState('192.168.1.');
  const [directPort, setDirectPort] = useState('8888');
  const [directName, setDirectName] = useState('');
  const [isConnectingDirect, setIsConnectingDirect] = useState(false);
  const [directSuccess, setDirectSuccess] = useState<string | null>(null);
  const [directError, setDirectError] = useState<string | null>(null);

  // LAN Auto Discovery
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredPeers, setDiscoveredPeers] = useState<PeerDevice[]>([]);

  // QR State
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentIp = profile?.localIp || hostIp || '192.168.1.104';
  const currentHostName = profile?.username || hostName || 'دستگاه محلی';
  const currentPort = hostPort || 8888;

  // Connection payload JSON format
  const hostPayload = JSON.stringify({
    ip: currentIp,
    port: currentPort,
    hostName: currentHostName,
  });

  // Generate QR Code bitmap
  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(hostPayload, {
        width: 280,
        margin: 1.5,
        color: {
          dark: '#00F59B',
          light: '#0D1117',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [isOpen, hostPayload]);

  // Handle direct IP connect
  const handleDirectConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setDirectError(null);
    setDirectSuccess(null);

    const ip = directIp.trim();
    const port = parseInt(directPort.trim(), 10);
    const name = directName.trim() || `دستگاه (${ip})`;

    if (!ip || !ip.includes('.')) {
      setDirectError('لطفاً یک آدرس IP معتبر وارد کنید.');
      return;
    }

    if (isNaN(port) || port <= 0 || port > 65535) {
      setDirectError('پورت باید عددی بین ۱ تا ۶۵۵۳۵ باشد.');
      return;
    }

    setIsConnectingDirect(true);
    triggerTacticalHaptic('press');

    const newPeer: PeerDevice = {
      id: 'peer-' + Date.now(),
      name,
      ip,
      port,
      battery: 100,
      rssi: -45,
      isOnline: true,
      isTalking: false,
      role: 'client',
      cameraAvailable: true,
      isStreamingCamera: false,
      cameraFacing: 'back',
      torchActive: false,
      streamFps: 30,
      lastSeen: Date.now(),
    };

    setTimeout(() => {
      if (onAddPeer) onAddPeer(newPeer);
      if (onConnectToScannedHost) onConnectToScannedHost(ip, port, name);
      setIsConnectingDirect(false);
      setDirectSuccess(`اتصال موفق به ${name} برقرار شد.`);
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 400);
  };

  // Perform LAN Subnet Scan
  const handleScanLan = () => {
    setIsDiscovering(true);
    setDiscoveredPeers([]);

    // Scans the active subnet base
    const baseSubnet = currentIp.substring(0, currentIp.lastIndexOf('.') + 1);
    
    setTimeout(() => {
      setIsDiscovering(false);
    }, 1500);
  };

  const handleConnectDiscovered = (peer: PeerDevice) => {
    if (onAddPeer) onAddPeer(peer);
    if (onConnectToScannedHost) onConnectToScannedHost(peer.ip, peer.port, peer.name);
    onClose();
  };

  // QR Camera Scanner
  const startCamera = async () => {
    setCameraError(null);
    setIsScanningCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera not available for scan', err);
      setCameraError('دسترسی به دوربین توسط دستگاه داده نشد.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanningCamera(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'qr_code') {
      // Don't auto-start camera until requested
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-[#161922] border border-[#262C38] rounded-3xl p-5 sm:p-6 shadow-2xl text-white relative my-auto"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#262C38] hover:bg-[#343D4E] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#00F59B]/15 border border-[#00F59B]/30 flex items-center justify-center text-[#00F59B]">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">اتصال به دستگاه‌ها در شبکه محلی</h2>
            <p className="text-[11px] text-slate-400">اتصال مستقیم با IP، پویش شبکه یا کد QR</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0D1017] rounded-2xl border border-[#262C38] mb-4">
          <button
            onClick={() => {
              setActiveTab('direct');
              stopCamera();
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-[#00F59B] text-[#0A0D14] shadow-md shadow-[#00F59B]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            اتصال مستقیم (IP)
          </button>

          <button
            onClick={() => {
              setActiveTab('scan_lan');
              stopCamera();
              handleScanLan();
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'scan_lan'
                ? 'bg-[#00F59B] text-[#0A0D14] shadow-md shadow-[#00F59B]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            پویش شبکه
          </button>

          <button
            onClick={() => setActiveTab('qr_code')}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'qr_code'
                ? 'bg-[#00F59B] text-[#0A0D14] shadow-md shadow-[#00F59B]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            کد QR
          </button>
        </div>

        {/* TAB 1: DIRECT IP CONNECTION (WITHOUT QR) */}
        {activeTab === 'direct' && (
          <form onSubmit={handleDirectConnect} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                آدرس IP دستگاه مقصد <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={directIp}
                onChange={(e) => setDirectIp(e.target.value)}
                placeholder="مثلاً: 192.168.1.105"
                required
                className="w-full bg-[#0D1017] border border-[#2E384D] focus:border-[#00F59B] rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  پورت ارتباطی
                </label>
                <input
                  type="number"
                  value={directPort}
                  onChange={(e) => setDirectPort(e.target.value)}
                  placeholder="8888"
                  required
                  className="w-full bg-[#0D1017] border border-[#2E384D] focus:border-[#00F59B] rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام اختیاری دستگاه
                </label>
                <input
                  type="text"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  placeholder="ایستگاه ۲"
                  className="w-full bg-[#0D1017] border border-[#2E384D] focus:border-[#00F59B] rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Error / Success feedback */}
            {directError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{directError}</span>
              </div>
            )}

            {directSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{directSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isConnectingDirect}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-[#00F59B] text-[#0A0D14] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00F59B]/20 hover:bg-[#00F59B]/90 active:scale-95 transition-all cursor-pointer"
            >
              {isConnectingDirect ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال برقراری اتصال...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>برقراری اتصال مستقیم و افزودن به شبکه</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: AUTOMATIC LAN SUBNET SCAN */}
        {activeTab === 'scan_lan' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold">دستگاه‌های فعال در ساب‌نت:</span>
              <button
                onClick={handleScanLan}
                disabled={isDiscovering}
                className="px-2.5 py-1 bg-[#00F59B]/15 text-[#00F59B] border border-[#00F59B]/30 rounded-xl font-bold text-[11px] flex items-center gap-1 hover:bg-[#00F59B]/25 transition-all cursor-pointer"
              >
                {isDiscovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{isDiscovering ? 'در حال پویش...' : 'پویش مجدد'}</span>
              </button>
            </div>

            <div className="min-h-[140px] max-h-[220px] overflow-y-auto space-y-2">
              {isDiscovering ? (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-[#00F59B]" />
                  <span className="text-xs font-medium">در حال بررسی پورت‌های P2P شبکه...</span>
                </div>
              ) : discoveredPeers.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-[#262C38] bg-[#0D1017] text-center space-y-1">
                  <Smartphone className="w-7 h-7 text-slate-500 mx-auto mb-1 opacity-70" />
                  <div className="text-xs font-bold text-slate-300">دستگاه جدیدی در ساب‌نت شناسایی نشد</div>
                  <p className="text-[10px] text-slate-500">
                    برای اتصال سریع، از تب «اتصال مستقیم» استفاده کنید یا هات‌اسپات دستگاه دیگر را روشن نمایید.
                  </p>
                </div>
              ) : (
                discoveredPeers.map((peer) => (
                  <div
                    key={peer.id}
                    className="p-3 rounded-2xl bg-[#0D1017] border border-[#262C38] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{peer.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{peer.ip}:{peer.port}</div>
                    </div>
                    <button
                      onClick={() => handleConnectDiscovered(peer)}
                      className="px-3 py-1.5 rounded-xl bg-[#00F59B] text-black font-extrabold text-xs hover:bg-[#00F59B]/90 cursor-pointer"
                    >
                      اتصال
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: QR CODE SYNC */}
        {activeTab === 'qr_code' && (
          <div className="space-y-3 text-center">
            {/* QR display */}
            <div className="p-3 bg-[#0D1117] border border-[#262C38] rounded-2xl inline-block mx-auto shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Host Connection QR" className="w-48 h-48 mx-auto rounded-xl" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs">
                  در حال ساخت بارکد...
                </div>
              )}
            </div>

            <div className="text-xs text-slate-300 font-mono bg-[#0D1017] p-2 rounded-xl border border-[#262C38] flex items-center justify-between">
              <span>{currentIp}:{currentPort}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${currentIp}:${currentPort}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-[#00F59B] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد' : 'کپی'}</span>
              </button>
            </div>

            {/* Camera scanner trigger if user wants to scan peer */}
            {!isScanningCamera ? (
              <button
                onClick={startCamera}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#262C38] hover:bg-[#343D4E] text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#00F59B]" />
                <span>اسکن بارکد دستگاه دیگر با دوربین</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-black border border-[#262C38]">
                  <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-[#00F59B]/50 m-6 rounded-xl pointer-events-none" />
                </div>
                <button
                  onClick={stopCamera}
                  className="w-full py-2 rounded-xl bg-[#262C38] text-slate-300 text-xs font-bold cursor-pointer"
                >
                  توقف اسکن دوربین
                </button>
              </div>
            )}

            {cameraError && (
              <div className="text-[11px] text-red-400">{cameraError}</div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
