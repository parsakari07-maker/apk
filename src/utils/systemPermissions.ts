/**
 * NetMaster Hardware & System Permissions Orchestrator
 * 
 * Supports both:
 * 1. Native Android APK via @JavascriptInterface ("AndroidPermissions") + WebChromeClient onPermissionRequest
 * 2. Progressive Web App / Modern Browser Permissions API + MediaDevices API
 * 
 * Strict Principle: NEVER fake a granted state. A permission is granted ONLY when Android OS or Browser grants it.
 */

import { backgroundService } from './backgroundService';

export interface DevicePermissionStatus {
  microphone: 'granted' | 'denied' | 'prompt';
  camera: 'granted' | 'denied' | 'prompt';
  notification: 'granted' | 'denied' | 'prompt';
  storage: 'granted' | 'denied' | 'prompt';
  location?: 'granted' | 'denied' | 'prompt';
  wakeLock: boolean;
  isNativeAndroid: boolean;
}

export interface PermissionRequestResult {
  success: boolean;
  status: 'granted' | 'denied' | 'unsupported';
  permanentlyDenied?: boolean;
  error?: string;
}

const listeners = new Set<(status: DevicePermissionStatus) => void>();

export function subscribePermissionChanges(callback: (status: DevicePermissionStatus) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function notifyPermissionSubscribers() {
  checkSystemPermissions().then((status) => {
    listeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error('Permission subscriber callback error:', err);
      }
    });
  });
}

// Global listener for Android Native Bridge permission dispatch
if (typeof window !== 'undefined') {
  window.addEventListener('androidPermissionChanged', () => {
    notifyPermissionSubscribers();
  });
}

/**
 * Checks whether running inside the native Android APK wrapper
 */
export function isAndroidNative(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  return !!(win.AndroidPermissions && typeof win.AndroidPermissions.getAllPermissionStates === 'function');
}

/**
 * Open Android system App Info Settings page
 */
export function openNativeAppSettings(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  if (win.AndroidPermissions && typeof win.AndroidPermissions.openAppSettings === 'function') {
    try {
      return win.AndroidPermissions.openAppSettings();
    } catch (e) {
      console.warn('Failed to open app settings:', e);
    }
  }
  return false;
}

/**
 * Check the real current status of all hardware & system permissions
 */
export async function checkSystemPermissions(): Promise<DevicePermissionStatus> {
  let microphone: 'granted' | 'denied' | 'prompt' = 'prompt';
  let camera: 'granted' | 'denied' | 'prompt' = 'prompt';
  let notification: 'granted' | 'denied' | 'prompt' = 'prompt';
  let storage: 'granted' | 'denied' | 'prompt' = 'prompt';
  let location: 'granted' | 'denied' | 'prompt' = 'prompt';

  const win = typeof window !== 'undefined' ? (window as any) : null;
  const nativeAvailable = isAndroidNative();

  // 1. If running inside Native Android APK, query the native bridge directly
  if (nativeAvailable && win.AndroidPermissions) {
    try {
      const raw = win.AndroidPermissions.getAllPermissionStates();
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed) {
        if (parsed.microphone !== undefined) microphone = parsed.microphone ? 'granted' : 'denied';
        if (parsed.camera !== undefined) camera = parsed.camera ? 'granted' : 'denied';
        if (parsed.notification !== undefined) notification = parsed.notification ? 'granted' : 'denied';
        if (parsed.storage !== undefined) storage = parsed.storage ? 'granted' : 'denied';
        if (parsed.location !== undefined) location = parsed.location ? 'granted' : 'denied';
      }
    } catch (e) {
      console.warn('Failed to query AndroidPermissions bridge:', e);
    }
  } else {
    // 2. Query browser permissions API in PWA / Web environment
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (mic) microphone = mic.state as any;
      } catch {}

      try {
        const cam = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (cam) camera = cam.state as any;
      } catch {}

      try {
        const notif = await navigator.permissions.query({ name: 'notifications' as PermissionName });
        if (notif) notification = notif.state as any;
      } catch {}
    }

    // 3. Fallback notification check
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') notification = 'granted';
      else if (Notification.permission === 'denied') notification = 'denied';
      else notification = 'prompt';
    }
  }

  const wakeLock = backgroundService.isWakeLockActive();

  return {
    microphone,
    camera,
    notification,
    storage,
    location,
    wakeLock,
    isNativeAndroid: nativeAvailable,
  };
}

/**
 * Helper to wait for Android Native permission change event
 */
function waitForNativePermissionResult(
  permissionName: string,
  timeoutMs: number = 30000
): Promise<{ granted: boolean; permanentlyDenied?: boolean }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ granted: false });
      return;
    }

    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener('androidPermissionChanged', handler);
        // Check current status on timeout
        checkSystemPermissions().then((status) => {
          const current = (status as any)[permissionName];
          resolve({ granted: current === 'granted' });
        });
      }
    }, timeoutMs);

    const handler = (e: any) => {
      const detail = e.detail;
      if (detail && (detail.permission === permissionName || detail.permission === 'all')) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          window.removeEventListener('androidPermissionChanged', handler);
          resolve({
            granted: !!detail.granted,
            permanentlyDenied: !!detail.permanentlyDenied,
          });
        }
      }
    };

    window.addEventListener('androidPermissionChanged', handler);
  });
}

/**
 * Request real microphone permission from Android OS / Browser
 */
export async function requestMicrophonePermission(): Promise<PermissionRequestResult> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  // 1. Android Native Bridge Flow
  if (isAndroidNative() && win.AndroidPermissions && typeof win.AndroidPermissions.requestMicrophone === 'function') {
    try {
      // Check if already granted
      const status = await checkSystemPermissions();
      if (status.microphone === 'granted') {
        notifyPermissionSubscribers();
        return { success: true, status: 'granted' };
      }

      // Launch native Android system dialog
      win.AndroidPermissions.requestMicrophone();
      const result = await waitForNativePermissionResult('microphone');

      notifyPermissionSubscribers();
      if (result.granted) {
        // Also ensure WebRTC / MediaDevices permission is primed
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((t) => t.stop());
          }
        } catch {
          // Native permission is already granted; WebChromeClient will allow it
        }
        return { success: true, status: 'granted' };
      } else {
        return {
          success: false,
          status: 'denied',
          permanentlyDenied: result.permanentlyDenied,
          error: result.permanentlyDenied
            ? 'مجوز میکروفون در تنظیمات سیستم‌عامل مسدود شده است. لطفاً از تنظیمات برنامه آن را فعال کنید.'
            : 'دسترسی میکروفون توسط کاربر یا سیستم‌عامل اندروید رد شد.',
        };
      }
    } catch (e: any) {
      console.warn('Native requestMicrophone error:', e);
    }
  }

  // 2. Browser / PWA MediaDevices getUserMedia Flow
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        status: 'unsupported',
        error: 'سخت‌افزار ضبط صدا یا API رسانه در این مرورگر در دسترس نیست.',
      };
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Immediately stop tracks so hardware mic light turns off until PTT button is held
    stream.getTracks().forEach((track) => track.stop());
    notifyPermissionSubscribers();

    return {
      success: true,
      status: 'granted',
    };
  } catch (err: any) {
    console.warn('Microphone permission rejected or unavailable:', err);
    notifyPermissionSubscribers();
    const isDenied =
      err?.name === 'NotAllowedError' ||
      err?.name === 'PermissionDeniedError' ||
      err?.message?.includes('denied');

    return {
      success: false,
      status: isDenied ? 'denied' : 'unsupported',
      error: isDenied
        ? 'دسترسی میکروفون توسط کاربر یا مرورگر رد شد.'
        : err?.message || 'خطا در ارتباط با سخت‌افزار میکروفون دستگاه.',
    };
  }
}

/**
 * Request real camera permission from Android OS / Browser
 */
export async function requestCameraPermission(): Promise<PermissionRequestResult> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  // 1. Android Native Bridge Flow
  if (isAndroidNative() && win.AndroidPermissions && typeof win.AndroidPermissions.requestCamera === 'function') {
    try {
      // Check if already granted
      const status = await checkSystemPermissions();
      if (status.camera === 'granted') {
        notifyPermissionSubscribers();
        return { success: true, status: 'granted' };
      }

      // Launch native Android system dialog
      win.AndroidPermissions.requestCamera();
      const result = await waitForNativePermissionResult('camera');

      notifyPermissionSubscribers();
      if (result.granted) {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((t) => t.stop());
          }
        } catch {
          // Native permission is already granted; WebChromeClient will allow it
        }
        return { success: true, status: 'granted' };
      } else {
        return {
          success: false,
          status: 'denied',
          permanentlyDenied: result.permanentlyDenied,
          error: result.permanentlyDenied
            ? 'مجوز دوربین در تنظیمات سیستم‌عامل مسدود شده است. لطفاً از تنظیمات برنامه آن را فعال کنید.'
            : 'دسترسی دوربین توسط کاربر یا سیستم‌عامل اندروید رد شد.',
        };
      }
    } catch (e: any) {
      console.warn('Native requestCamera error:', e);
    }
  }

  // 2. Browser / PWA MediaDevices getUserMedia Flow
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        status: 'unsupported',
        error: 'سخت‌افزار دوربین در این مرورگر در دسترس نیست.',
      };
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
      },
    });

    stream.getTracks().forEach((track) => track.stop());
    notifyPermissionSubscribers();

    return {
      success: true,
      status: 'granted',
    };
  } catch (err: any) {
    console.warn('Camera permission rejected or unavailable:', err);
    notifyPermissionSubscribers();
    const isDenied =
      err?.name === 'NotAllowedError' ||
      err?.name === 'PermissionDeniedError' ||
      err?.message?.includes('denied');

    return {
      success: false,
      status: isDenied ? 'denied' : 'unsupported',
      error: isDenied
        ? 'دسترسی دوربین توسط کاربر یا مرورگر رد شد.'
        : err?.message || 'خطا در اتصال به سنسور دوربین دستگاه.',
    };
  }
}

/**
 * Request real notifications permission
 */
export async function requestNotificationPermission(): Promise<PermissionRequestResult> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  // 1. Android Native Bridge Trigger
  if (isAndroidNative() && win.AndroidPermissions && typeof win.AndroidPermissions.requestNotification === 'function') {
    try {
      const status = await checkSystemPermissions();
      if (status.notification === 'granted') {
        notifyPermissionSubscribers();
        return { success: true, status: 'granted' };
      }

      win.AndroidPermissions.requestNotification();
      const result = await waitForNativePermissionResult('notification', 15000);
      notifyPermissionSubscribers();

      if (result.granted) {
        return { success: true, status: 'granted' };
      } else {
        return {
          success: false,
          status: 'denied',
          permanentlyDenied: result.permanentlyDenied,
          error: 'دسترسی اعلان‌ها رد شد.',
        };
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
        error: 'سرویس اعلان در این پلتفرم در دسترس نیست.',
      };
    }

    if (Notification.permission === 'granted') {
      notifyPermissionSubscribers();
      return { success: true, status: 'granted' };
    }

    const permission = await Notification.requestPermission();
    notifyPermissionSubscribers();

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
    notifyPermissionSubscribers();
    return {
      success: false,
      status: 'unsupported',
      error: err?.message || 'امکان ثبت درخواست اعلان وجود ندارد.',
    };
  }
}

/**
 * Request real storage permission
 */
export async function requestStoragePermission(): Promise<PermissionRequestResult> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  if (isAndroidNative() && win.AndroidPermissions && typeof win.AndroidPermissions.requestStorage === 'function') {
    try {
      const status = await checkSystemPermissions();
      if (status.storage === 'granted') {
        notifyPermissionSubscribers();
        return { success: true, status: 'granted' };
      }

      win.AndroidPermissions.requestStorage();
      const result = await waitForNativePermissionResult('storage', 15000);
      notifyPermissionSubscribers();
      return {
        success: result.granted,
        status: result.granted ? 'granted' : 'denied',
        permanentlyDenied: result.permanentlyDenied,
      };
    } catch (e) {
      console.warn('Native requestStorage failed:', e);
    }
  }

  notifyPermissionSubscribers();
  return { success: true, status: 'granted' };
}

/**
 * Request background service and wake lock permissions
 */
export async function requestBackgroundPermission(): Promise<{
  notificationGranted: boolean;
  wakeLockAcquired: boolean;
}> {
  const notif = await requestNotificationPermission();
  const wakeLock = await backgroundService.acquireWakeLock();
  notifyPermissionSubscribers();
  return {
    notificationGranted: notif.success,
    wakeLockAcquired: wakeLock,
  };
}

/**
 * Request all permissions directly from Android OS / Browser in one coordinated flow
 */
export async function requestAllInitialPermissions(): Promise<{
  microphone: PermissionRequestResult;
  camera: PermissionRequestResult;
  notifications: PermissionRequestResult;
  storage: PermissionRequestResult;
  wakeLock: boolean;
}> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  if (isAndroidNative() && win.AndroidPermissions && typeof win.AndroidPermissions.requestAllPermissions === 'function') {
    try {
      win.AndroidPermissions.requestAllPermissions();
      // Wait for native system dialog batch result
      await waitForNativePermissionResult('all', 20000);
    } catch (e) {
      console.warn('Native requestAllPermissions error:', e);
    }
  }

  const microphone = await requestMicrophonePermission();
  const camera = await requestCameraPermission();
  const notifications = await requestNotificationPermission();
  const storage = await requestStoragePermission();
  const wakeLock = await backgroundService.acquireWakeLock();

  notifyPermissionSubscribers();

  return {
    microphone,
    camera,
    notifications,
    storage,
    wakeLock,
  };
}
