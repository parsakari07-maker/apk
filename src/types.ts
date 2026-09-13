export type AppTab = 'radar' | 'walkie' | 'cctv' | 'chat' | 'screen' | 'settings';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface PeerDevice {
  id: string;
  name: string;
  ip: string;
  port?: number;
  battery: number;
  rssi: number; // dBm (-30 to -90)
  isOnline?: boolean;
  isTalking?: boolean;
  isSpeaking?: boolean;
  status?: 'online' | 'offline' | 'connecting' | 'connected' | 'reconnecting';
  isMutedByHost?: boolean;
  role: 'host' | 'client';
  cameraAvailable?: boolean;
  isStreamingCamera?: boolean;
  cameraFacing?: 'back' | 'front';
  torchActive?: boolean;
  streamFps?: number;
  lastSeen: number;
  // Radar & Compass
  angleDegree?: number; // 0 to 360 relative to host
  distanceMeters?: number; // estimated from RSSI
}

export interface UserProfile {
  username: string;
  role: 'host' | 'client';
  localIp: string;
  networkSsid: string;
  autoAcceptCctv: boolean;
  activeChannel: number;
  noiseSuppression: boolean;
  speakerModeOnly: boolean; // Host broadcast only (mute all others)
  theme: ThemeMode;
}

export interface CCTVStreamState {
  targetDeviceId: string | null;
  isExpanded: boolean;
  isApproved: boolean;
  isConnecting: boolean;
  resolution: '480p' | '720p' | '1080p';
  fps: number;
  latencyMs: number;
  torchOn: boolean;
  facingMode: 'user' | 'environment';
  zoomLevel: number;
  isStealthActive: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'host' | 'client';
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface SharedFile {
  id: string;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  type: 'apk' | 'image' | 'video' | 'document' | 'other';
  senderName: string;
  senderIp?: string;
  timestamp: number;
  downloadUrl?: string;
  progress?: number; // 0-100
  isDownloaded?: boolean;
}

export interface ScreenMirrorState {
  isBroadcasting: boolean;
  activeViewerCount: number;
  currentHostDevice: string | null;
  quality: '720p' | '1080p';
  fps: number;
  bitrateKbps: number;
}

export type CodeTabKey = 
  | 'manifest' 
  | 'gradle'
  | 'themeManager'
  | 'themeCompose'
  | 'settingsScreen'
  | 'backgroundService'
  | 'mainScreen' 
  | 'radarScreen'
  | 'walkieEngine'
  | 'walkieSound'
  | 'cctvStealth'
  | 'airDropEngine'
  | 'screenMirror'
  | 'qrUtils'
  | 'qrScanner'
  | 'pttButton'
  | 'githubWorkflow';

