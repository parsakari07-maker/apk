// systemPermissions.ts
// Handles real Android hardware and system permission requests:
// 1. Microphone (RECORD_AUDIO) via Android Bridge / getUserMedia
// 2. Camera (CAMERA) via Android Bridge / getUserMedia
// 3. Notifications (POST_NOTIFICATIONS) via Android Bridge / Notification API
// 4. Background Execution & WakeLock (WAKE_LOCK) via navigator.wakeLock / Android Service
// 5. Screen Capture (MediaProjection) via getDisplayMedia

import { backgroundService } from './backgroundService';

export interface DevicePermissionStatus {
  microphone: 'granted' | 'denied' | 'prompt';
  camera: 'granted' | 'denied' | 'prompt';
  notification: 'granted' | 'denied' | 'prompt';
  wakeLock: boolean;
}

export interface PermissionRequestResult {
  success: boolean;
  status: 'granted' | 'denied' | 'unsupported';
  error?: string;
}

// Check current status of permissions
export async function checkSystemPermissions(): Promise<DevicePermissionStatus> {
  let microphone: 'granted' | 'denied' | 'prompt' = 'prompt';
  let camera: 'granted' | 'denied' | 'prompt' = 'prompt';
  let notification: 'granted' | 'denied' | 'prompt' = 'prompt';

  // Check Android Bridge if running in native Android wrapper
  const win = typeof window !== 'undefined' ? (window as any) : null;
  if (win && win.AndroidPermissions) {
    try {
      if (win.AndroidPermissions.hasMicrophonePermission && win.AndroidPermissions.hasMicrophonePermission()) {
        microphone = 'granted';
      }
      if (win.AndroidPermissions.hasCameraPermission && win.AndroidPermissions.hasCameraPermission()) {
        camera = 'granted';
      }
      if (win.AndroidPermissions.hasNotificationPermission && win.AndroidPermissions.hasNotificationPermission()) {
        notification = 'granted';
      }
    } catch {
      // Fall through to standard APIs
    }
  }

  if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
    try {
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (micStatus) microphone = micStatus.state as any;
    } catch {
      // Query not supported for microphone on some devices
    }

    try {
      const camStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (camStatus) camera = camStatus.state as any;
    } catch {
      // Query not supported for camera
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') notification = 'granted';
    else if (Notification.permission === 'denied') notification = 'denied';
    else notification = 'prompt';
  }

  const wakeLock = backgroundService.isWakeLockActive();

  return {
    microphone,
    camera,
    notification,
    wakeLock,
  };
}

// Request real microphone permission from Android device
export async function requestMicrophonePermission(): Promise<PermissionRequestResult> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  // 1. Android Native Bridge Hook if present in APK
  if (win && win.AndroidPermissions && win.AndroidPermissions.requestMicrophone) {
    try {
      const granted = win.AndroidPermissions.requestMicrophone();
      if (granted) {
        return { success: true, status: 'granted' };
      }
    } catch {
      // Continue to mediaDevices request
    }
  }

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
    // Release tracks after granting permission so the mic indicator turns off until needed
    stream.getTracks().forEach((track) => track.stop());
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

// Request real camera permission from Android device
export async function requestCameraPermission(): Promise<PermissionRequestResult> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  // 1. Android Native Bridge Hook if present in APK
  if (win && win.AndroidPermissions && win.AndroidPermissions.requestCamera) {
    try {
      const granted = win.AndroidPermissions.requestCamera();
      if (granted) {
        return { success: true, status: 'granted' };
      }
    } catch {
      // Continue to mediaDevices request
    }
  }

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

// Request notifications permission from Android device
export async function requestNotificationPermission(): Promise<PermissionRequestResult> {
  const win = typeof window !== 'undefined' ? (window as any) : null;

  if (win && win.AndroidPermissions && win.AndroidPermissions.requestNotification) {
    try {
      const granted = win.AndroidPermissions.requestNotification();
      if (granted) {
        return { success: true, status: 'granted' };
      }
    } catch {
      // Continue to Notification.requestPermission
    }
  }

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
  } catch {
    // Continue
  }

  try {
    wakeLockAcquired = await backgroundService.acquireWakeLock();
  } catch {
    // Continue
  }

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
  wakeLock: boolean;
}> {
  const microphone = await requestMicrophonePermission();
  const camera = await requestCameraPermission();
  const notifications = await requestNotificationPermission();
  const wakeLock = await backgroundService.acquireWakeLock();

  return {
    microphone,
    camera,
    notifications,
    wakeLock,
  };
}
