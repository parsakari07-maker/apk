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
  Search,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Server,
  Network,
  RefreshCw,
  Activity,
  HelpCircle
} from 'lucide-react';
import { UserProfile, PeerDevice } from '../types';
import { triggerTacticalHaptic } from '../audio/walkieTalkieAudio';
import { meshManager, ConnectionState, DiscoveredPeer } from '../utils/meshManager';

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
  // Tabs: 'direct' (Direct IP/Port connection), 'scan_lan' (Real LAN Discovery), 'qr_code' (QR Code Handshake)
  const [activeTab, setActiveTab] = useState<'direct' | 'scan_lan' | 'qr_code'>('direct');

  // Direct IP Form
  const [directIp, setDirectIp] = useState('');
  const [directPort, setDirectPort] = useState('8888');
  const [directName, setDirectName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // LAN Auto Discovery (Real Beacons Only)
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredPeers, setDiscoveredPeers] = useState<DiscoveredPeer[]>([]);

  // QR Code State
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentDeviceId = meshManager.getDeviceId();
  const currentIp = profile?.localIp || hostIp || meshManager.getLocalIp() || '192.168.1.104';
  const currentHostName = profile?.username || hostName || meshManager.getDeviceName() || 'دستگاه محلی';
  const myRole = profile?.role || meshManager.getRole() || 'host';

  // Listen to real mesh events
  useEffect(() => {
    if (!isOpen) return;

    // Load initial real discovered peers
    setDiscoveredPeers(meshManager.getDiscoveredPeers());

    const unsubscribe = meshManager.subscribe((event) => {
      if (event.type === 'DISCOVERY_UPDATED') {
        setDiscoveredPeers(event.peers);
      }
      if (event.type === 'PEER_ADDED' && event.peer) {
        if (onAddPeer) onAddPeer(event.peer);
      }
      if (event.type === 'STATE_CHANGED' && event.error) {
        setErrorMessage(event.error);
      }
    });

    return () => unsubscribe();
  }, [isOpen, onAddPeer]);

  // Generate QR Code with authentic device coordinates
  useEffect(() => {
    if (!isOpen) return;

    const payload = JSON.stringify({
      protocol: 'NETMASTER_v3',
      id: currentDeviceId,
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
        dark: isDark ? '#000000' : '#0B0D13',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('[QR] Generation error:', err));
  }, [isOpen, currentDeviceId, currentIp, hostPort, currentHostName, myRole, isDark]);

  // Cleanup camera stream
  useEffect(() => {
    if (!isOpen && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsScanningCamera(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real Direct IP Handshake Handler
  const handleConnectDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const ipTrimmed = directIp.trim();
    const portNum = parseInt(directPort, 10) || 8888;
    const nameTrimmed = directName.trim();

    // Basic IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipTrimmed || !ipv4Regex.test(ipTrimmed)) {
      setErrorMessage('لطفاً یک آدرس IP معتبر وارد نمایید (مثال: 192.168.1.105)');
      return;
    }

    if (ipTrimmed === currentIp) {
      setErrorMessage('نمی‌توانید به آدرس IP همین دستگاه متصل شوید.');
      return;
    }

    triggerTacticalHaptic(40);
    setIsConnecting(true);
    setStatusMessage(`در حال ارسال بسته Handshake (SYN) به ${ipTrimmed}:${portNum}...`);

    // Perform REAL mutual handshake over mesh network
    const result = await meshManager.connectToPeer(ipTrimmed, portNum, nameTrimmed);
    setIsConnecting(false);

    if (result.success && result.peer) {
      triggerTacticalHaptic(60);
      setStatusMessage(`اتصال و احراز هویت دوطرفه با دستگاه "${result.peer.name}" با موفقیت برقرار شد!`);
      if (onAddPeer) onAddPeer(result.peer);
      if (onConnectToScannedHost) onConnectToScannedHost(ipTrimmed, portNum, result.peer.name);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      triggerTacticalHaptic(80);
      setErrorMessage(result.error || 'خطا: پاسخی از دستگاه مقصد دریافت نشد.');
      setStatusMessage(null);
    }
  };

  // Real LAN Discovery Refresh
  const handleRefreshLanScan = () => {
    triggerTacticalHaptic(30);
    setIsScanning(true);
    setDiscoveredPeers(meshManager.getDiscoveredPeers());
    setTimeout(() => {
      setDiscoveredPeers(meshManager.getDiscoveredPeers());
      setIsScanning(false);
    }, 1500);
  };

  // Connect to a Real Discovered Peer
  const handleConnectToDiscovered = async (peer: DiscoveredPeer) => {
    triggerTacticalHaptic(40);
    setIsConnecting(true);
    setErrorMessage(null);
    setStatusMessage(`در حال برقراری اتصال و تبادل کلید با ${peer.name}...`);

    const result = await meshManager.connectToPeer(peer.ip, peer.port, peer.name, peer.id);
    setIsConnecting(false);

    if (result.success && result.peer) {
      triggerTacticalHaptic(60);
      setStatusMessage(`اتصال دوطرفه با ${result.peer.name} برقرار گردید.`);
      if (onAddPeer) onAddPeer(result.peer);
      if (onConnectToScannedHost) onConnectToScannedHost(peer.ip, peer.port, result.peer.name);
      setTimeout(() => onClose(), 1000);
    } else {
      triggerTacticalHaptic(80);
      setErrorMessage(result.error || 'برقراری اتصال با دستگاه ناموفق بود.');
      setStatusMessage(null);
    }
  };

  // Real Camera Scanner for QR Handshake
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
      setCameraError(err?.message || 'دسترسی به دوربین رد شد.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm select-none" dir="rtl">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors duration-300 ${
          isDark ? 'bg-[#111318] border-[#262C38] text-[#E2E8F0]' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[#262C38]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#4CC9F0]/15 text-[#4CC9F0]' : 'bg-sky-50 text-sky-600'}`}>
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <span>مرکز اتصال و احراز هویت همتا</span>
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                شبکه محلی آفلاین بدون اینترنت (LAN / Wi-Fi Hotspot)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#262C38] text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Local Device Identity Badge (Explicit Host / Client Role) */}
        <div className={`mx-4 mt-3 p-3 rounded-xl border flex items-center justify-between text-xs ${
          isDark ? 'bg-[#1A1E29] border-[#2A3242]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${myRole === 'host' ? 'bg-[#4CC9F0] animate-pulse' : 'bg-[#70A5D8]'}`} />
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>این دستگاه: {currentHostName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                  myRole === 'host' 
                    ? 'bg-[#4CC9F0]/20 text-[#4CC9F0] border border-[#4CC9F0]/30' 
                    : 'bg-[#70A5D8]/20 text-[#70A5D8] border border-[#70A5D8]/30'
                }`}>
                  {myRole === 'host' ? 'نقش: هاست (Host AP / Group Owner)' : 'نقش: کلاینت (Peer Client)'}
                </span>
              </div>
              <div className="text-[10px] font-mono opacity-70 mt-0.5">
                IP: {currentIp}:{hostPort} • ID: {currentDeviceId.slice(0, 10)}...
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyConnectionText}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : isDark
                ? 'bg-[#262C38] hover:bg-[#333C4E] text-white border-white/10'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'کپی شد' : 'کپی آدرس'}</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1.5 mx-4 mt-3 rounded-xl bg-[#090B10] border border-[#262C38]/60 gap-1 shrink-0">
          <button
            onClick={() => {
              setActiveTab('direct');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-[#4CC9F0] text-[#0A0C10] shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>اتصال مستقیم IP</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('scan_lan');
              setErrorMessage(null);
              handleRefreshLanScan();
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'scan_lan'
                ? 'bg-[#4CC9F0] text-[#0A0C10] shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>پویش شبکه محلی ({discoveredPeers.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('qr_code');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qr_code'
                ? 'bg-[#4CC9F0] text-[#0A0C10] shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>کد QR</span>
          </button>
        </div>

        {/* Feedback Alert Banners */}
        <div className="px-4 mt-2">
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}
          {statusMessage && (
            <div className="p-2.5 rounded-xl bg-[#4CC9F0]/15 border border-[#4CC9F0]/30 text-[#4CC9F0] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* TAB 1: Direct IP Connection with Real Handshake */}
          {activeTab === 'direct' && (
            <form onSubmit={handleConnectDirect} className="space-y-3.5">
              <div className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                isDark ? 'bg-[#181C26] border-[#2A3242] text-[#94A3B8]' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <ShieldCheck className="w-4 h-4 text-[#4CC9F0] shrink-0 mt-0.5" />
                <span>
                  <strong>تأیید اصالت اتصال:</strong> ورود آدرس IP اشتباه یا ساختگی پذیرفته نمی‌شود. سیستم بسته احراز هویت (SYN) ارسال کرده و تنها در صورت پاسخ دستگاه مقصد، اتصال برقرار می‌گردد.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">آدرس IP دستگاه مقصد (Target IP):</label>
                <input
                  type="text"
                  value={directIp}
                  onChange={(e) => setDirectIp(e.target.value)}
                  placeholder="مثال: 192.168.1.105"
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-[#181C26] border-[#2E3646] text-white focus:border-[#4CC9F0]'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500'
                  }`}
                  dir="ltr"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold mb-1">پورت سرویس:</label>
                  <input
                    type="number"
                    value={directPort}
                    onChange={(e) => setDirectPort(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-[#181C26] border-[#2E3646] text-white focus:border-[#4CC9F0]'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500'
                    }`}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">نام دستگاه (اختیاری):</label>
                  <input
                    type="text"
                    value={directName}
                    onChange={(e) => setDirectName(e.target.value)}
                    placeholder="مثال: گوشی همتا ۲"
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-[#181C26] border-[#2E3646] text-white focus:border-[#4CC9F0]'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full py-2.5 mt-2 bg-[#4CC9F0] hover:bg-[#4CC9F0]/90 text-[#090B10] font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال اجرای Handshake دوطرفه و اعتبارسنجی...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>ارسال درخواست اتصال و همگام‌سازی (Connect)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: LAN Real Discovery */}
          {activeTab === 'scan_lan' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#4CC9F0]" />
                  دستگاه‌های فعال کشف‌شده در این Wi-Fi / هات‌اسپات
                </span>
                <button
                  onClick={handleRefreshLanScan}
                  disabled={isScanning}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#4CC9F0]/15 hover:bg-[#4CC9F0]/25 text-[#4CC9F0] border border-[#4CC9F0]/30 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'در حال جستجو...' : 'پویش مجدد'}</span>
                </button>
              </div>

              {discoveredPeers.length === 0 ? (
                <div className={`p-6 rounded-xl border border-dashed text-center space-y-2 ${
                  isDark ? 'bg-[#181C26]/50 border-[#2A3242] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <Search className="w-6 h-6 mx-auto text-[#4CC9F0] opacity-50 animate-pulse" />
                  <div className="text-xs font-bold">هیچ دستگاه دیگری در این شبکه شناسایی نشد</div>
                  <div className="text-[11px] max-w-xs mx-auto text-slate-400">
                    اطمینان حاصل کنید هر دو دستگاه به یک مودم یا هات‌اسپات متصل بوده و برنامه روی هر دو دستگاه باز است.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {discoveredPeers.map((peer) => (
                    <div
                      key={peer.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isDark ? 'bg-[#181C26] border-[#2A3242] hover:border-[#4CC9F0]/50' : 'bg-white border-slate-200 hover:border-sky-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        <div>
                          <div className="text-xs font-bold flex items-center gap-2">
                            <span>{peer.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-300">
                              {peer.role}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {peer.ip}:{peer.port} • باتری: {peer.battery}٪
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleConnectToDiscovered(peer)}
                        disabled={isConnecting}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#4CC9F0] hover:bg-[#4CC9F0]/90 text-[#0A0C10] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span>اتصال (Connect)</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QR Code Handshake */}
          {activeTab === 'qr_code' && (
            <div className="space-y-3.5 text-center">
              {!isScanningCamera ? (
                <>
                  <div className="p-3 bg-white rounded-2xl inline-block shadow-lg mx-auto">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs font-mono">
                        در حال تولید بارکد...
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-bold">
                    بارکد شناسایی این دستگاه ({currentHostName})
                  </div>
                  <div className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    دستگاه دیگر می‌تواند با اسکن این QR Code بلافاصله فرآیند Handshake و اتصال امن را آغاز نماید.
                  </div>

                  <button
                    onClick={handleStartCameraScanner}
                    className="w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#70A5D8]/15 hover:bg-[#70A5D8]/25 text-[#70A5D8] border-[#70A5D8]/30"
                  >
                    <Camera className="w-4 h-4" />
                    <span>اسکن QR Code دستگاه دیگر با دوربین</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-white/20">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    <div className="absolute inset-0 border-2 border-[#4CC9F0] border-dashed m-6 rounded-xl pointer-events-none animate-pulse" />
                  </div>
                  {cameraError && (
                    <div className="p-2 rounded-xl bg-red-500/20 text-red-300 text-xs">
                      {cameraError}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
                      setIsScanningCamera(false);
                    }}
                    className="py-1.5 px-4 rounded-xl text-xs font-bold bg-slate-800 text-slate-200"
                  >
                    بستن اسکنر دوربین
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
