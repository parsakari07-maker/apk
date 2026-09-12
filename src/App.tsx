import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio,
  Video,
  Network,
  Download,
  Share2,
  Settings,
  Info,
  CheckCircle2,
  Zap,
  Volume2,
  QrCode,
  FileCode,
  Cast,
  Cpu,
  Power,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { AppTab, PeerDevice, UserProfile, ChatMessage, SharedFile, ThemeMode } from './types';
import { TopSegmentedBar } from './components/TopSegmentedBar';
import { WalkieTalkieTab } from './components/WalkieTalkieTab';
import { CctvMonitorTab } from './components/CctvMonitorTab';
import { RadarCompassTab } from './components/RadarCompassTab';
import { LocalAirDropTab } from './components/LocalAirDropTab';
import { ScreenMirrorTab } from './components/ScreenMirrorTab';
import { SettingsScreenTab } from './components/SettingsScreenTab';
import { OnboardingModal } from './components/OnboardingModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { QRConnectionModal } from './components/QRConnectionModal';
import { ApkExportModal } from './components/ApkExportModal';
import { backgroundService } from './utils/backgroundService';
import { generatePythonSetupScript, generateBashSetupScript, triggerFileDownload } from './utils/projectGenerator';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('radar');

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
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('netmaster_user_profile');
  });
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Background execution service & WakeLock
  const [isBackgroundActive, setIsBackgroundActive] = useState(() => {
    return localStorage.getItem('netmaster_background_service_enabled') === 'true';
  });

  // Visibility listener for WakeLock re-acquisition
  useEffect(() => {
    const handleVis = () => {
      backgroundService.handleVisibilityChange();
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  // User Profile - Load from local storage or prompt via onboarding modal
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('netmaster_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall through to empty default
      }
    }
    return {
      username: '',
      role: 'client',
      localIp: '192.168.1.104',
      networkSsid: 'شبکه محلی (Wi-Fi Local)',
      autoAcceptCctv: true,
      activeChannel: 1,
      noiseSuppression: true,
      speakerModeOnly: false,
    };
  });

  const handleSaveProfile = async (updated: UserProfile, enableBgService: boolean = true) => {
    setProfile(updated);
    localStorage.setItem('netmaster_user_profile', JSON.stringify(updated));

    if (enableBgService) {
      try {
        await backgroundService.requestBackgroundPermissions();
        setIsBackgroundActive(true);
      } catch (e) {
        console.warn('Background permission request on onboarding failed:', e);
      }
    }
  };

  // Chat & File AirDrop State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);

  // Connected Peer Devices on Local Wi-Fi / Hotspot
  const [peers, setPeers] = useState<PeerDevice[]>([]);

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

  return (
    <div
      className={`min-h-screen h-screen flex flex-col font-sans selection:bg-[#4CC9F0]/20 selection:text-[#4CC9F0] overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#0B0D13] text-[#E2E8F0]' : 'bg-[#F1F5F9] text-[#0F172A]'
      }`}
      dir="rtl"
    >
      {/* Main Application Container */}
      <main className="flex-1 flex flex-col overflow-hidden p-2 sm:p-4 max-w-5xl w-full mx-auto min-h-0">
        <div
          className={`flex-1 flex flex-col rounded-2xl border shadow-xl overflow-hidden transition-colors duration-300 min-h-0 ${
            isDark ? 'bg-[#0E121A] border-[#222836]' : 'bg-white border-slate-200'
          }`}
        >
          {/* Top Segmented Navigation Bar */}
          <TopSegmentedBar
            currentTab={currentTab}
            onTabChange={(tab) => setCurrentTab(tab)}
            peerCount={peers.length}
            onOpenSettings={() => setCurrentTab('settings')}
            onOpenQR={() => setIsQRModalOpen(true)}
            onOpenApkGuide={() => setIsApkModalOpen(true)}
            onOpenArchitecture={() => setIsArchModalOpen(true)}
            networkSsid={profile.networkSsid}
            myRole={profile.role}
            isDark={isDark}
          />

          {/* Background Foreground Service Banner: Walkie active in background */}
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

          {/* Background Foreground Service Banner: Screen Mirror active */}
          {currentTab !== 'screen' && isScreenMirroring && (
            <div
              onClick={() => setCurrentTab('screen')}
              className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white text-xs px-3 py-1.5 flex items-center justify-between cursor-pointer border-b border-cyan-400/40 shadow-sm shrink-0 transition-all select-none"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
                <Cast className="w-3.5 h-3.5 animate-bounce" />
                <span className="font-bold text-[11px]">
                  پخش صفحه نمایش در پس‌زمینه فعال است (getDisplayMedia Active)
                </span>
              </div>
              <span className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full font-bold">
                مدیریت صفحه ←
              </span>
            </div>
          )}

          {/* Background Foreground Service Banner: CCTV active */}
          {currentTab !== 'cctv' && isCameraStreaming && (
            <div
              onClick={() => setCurrentTab('cctv')}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs px-3 py-1.5 flex items-center justify-between cursor-pointer border-b border-emerald-400/40 shadow-sm shrink-0 transition-all select-none"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                <Video className="w-3.5 h-3.5 animate-pulse" />
                <span className="font-bold text-[11px]">
                  دوربین در پس‌زمینه در حال پخش است (getUserMedia Active)
                </span>
              </div>
              <span className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full font-bold">
                مدیریت دوربین ←
              </span>
            </div>
          )}

          {/* Tabs Content - Mounted persistently so audio/video/streams stay active across tab changes */}
          <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
            {/* Tab 1: Radar Compass */}
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

            {/* Tab 2: Walkie Talkie */}
            <div className={`flex-1 flex flex-col h-full overflow-y-auto ${currentTab === 'walkie' ? '' : 'hidden'}`}>
              <WalkieTalkieTab
                peers={peers}
                profile={profile}
                activeSpeakerId={activeSpeakerId}
                onSetActiveSpeaker={(id) => setActiveSpeakerId(id)}
                onAddCustomPeer={(peer) => setPeers((prev) => [peer, ...prev])}
                onClearPeers={() => setPeers([])}
              />
            </div>

            {/* Tab 3: CCTV Monitor Tab */}
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

            {/* Tab 4: Local AirDrop Chat & File Sharing */}
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
                      senderName: profile.username || 'من',
                      senderRole: profile.role,
                      text,
                      timestamp: Date.now(),
                    },
                  ]);
                }}
                onShareFile={(sharedFile) => {
                  setFiles((prev) => [sharedFile, ...prev]);
                }}
              />
            </div>

            {/* Tab 5: Screen Mirroring Tab */}
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

            {/* Tab 6: Settings Tab */}
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
      </main>

      {/* Onboarding & Identity Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        profile={profile}
        onSaveProfile={handleSaveProfile}
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
                name: `${name} (اتصال QR)`,
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
      />
    </div>
  );
}
