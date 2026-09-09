import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio,
  Video,
  Code2,
  Smartphone,
  Network,
  Download,
  Share2,
  Settings,
  Sparkles,
  Info,
  Maximize2,
  CheckCircle2,
  Zap,
  Volume2,
  QrCode,
  FileCode,
  Cast
} from 'lucide-react';
import { AppTab, PeerDevice, UserProfile, CodeTabKey, ChatMessage, SharedFile, ThemeMode } from './types';
import { AndroidFrame } from './components/AndroidFrame';
import { TopSegmentedBar } from './components/TopSegmentedBar';
import { WalkieTalkieTab } from './components/WalkieTalkieTab';
import { CctvMonitorTab } from './components/CctvMonitorTab';
import { RadarCompassTab } from './components/RadarCompassTab';
import { LocalAirDropTab } from './components/LocalAirDropTab';
import { ScreenMirrorTab } from './components/ScreenMirrorTab';
import { SettingsScreenTab } from './components/SettingsScreenTab';
import { OnboardingModal } from './components/OnboardingModal';
import { CodeInspector } from './components/CodeInspector';
import { ArchitectureModal } from './components/ArchitectureModal';
import { QRConnectionModal } from './components/QRConnectionModal';
import { ApkExportModal } from './components/ApkExportModal';
import { ANDROID_FILES } from './data/sourceCode';
import { generatePythonSetupScript, generateBashSetupScript, triggerFileDownload } from './utils/projectGenerator';

export default function App() {
  // Navigation & View Mode: 'simulator' (Live Android UI) vs 'code' (Kotlin Source Inspector)
  const [viewMode, setViewMode] = useState<'simulator' | 'code'>('simulator');
  const [currentTab, setCurrentTab] = useState<AppTab>('radar');
  const [isPhoneFrameExpanded, setIsPhoneFrameExpanded] = useState(false);
  const [selectedCodeTab, setSelectedCodeTab] = useState<CodeTabKey>('walkieSound');

  // Dynamic Theming: Jetpack DataStore equivalent local state
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('netmaster_theme_mode') as ThemeMode) || 'dark';
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    return typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('netmaster_theme_mode', mode);
  };

  const isDark = themeMode === 'system' ? systemIsDark : themeMode === 'dark';

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // User Profile
  const [profile, setProfile] = useState<UserProfile>({
    username: 'پارسا',
    role: 'client',
    localIp: '192.168.1.104',
    networkSsid: 'کارگاه مرکزی (Wi-Fi Local)',
    autoAcceptCctv: true,
    activeChannel: 1,
    noiseSuppression: true,
    speakerModeOnly: false,
  });

  // Chat & File AirDrop State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      senderId: 'peer-1',
      senderName: 'رضا',
      senderRole: 'host',
      text: 'ارتباط شبکه محلی برقرار است.',
      timestamp: Date.now() - 60000,
    },
    {
      id: 'm2',
      senderId: 'me',
      senderName: 'پارسا',
      senderRole: 'client',
      text: 'تست دریافت پیام و ارتباط.',
      timestamp: Date.now() - 30000,
    },
  ]);

  const [files, setFiles] = useState<SharedFile[]>([
    {
      id: 'f1',
      name: 'NetMaster_v2.apk',
      sizeBytes: 15200000,
      sizeFormatted: '14.5 MB',
      type: 'apk',
      senderName: 'رضا',
      timestamp: Date.now() - 120000,
    },
  ]);

  const SAMPLE_PEERS: PeerDevice[] = [
    {
      id: 'peer-1',
      name: 'رضا (سرپرست کارگاه)',
      ip: '192.168.1.102',
      port: 8080,
      battery: 88,
      rssi: -45,
      isOnline: true,
      isTalking: false,
      role: 'host',
      cameraAvailable: true,
      isStreamingCamera: false,
      cameraFacing: 'back',
      torchActive: false,
      streamFps: 25,
      lastSeen: Date.now(),
    },
    {
      id: 'peer-2',
      name: 'سارا (اتاق مانیتورینگ)',
      ip: '192.168.1.105',
      port: 8080,
      battery: 74,
      rssi: -58,
      isOnline: true,
      isTalking: false,
      role: 'client',
      cameraAvailable: true,
      isStreamingCamera: false,
      cameraFacing: 'front',
      torchActive: false,
      streamFps: 25,
      lastSeen: Date.now(),
    },
    {
      id: 'peer-3',
      name: 'علی (حراست ورود)',
      ip: '192.168.1.110',
      port: 8080,
      battery: 95,
      rssi: -62,
      isOnline: true,
      isTalking: false,
      role: 'client',
      cameraAvailable: true,
      isStreamingCamera: false,
      cameraFacing: 'back',
      torchActive: false,
      streamFps: 25,
      lastSeen: Date.now(),
    },
  ];

  // Connected Peer Devices on Local Wi-Fi / Hotspot
  const [peers, setPeers] = useState<PeerDevice[]>(SAMPLE_PEERS);

  // Active voice speaker
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  // Background Screen Mirroring active state
  const [isScreenMirroring, setIsScreenMirroring] = useState(false);

  // Background Camera (CCTV) active state
  const [isCameraStreaming, setIsCameraStreaming] = useState(false);

  // Download automated project generator script
  const handleDownloadPythonScript = () => {
    const script = generatePythonSetupScript();
    triggerFileDownload('setup_netmaster_project.py', script, 'text/x-python;charset=utf-8');
  };

  const handleDownloadBashScript = () => {
    const script = generateBashSetupScript();
    triggerFileDownload('setup_project.sh', script, 'application/x-sh;charset=utf-8');
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-[#4CC9F0]/20 selection:text-[#4CC9F0] overflow-x-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#111318] text-[#E2E8F0]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
      dir="rtl"
    >
      {/* Global Header Bar */}
      <header
        className={`h-16 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 z-40 sticky top-0 shadow-md transition-colors duration-300 ${
          isDark
            ? 'bg-[#1B1F28] border-[#262C38]'
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Left / Brand info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#70A5D8] to-[#4CC9F0] p-0.5 flex items-center justify-center shadow-lg shadow-[#4CC9F0]/15">
            <div
              className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                isDark ? 'bg-[#1B1F28]' : 'bg-white'
              }`}
            >
              <Radio className="w-5 h-5 text-[#4CC9F0]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-base font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                NetMaster Suite
              </h1>
              <span className="hidden sm:inline-block text-[10px] bg-[#4CC9F0]/15 text-[#4CC9F0] border border-[#4CC9F0]/30 px-2 py-0.5 rounded-full font-mono font-bold">
                OFFLINE MESH LAN
              </span>
            </div>
          </div>
        </div>

        {/* Center / View Mode Switcher */}
        <div
          className={`flex items-center p-1 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#111318] border-[#262C38]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setViewMode('simulator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              viewMode === 'simulator'
                ? 'bg-[#4CC9F0] text-[#111318] font-bold shadow-md shadow-[#4CC9F0]/20'
                : isDark ? 'text-[#94A3B8] hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>شبیه‌ساز</span>
          </button>

          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              viewMode === 'code'
                ? 'bg-[#70A5D8] text-[#111318] font-bold shadow-md shadow-[#70A5D8]/20'
                : isDark ? 'text-[#94A3B8] hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>کدها</span>
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQRModalOpen(true)}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border transition-colors font-medium ${
              isDark
                ? 'bg-[#111318] hover:bg-[#262C38] text-[#4CC9F0] border-[#262C38]'
                : 'bg-white hover:bg-slate-50 text-sky-700 border-slate-200'
            }`}
            title="تولید و اسکن QR Code اتصال شبکه محلی"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">اتصال QR</span>
          </button>

          <button
            onClick={() => setIsArchModalOpen(true)}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border transition-colors ${
              isDark
                ? 'bg-[#111318] hover:bg-[#262C38] text-[#94A3B8] hover:text-white border-[#262C38]'
                : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
            title="مشاهده مستندات معماری آفلاین"
          >
            <Network className="w-3.5 h-3.5 text-[#70A5D8]" />
            <span className="hidden md:inline">معماری سیستم</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border transition-colors ${
              currentTab === 'settings'
                ? 'bg-[#4CC9F0] text-[#111318] font-bold border-[#4CC9F0]'
                : isDark
                ? 'bg-[#111318] hover:bg-[#262C38] text-[#94A3B8] hover:text-white border-[#262C38]'
                : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
            title="تنظیمات سیستم"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden md:inline">تنظیمات</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 flex flex-col items-center justify-center relative">
        <AnimatePresence mode="wait">
          {viewMode === 'simulator' ? (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col items-center justify-center my-auto"
            >
              <AndroidFrame
                isExpanded={isPhoneFrameExpanded}
                onToggleExpand={() => setIsPhoneFrameExpanded(!isPhoneFrameExpanded)}
                networkSsid={profile.networkSsid}
                isDark={isDark}
              >
                {/* App Content inside Android Frame */}
                <div
                  className={`flex-1 flex flex-col h-full transition-colors duration-300 ${
                    isDark ? 'bg-[#07090E] text-white' : 'bg-[#F4F6F9] text-[#111827]'
                  }`}
                >
                  {/* Top Segmented Navigation: [ 📷 دوربین مداربسته | 🎙️ بیسیم محلی | ⚙️ تنظیمات ] */}
                  <TopSegmentedBar
                    currentTab={currentTab}
                    onTabChange={(tab) => setCurrentTab(tab)}
                    peerCount={peers.length}
                    onOpenSettings={() => setCurrentTab('settings')}
                    onOpenQR={() => setIsQRModalOpen(true)}
                    onOpenApkGuide={() => setIsApkModalOpen(true)}
                    networkSsid={profile.networkSsid}
                    myRole={profile.role}
                    isDark={isDark}
                  />

                  {/* Background Foreground Service Banner: Shows when Walkie or Screen Mirror is active in background */}
                  {currentTab !== 'walkie' && activeSpeakerId && (
                    <div
                      onClick={() => setCurrentTab('walkie')}
                      className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs px-3 py-1.5 flex items-center justify-between cursor-pointer border-b border-emerald-400/40 shadow-sm shrink-0 transition-all select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                        <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                        <span className="font-bold text-[11px]">
                          بیسیم در پس‌زمینه: {activeSpeakerId === 'me' ? profile.username : (peers.find((p) => p.id === activeSpeakerId)?.name || 'همکار')} در حال مکالمه...
                        </span>
                      </div>
                      <span className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full font-bold">
                        ورود به بیسیم ←
                      </span>
                    </div>
                  )}

                  {currentTab !== 'screen' && isScreenMirroring && (
                    <div
                      onClick={() => setCurrentTab('screen')}
                      className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white text-xs px-3 py-1.5 flex items-center justify-between cursor-pointer border-b border-cyan-400/40 shadow-sm shrink-0 transition-all select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
                        <Cast className="w-3.5 h-3.5 animate-bounce" />
                        <span className="font-bold text-[11px]">
                          اشتراک صفحه در پس‌زمینه فعال است (MediaProjection Active • 60FPS)
                        </span>
                      </div>
                      <span className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full font-bold">
                        مدیریت صفحه ←
                      </span>
                    </div>
                  )}

                  {currentTab !== 'cctv' && isCameraStreaming && (
                    <div
                      onClick={() => setCurrentTab('cctv')}
                      className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs px-3 py-1.5 flex items-center justify-between cursor-pointer border-b border-emerald-400/40 shadow-sm shrink-0 transition-all select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                        <Video className="w-3.5 h-3.5 animate-pulse" />
                        <span className="font-bold text-[11px]">
                          دوربین مداربسته در پس‌زمینه در حال پخش است (CameraX Active • FHD)
                        </span>
                      </div>
                      <span className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full font-bold">
                        مدیریت دوربین ←
                      </span>
                    </div>
                  )}

                  {/* Tabs Content - Mounted persistently for background audio & screen sharing */}
                  <div className="flex-1 flex flex-col overflow-hidden relative">
                    <div className={`flex-1 flex flex-col h-full overflow-y-auto ${currentTab === 'radar' ? '' : 'hidden'}`}>
                      <RadarCompassTab
                        peers={peers}
                        profile={profile}
                        onKickPeer={(id) => setPeers((prev) => prev.filter((p) => p.id !== id))}
                        onToggleMutePeer={(id) =>
                          setPeers((prev) =>
                            prev.map((p) => (p.id === id ? { ...p, isMutedByHost: !p.isMutedByHost } : p))
                          )
                        }
                        onToggleSpeakerMode={() =>
                          setProfile((prev) => ({ ...prev, speakerModeOnly: !prev.speakerModeOnly }))
                        }
                        isDark={isDark}
                      />
                    </div>

                    <div className={`flex-1 flex flex-col h-full overflow-y-auto ${currentTab === 'walkie' ? '' : 'hidden'}`}>
                      <WalkieTalkieTab
                        peers={peers}
                        profile={profile}
                        activeSpeakerId={activeSpeakerId}
                        onSetActiveSpeaker={(id) => setActiveSpeakerId(id)}
                        onAddCustomPeer={(peer) => setPeers((prev) => [peer, ...prev])}
                        onClearPeers={() => setPeers([])}
                        onResetSamplePeers={() => setPeers(SAMPLE_PEERS)}
                      />
                    </div>

                    <div className={`flex-1 flex flex-col h-full overflow-y-auto ${currentTab === 'cctv' ? '' : 'hidden'}`}>
                      <CctvMonitorTab
                        peers={peers}
                        profile={profile}
                        isDark={isDark}
                        isStreaming={isCameraStreaming}
                        onToggleStreaming={() => setIsCameraStreaming((prev) => !prev)}
                        onNavigateTab={(tab) => setCurrentTab(tab)}
                        onToggleAutoAccept={() =>
                          setProfile((prev) => ({
                            ...prev,
                            autoAcceptCctv: !prev.autoAcceptCctv,
                          }))
                        }
                      />
                    </div>

                    <div className={`flex-1 flex flex-col h-full overflow-y-auto ${currentTab === 'chat' ? '' : 'hidden'}`}>
                      <LocalAirDropTab
                        profile={profile}
                        messages={messages}
                        files={files}
                        onSendMessage={(text) => {
                          setMessages((prev) => [
                            ...prev,
                            {
                              id: `msg-${Date.now()}`,
                              senderId: 'me',
                              senderName: profile.username,
                              senderRole: profile.role,
                              text,
                              timestamp: Date.now(),
                            },
                          ]);
                        }}
                        onSendFile={(name, sizeBytes, type) => {
                          const sizeFormatted = (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB';
                          setFiles((prev) => [
                            {
                              id: `file-${Date.now()}`,
                              name,
                              sizeBytes,
                              sizeFormatted,
                              type,
                              senderName: profile.username,
                              timestamp: Date.now(),
                            },
                            ...prev,
                          ]);
                        }}
                      />
                    </div>

                    <div className={`flex-1 flex flex-col h-full overflow-y-auto ${currentTab === 'screen' ? '' : 'hidden'}`}>
                      <ScreenMirrorTab
                        peers={peers}
                        profile={profile}
                        isDark={isDark}
                        isMirroring={isScreenMirroring}
                        onToggleMirroring={() => setIsScreenMirroring((prev) => !prev)}
                        onNavigateTab={(tab) => setCurrentTab(tab)}
                      />
                    </div>

                    <div className={`flex-1 flex flex-col h-full overflow-y-auto ${currentTab === 'settings' ? '' : 'hidden'}`}>
                      <SettingsScreenTab
                        profile={profile}
                        currentTheme={themeMode}
                        onThemeChange={handleThemeChange}
                        onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
                        onOpenArchitecture={() => setIsArchModalOpen(true)}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>
              </AndroidFrame>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-5xl h-[780px] flex flex-col"
            >
              <CodeInspector initialTab={selectedCodeTab} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Onboarding & Identity Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        profile={profile}
        onSaveProfile={(updated) => setProfile(updated)}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Architecture Deep-Dive Modal */}
      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

      {/* QR Code Quick Connect Modal */}
      <QRConnectionModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        profile={profile}
        hostIp={profile.localIp}
        hostPort={8888}
        hostName={profile.username}
        onAddPeerFromQR={(newPeer) => {
          setPeers((prev) => {
            const exists = prev.some((p) => p.ip === newPeer.ip);
            if (exists) return prev;
            return [newPeer, ...prev];
          });
        }}
        onConnectToScannedHost={(ip, port, name) => {
          setPeers((prev) => {
            const exists = prev.some((p) => p.ip === ip);
            if (exists) return prev;
            return [
              {
                id: `peer-scanned-${Date.now()}`,
                name: `${name} (اسکن QR)`,
                ip,
                port,
                battery: 88,
                rssi: -50,
                isOnline: true,
                isTalking: false,
                role: 'host',
                cameraAvailable: true,
                isStreamingCamera: false,
                cameraFacing: 'back',
                torchActive: false,
                streamFps: 25,
                lastSeen: Date.now(),
              },
              ...prev,
            ];
          });
        }}
      />

      {/* Direct APK Build & Install Guide Modal */}
      <ApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        onDownloadZip={handleDownloadPythonScript}
        onViewGithubWorkflow={() => {
          setSelectedCodeTab('githubWorkflow');
          setViewMode('code');
        }}
      />
    </div>
  );
}
