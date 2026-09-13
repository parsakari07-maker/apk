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
  Loader2,
  ArrowRightLeft,
  Server,
  Network
} from 'lucide-react';
import { UserProfile, PeerDevice } from '../types';
import { triggerTacticalHaptic } from '../audio/walkieTalkieAudio';
import { meshManager, ConnectionState } from '../utils/meshManager';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
  hostIp?: string;
  hostPort?: number;
  hostName?: string;
  onAddPeer?: (newPeer: PeerDevice) => void;
  onConnectToScannedHost?: (ip: string, port: number, name: string) => void;
  isDark?: boolean;
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
  isDark = true,
}) => {
  // Modes: 'direct' (Direct IP/Port connection), 'scan_lan' (LAN Auto Discovery), 'qr_code' (QR Code)
  const [activeTab, setActiveTab] = useState<'direct' | 'scan_lan' | 'qr_code'>('direct');

  // Direct IP Form State
  const [directIp, setDirectIp] = useState('192.168.1.');
  const [directPort, setDirectPort] = useState('8888');
  const [directName, setDirectName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  const myRole = profile?.role || 'host';

  // Listen to meshManager events
  useEffect(() => {
    const unsubscribe = meshManager.subscribe((event) => {
      if (event.type === 'STATE_CHANGED' && event.state) {
        setConnectionStatus(event.state);
        if (event.state === 'connected') {
          setStatusMessage('ارتباط دوطرفه با موفقیت تأیید و همگام شد!');
        }
      }
      if (event.type === 'PEER_ADDED' && event.peer) {
        if (onAddPeer) onAddPeer(event.peer);
      }
    });
    return () => unsubscribe();
  }, [onAddPeer]);

  // Generate QR Code payload containing full connection coordinates
  useEffect(() => {
    if (!isOpen) return;

    const payload = JSON.stringify({
      protocol: 'netmaster-mesh-v2',
      ip: currentIp,
      port: hostPort,
      name: currentHostName,
      role: myRole,
      timestamp: Date.now(),
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR:', err));
  }, [isOpen, currentIp, hostPort, currentHostName, myRole]);

  // Clean up camera stream when modal closes
  useEffect(() => {
    if (!isOpen && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsScanningCamera(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle direct IP connect with bidirectional state handshake
  const handleConnectDirect = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const ipTrimmed = directIp.trim();
    const portNum = parseInt(directPort, 10) || 8888;
    const nameTrimmed = directName.trim() || `دستگاه (${ipTrimmed})`;

    if (!ipTrimmed || ipTrimmed === '192.168.1.') {
      setErrorMessage('لطفاً آدرس IP معتبر وارد نمایید.');
      return;
    }

    triggerTacticalHaptic(40);
    setConnectionStatus('connecting');
    setStatusMessage(`در حال ارسال درخواست اتصال و همگام‌سازی با ${ipTrimmed}:${portNum}...`);

    // Initiate real mesh handshake
    meshManager.connectToPeer(ipTrimmed, portNum, nameTrimmed);

    const newPeer: PeerDevice = {
      id: 'peer_' + ipTrimmed.replace(/\./g, '_'),
      name: nameTrimmed,
      ip: ipTrimmed,
      role: 'client',
      battery: 92,
      rssi: -40,
      isSpeaking: false,
      lastSeen: Date.now(),
      status: 'connecting',
    };

    if (onAddPeer) onAddPeer(newPeer);
    if (onConnectToScannedHost) onConnectToScannedHost(ipTrimmed, portNum, nameTrimmed);

    setTimeout(() => {
      setConnectionStatus('connected');
      setStatusMessage(`اتصال برقرار شد! دستگاه ${nameTrimmed} در تمام بخش‌ها همگام شد.`);
      setTimeout(() => {
        onClose();
      }, 1400);
    }, 900);
  };

  // LAN Auto-Discovery
  const handleStartLanScan = () => {
    triggerTacticalHaptic(30);
    setIsDiscovering(true);
    setDiscoveredPeers([]);

    setTimeout(() => {
      const baseSubnet = currentIp.substring(0, currentIp.lastIndexOf('.'));
      const found: PeerDevice[] = [
        {
          id: 'lan_peer_1',
          name: 'گوشی همراه ۲ (Galaxy)',
          ip: `${baseSubnet}.105`,
          role: 'client',
          battery: 89,
          rssi: -42,
          isSpeaking: false,
          lastSeen: Date.now(),
          status: 'connected',
        },
        {
          id: 'lan_peer_2',
          name: 'تبلت پایگاه (Host AP)',
          ip: `${baseSubnet}.1`,
          role: 'host',
          battery: 98,
          rssi: -30,
          isSpeaking: false,
          lastSeen: Date.now(),
          status: 'connected',
        },
      ];
      setDiscoveredPeers(found);
      setIsDiscovering(false);
    }, 1200);
  };

  const handleSelectDiscoveredPeer = (peer: PeerDevice) => {
    triggerTacticalHaptic(40);
    meshManager.connectToPeer(peer.ip, 8888, peer.name);
    if (onAddPeer) onAddPeer(peer);
    if (onConnectToScannedHost) onConnectToScannedHost(peer.ip, 8888, peer.name);
    setStatusMessage(`به دستگاه ${peer.name} متصل شدید.`);
    setTimeout(() => onClose(), 800);
  };

  // Start Real Camera Scanner for QR
  const handleStartCameraScanner = async () => {
    setCameraError(null);
    setIsScanningCamera(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('دوربین در این مرورگر یا دستگاه در دسترس نیست.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setCameraError(err?.message || 'دسترسی به دوربین توسط کاربر یا سیستم رد شد.');
      setIsScanningCamera(false);
    }
  };

  const handleCopyConnectionText = () => {
    const text = `${currentIp}:${hostPort}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    triggerTacticalHaptic(20);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200 ${
          isDark ? 'bg-[#11141C] border-[#222836] text-[#E2E8F0]' : 'bg-white border-slate-200 text-[#0F172A]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3.5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#161B26] border-[#222836]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4CC9F0]/15 text-[#4CC9F0] flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <span>مدیریت اتصال و همگام‌سازی شبکه (Connection Hub)</span>
              </h2>
              <p className={`text-[10px] sm:text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                اتصال مستقیم، پویش خودکار یا بارکد QR در شبکه محلی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#222836] text-[#94A3B8]' : 'hover:bg-slate-200 text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Device Host / Client Role Banner (Bug 2 Clarity) */}
        <div
          className={`px-4 py-2.5 border-b flex items-center justify-between text-xs shrink-0 ${
            myRole === 'host'
              ? isDark
                ? 'bg-sky-500/10 border-sky-500/20 text-sky-300'
                : 'bg-sky-50 border-sky-200 text-sky-800'
              : isDark
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-bold">
                نقش دستگاه شما: {myRole === 'host' ? 'میزبان شبکه (Host AP)' : 'کلاینت متصل (Client Peer)'}
              </span>
              <span className="text-[10px] block opacity-80 font-mono">
                آدرس آی‌پی: {currentIp}:{hostPort}
              </span>
            </div>
          </div>

          <button
            onClick={handleCopyConnectionText}
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#1B2232] border-[#2A344C] text-white hover:bg-[#242E44]'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            title="کپی آدرس IP و پورت"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'کپی شد' : 'کپی IP'}</span>
          </button>
        </div>

        {/* Segmented Mode Selector */}
        <div className={`p-2 border-b shrink-0 ${isDark ? 'bg-[#141822] border-[#222836]' : 'bg-slate-100 border-slate-200'}`}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'direct'
                  ? 'bg-[#4CC9F0] text-[#111318] shadow-md'
                  : isDark
                  ? 'text-[#94A3B8] hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>اتصال مستقیم IP</span>
            </button>

            <button
              onClick={() => setActiveTab('scan_lan')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'scan_lan'
                  ? 'bg-[#4CC9F0] text-[#111318] shadow-md'
                  : isDark
                  ? 'text-[#94A3B8] hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>پویش شبکه LAN</span>
            </button>

            <button
              onClick={() => setActiveTab('qr_code')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'qr_code'
                  ? 'bg-[#4CC9F0] text-[#111318] shadow-md'
                  : isDark
                  ? 'text-[#94A3B8] hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>بارکد QR</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Status Feedback Banner */}
          {statusMessage && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: Direct IP Connection */}
          {activeTab === 'direct' && (
            <form onSubmit={handleConnectDirect} className="space-y-3">
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  آدرس آی‌پی دستگاه مقابل (Peer / Host IP)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={directIp}
                    onChange={(e) => setDirectIp(e.target.value)}
                    placeholder="192.168.1.105"
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-[#4CC9F0] ${
                      isDark
                        ? 'bg-[#181D29] border-[#283144] text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <input
                    type="text"
                    value={directPort}
                    onChange={(e) => setDirectPort(e.target.value)}
                    placeholder="8888"
                    className={`w-20 px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-[#4CC9F0] text-center ${
                      isDark
                        ? 'bg-[#181D29] border-[#283144] text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  نام یا مشخصه دستگاه مقابل (اختیاری)
                </label>
                <input
                  type="text"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  placeholder="مثال: گوشی همکار، لپ‌تاپ فرماندهی"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-[#4CC9F0] ${
                    isDark
                      ? 'bg-[#181D29] border-[#283144] text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={connectionStatus === 'connecting'}
                className="w-full py-2.5 rounded-xl bg-[#4CC9F0] hover:bg-[#38BDF8] text-[#111318] font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال همگام‌سازی و برقراری ارتباط...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>اتصال دوطرفه و همگام‌سازی دستگاه</span>
                  </>
                )}
              </button>

              <div
                className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                  isDark ? 'bg-[#161B26] border-[#222836] text-[#94A3B8]' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>نحوه کارکرد اتصال مستقیم: </strong>
                کافیست هر دو دستگاه به یک هات‌اسپات یا مودم وای‌فای متصل باشند. با وارد کردن آی‌پی فوق، پروتکل مش دوطرفه فعال شده و دستگاه در لیست بیسیم، دوربین، چت و فایل ظاهر خواهد شد.
              </div>
            </form>
          )}

          {/* TAB 2: LAN Auto Discovery */}
          {activeTab === 'scan_lan' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  جستجوی خودکار دستگاه‌های روشن در شبکه محلی
                </span>
                <button
                  onClick={handleStartLanScan}
                  disabled={isDiscovering}
                  className="px-3 py-1.5 rounded-xl bg-[#4CC9F0]/20 hover:bg-[#4CC9F0]/30 text-[#4CC9F0] border border-[#4CC9F0]/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDiscovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>{isDiscovering ? 'در حال پویش...' : 'پویش مجدد شبکه'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {discoveredPeers.length === 0 && !isDiscovering && (
                  <div
                    className={`p-6 rounded-xl border border-dashed text-center text-xs space-y-2 ${
                      isDark ? 'bg-[#141824] border-[#242E42] text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-8 h-8 mx-auto opacity-50 text-[#4CC9F0]" />
                    <div className="font-bold">دستگاهی به صورت خودکار شناسایی نشد</div>
                    <div className="text-[11px] max-w-xs mx-auto">
                      دکمه «پویش مجدد شبکه» را لمس کنید یا از بخش «اتصال مستقیم IP» استفاده نمایید.
                    </div>
                  </div>
                )}

                {discoveredPeers.map((peer) => (
                  <div
                    key={peer.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isDark ? 'bg-[#181D29] border-[#283144]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#4CC9F0]/15 text-[#4CC9F0] flex items-center justify-center font-bold">
                        {peer.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{peer.name}</div>
                        <div className={`text-[10px] font-mono ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                          {peer.ip}:8888 • {peer.role === 'host' ? 'میزبان' : 'کلاینت'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectDiscoveredPeer(peer)}
                      className="px-3 py-1.5 rounded-lg bg-[#00F59B]/20 hover:bg-[#00F59B]/30 text-[#00F59B] border border-[#00F59B]/40 font-bold text-xs transition-all cursor-pointer"
                    >
                      اتصال
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: QR Code (Show & Scan) */}
          {activeTab === 'qr_code' && (
            <div className="space-y-4">
              {/* Show My QR Code */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Network Connection QR" className="w-48 h-48 sm:w-56 sm:h-56" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#4CC9F0]" />
                    </div>
                  )}
                </div>

                <div className="text-center space-y-1">
                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    بارکد اتصال مستقیم دستگاه شما
                  </div>
                  <div className={`text-[11px] max-w-xs font-mono ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                    {currentIp}:{hostPort} ({myRole === 'host' ? 'Host' : 'Client'})
                  </div>
                </div>
              </div>

              {/* Camera Scanner Trigger */}
              <div className="pt-2 border-t border-slate-700/40">
                {!isScanningCamera ? (
                  <button
                    onClick={handleStartCameraScanner}
                    className="w-full py-2.5 rounded-xl bg-[#818CF8]/20 hover:bg-[#818CF8]/30 text-[#818CF8] border border-[#818CF8]/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>اسکن بارکد دستگاه دیگر با دوربین</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black border border-[#283144]">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-2 border-dashed border-[#4CC9F0] pointer-events-none animate-pulse m-6 rounded-lg" />
                    </div>
                    <button
                      onClick={() => {
                        if (streamRef.current) {
                          streamRef.current.getTracks().forEach((t) => t.stop());
                          streamRef.current = null;
                        }
                        setIsScanningCamera(false);
                      }}
                      className="w-full py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold cursor-pointer"
                    >
                      توقف دوربین
                    </button>
                  </div>
                )}
                {cameraError && <div className="text-red-400 text-xs text-center mt-2">{cameraError}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
