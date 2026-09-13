// systemPermissions.ts
// Robust Android Native Bridge and Web Runtime Permission Orchestrator
// Handles real Android hardware and system permission requests:
// 1. Microphone (RECORD_AUDIO) via Android Bridge / getUserMedia
// 2. Camera (CAMERA) via Android Bridge / getUserMedia
// 3. Notifications (POST_NOTIFICATIONS) via Android Bridge / Notification API
// 4. Storage (READ_MEDIA_* / READ_EXTERNAL_STORAGE) via Android Bridge / File System
// 5. Background Execution & WakeLock via Android Service / navigator.wakeLock

import { backgroundService } from './backgroundService';

export interface DevicePermissionStatus {
  microphone: 'granted' | 'denied' | 'prompt';
  camera: 'granted' | 'denied' | 'prompt';
  notification: 'granted' | 'denied' | 'prompt';
  storage: 'granted' | 'denied' | 'prompt';
  wakeLock: boolean;
}

export interface PermissionRequestResult {
  success: boolean;
  status: 'granted' | 'denied' | 'unsupported';
  error?: string;
}

// Global cached states that update reactively
const listeners = new Set<(status: DevicePermissionStatus) => void>();

export function subscribePermissionChanges(callback: (status: DevicePermissionStatus) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifySubscribers() {
  checkSystemPermissions().then((status) => {
    listeners.forEach((cb) => {
      try {
        cb(status);
      } catch {}
    });
  });
}

// Listen for Android Native Bridge permission callbacks
if (typeof window !== 'undefined') {
  window.addEventListener('androidPermissionChanged', () => {
    notifySubscribers();
  });
}

// Check current status of all hardware & system permissions
export async function checkSystemPermissions(): Promise<DevicePermissionStatus> {
  let microphone: 'granted' | 'denied' | 'prompt' = 'prompt';
  let camera: 'granted' | 'denied' | 'prompt' = 'prompt';
  let notification: 'granted' | 'denied' | 'prompt' = 'prompt';
  let storage: 'granted' | 'denied' | 'prompt' = 'prompt';

  const win = typeof window !== 'undefined' ? (window as any) : null;

  // 1. Check Android Native Bridge if running in Android APK wrapper
  if (win && win.AndroidPermissions) {
    try {
      if (typeof win.AndroidPermissions.getAllPermissionStates === 'function') {
        const raw = win.AndroidPermissions.getAllPermissionStates();
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed.microphone !== undefined) microphone = parsed.microphone ? 'granted' : 'prompt';
        if (parsed.camera !== undefined) camera = parsed.camera ? 'granted' : 'prompt';
        if (parsed.notification !== undefined) notification = parsed.notification ? 'granted' : 'prompt';
        if (parsed.storage !== undefined) storage = parsed.storage ? 'granted' : 'prompt';
      } else {
        if (typeof win.AndroidPermissions.hasMicrophonePermission === 'function') {
          microphone = win.AndroidPermissions.hasMicrophonePermission() ? 'granted' : 'prompt';
        }
        if (typeof win.AndroidPermissions.hasCameraPermission === 'function') {
          camera = win.AndroidPermissions.hasCameraPermission() ? 'granted' : 'prompt';
        }
        if (typeof win.AndroidPermissions.hasNotificationPermission === 'function') {
          notification = win.AndroidPermissions.hasNotificationPermission() ? 'granted' : 'prompt';
        }
        if (typeof win.AndroidPermissions.hasStoragePermission === 'function') {
          storage = win.AndroidPermissions.hasStoragePermission() ? 'granted' : 'prompt';
        }
      }
    } catch (e) {
      console.warn('Error reading AndroidPermissions bridge:', e);
    }
  }

  // 2. Query browser permissions API
  if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
    try {
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (micStatus) microphone = micStatus.state as any;
    } catch {}

    try {
      const camStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (camStatus) camera = camStatus.state as any;
    } catch {}

    try {
      const notifStatus = await navigator.permissions.query({ name: 'notifications' as PermissionName });
      if (notifStatus) notification = notifStatus.state as any;
    } catch {}
  }

  // 3. Fallback notification check
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') notification = 'granted';
    else if (Notification.permission === 'denied') notification = 'denied';
  }

  const wakeLock = backgroundService.isWakeLockActive();

  return {
    microphone,
    camera,
    notification,
    storage,
    wakeLock,
  };
}

// Request real microphone permission from Android device / browser
export async function requestMicrophonePermission(): Promise<PermissionRequestResult> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  // 1. Android Native Bridge Hook
  if (win && win.AndroidPermissions && typeof win.AndroidPermissions.requestMicrophone === 'function') {
    try {
      win.AndroidPermissions.requestMicrophone();
      // If native bridge already has permission
      if (win.AndroidPermissions.hasMicrophonePermission && win.AndroidPermissions.hasMicrophonePermission()) {
        notifySubscribers();
        return { success: true, status: 'granted' };
      }
    } catch (e) {
      console.warn('Native requestMicrophone failed:', e);
    }
  }

  // 2. Real Web / WebView getUserMedia trigger (brings up system permission dialog)
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        status: 'unsupported',
        error: 'سخت‌افزار ضبط صدا یا API رسانه در این دستگاه در دسترس نیست.',
      };
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    // Immediately release tracks so recording icon turns off until PTT is held
    stream.getTracks().forEach((track) => track.stop());
    notifySubscribers();
    return {
      success: true,
      status: 'granted',
    };
  } catch (err: any) {
    console.warn('Microphone permission rejected or unavailable:', err);
    const isDenied =
      err?.name === 'NotAllowedError' ||
      err?.name === 'PermissionDeniedError' ||
      err?.message?.includes('denied');
    return {
      success: false,
      status: isDenied ? 'denied' : 'unsupported',
      error: isDenied
        ? 'دسترسی میکروفون توسط کاربر یا تنظیمات دستگاه رد شد.'
        : err?.message || 'خطا در برقراری ارتباط با میکروفون دستگاه.',
    };
  }
}

// Request real camera permission from Android device / browser
export async function requestCameraPermission(): Promise<PermissionRequestResult> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  // 1. Android Native Bridge Hook
  if (win && win.AndroidPermissions && typeof win.AndroidPermissions.requestCamera === 'function') {
    try {
      win.AndroidPermissions.requestCamera();
      if (win.AndroidPermissions.hasCameraPermission && win.AndroidPermissions.hasCameraPermission()) {
        notifySubscribers();
        return { success: true, status: 'granted' };
      }
    } catch (e) {
      console.warn('Native requestCamera failed:', e);
    }
  }

  // 2. Real Web / WebView getUserMedia trigger
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        status: 'unsupported',
        error: 'سخت‌افزار دوربین در این دستگاه در دسترس نیست.',
      };
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
      },
    });
    stream.getTracks().forEach((track) => track.stop());
    notifySubscribers();
    return {
      success: true,
      status: 'granted',
    };
  } catch (err: any) {
    console.warn('Camera permission rejected or unavailable:', err);
    const isDenied =
      err?.name === 'NotAllowedError' ||
      err?.name === 'PermissionDeniedError' ||
      err?.message?.includes('denied');
    return {
      success: false,
      status: isDenied ? 'denied' : 'unsupported',
      error: isDenied
        ? 'دسترسی دوربین توسط کاربر یا تنظیمات دستگاه رد شد.'
        : err?.message || 'خطا در اتصال به سنسور دوربین دستگاه.',
    };
  }
}

// Request real notifications permission from Android device / browser
export async function requestNotificationPermission(): Promise<PermissionRequestResult> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  // 1. Android Native Bridge Hook
  if (win && win.AndroidPermissions && typeof win.AndroidPermissions.requestNotification === 'function') {
    try {
      win.AndroidPermissions.requestNotification();
      if (win.AndroidPermissions.hasNotificationPermission && win.AndroidPermissions.hasNotificationPermission()) {
        notifySubscribers();
        return { success: true, status: 'granted' };
      }
    } catch (e) {
      console.warn('Native requestNotification failed:', e);
    }
  }

  // 2. Real Web Notification API
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        success: false,
        status: 'unsupported',
        error: 'سرویس اعلان در این دستگاه در دسترس نیست.',
      };
    }

    if (Notification.permission === 'granted') {
      return { success: true, status: 'granted' };
    }

    const permission = await Notification.requestPermission();
    notifySubscribers();
    if (permission === 'granted') {
      return { success: true, status: 'granted' };
    } else {
      return {
        success: false,
        status: 'denied',
        error: 'دسترسی اعلان‌ها توسط کاربر یا سیستم رد شد.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      status: 'unsupported',
      error: err?.message || 'امکان ثبت درخواست اعلان وجود ندارد.',
    };
  }
}

// Request real storage access permission
export async function requestStoragePermission(): Promise<PermissionRequestResult> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  // 1. Android Native Bridge Hook
  if (win && win.AndroidPermissions && typeof win.AndroidPermissions.requestStorage === 'function') {
    try {
      win.AndroidPermissions.requestStorage();
      if (win.AndroidPermissions.hasStoragePermission && win.AndroidPermissions.hasStoragePermission()) {
        notifySubscribers();
        return { success: true, status: 'granted' };
      }
      return { success: false, status: 'denied' };
    } catch (e) {
      console.warn('Native requestStorage failed:', e);
    }
  }

  // 2. Web storage / File access API
  notifySubscribers();
  return { success: true, status: 'granted' };
}

// Request background execution and WakeLock
export async function requestBackgroundPermission(): Promise<{
  notificationGranted: boolean;
  wakeLockAcquired: boolean;
}> {
  let notificationGranted = false;
  let wakeLockAcquired = false;

  try {
    const notifRes = await requestNotificationPermission();
    notificationGranted = notifRes.success;
  } catch {}

  try {
    wakeLockAcquired = await backgroundService.acquireWakeLock();
  } catch {}

  return {
    notificationGranted,
    wakeLockAcquired,
  };
}

// Request all initial hardware permissions sequentially
export async function requestAllInitialPermissions(): Promise<{
  microphone: PermissionRequestResult;
  camera: PermissionRequestResult;
  notifications: PermissionRequestResult;
  storage: PermissionRequestResult;
  wakeLock: boolean;
}> {
  const win = typeof window !== 'undefined' ? (window as any) : null;
  if (win && win.AndroidPermissions && typeof win.AndroidPermissions.requestAllPermissions === 'function') {
    try {
      win.AndroidPermissions.requestAllPermissions();
    } catch {}
  }

  const microphone = await requestMicrophonePermission();
  const camera = await requestCameraPermission();
  const notifications = await requestNotificationPermission();
  const storage = await requestStoragePermission();
  const wakeLock = await backgroundService.acquireWakeLock();

  return {
    microphone,
    camera,
    notifications,
    storage,
    wakeLock,
  };
}
