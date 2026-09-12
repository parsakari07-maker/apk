// systemPermissions.ts
// Handles real Android / Browser hardware and system permission requests:
// 1. Microphone (RECORD_AUDIO) via getUserMedia
// 2. Camera (CAMERA) via getUserMedia
// 3. Notifications (POST_NOTIFICATIONS) via Notification.requestPermission
// 4. Background Execution & WakeLock (WAKE_LOCK) via navigator.wakeLock
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

// Check current status of permissions without triggering prompts
export async function checkSystemPermissions(): Promise<DevicePermissionStatus> {
  let microphone: 'granted' | 'denied' | 'prompt' = 'prompt';
  let camera: 'granted' | 'denied' | 'prompt' = 'prompt';
  let notification: 'granted' | 'denied' | 'prompt' = 'prompt';

  if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
    try {
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (micStatus) microphone = micStatus.state as any;
    } catch {
      // Query not supported for microphone on some mobile browsers
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

// Request real microphone permission from device (triggers native OS/browser prompt)
export async function requestMicrophonePermission(): Promise<PermissionRequestResult> {
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
    // Release tracks after granting permission so the mic indicator turns off until actually needed
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
        ? 'دسترسی میکروفون توسط کاربر یا تنظیمات مرورگر رد شد.'
        : err?.message || 'خطا در برقراری ارتباط با میکروفون دستگاه.',
    };
  }
}

// Request real camera permission from device (triggers native OS/browser prompt)
export async function requestCameraPermission(): Promise<PermissionRequestResult> {
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
        ? 'دسترسی دوربین توسط کاربر یا تنظیمات مرورگر رد شد.'
        : err?.message || 'خطا در اتصال به سنسور دوربین.',
    };
  }
}

// Request notifications permission from device
export async function requestNotificationPermission(): Promise<PermissionRequestResult> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        success: false,
        status: 'unsupported',
        error: 'سرویس اعلان‌ها در این محیط پشتیبانی نمی‌شود.',
      };
    }
    if (Notification.permission === 'granted') {
      return { success: true, status: 'granted' };
    }
    const res = await Notification.requestPermission();
    if (res === 'granted') {
      return { success: true, status: 'granted' };
    } else {
      return {
        success: false,
        status: 'denied',
        error: 'دسترسی ارسال اعلان توسط کاربر رد شد.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      status: 'unsupported',
      error: err?.message || 'خطا در درخواست مجوز اعلان.',
    };
  }
}

// Request background execution + notifications
export async function requestBackgroundPermission(): Promise<{
  notificationGranted: boolean;
  wakeLockAcquired: boolean;
}> {
  return await backgroundService.requestBackgroundPermissions();
}

// Request ALL primary hardware & background permissions simultaneously on onboarding
export async function requestAllInitialPermissions(): Promise<{
  mic: boolean;
  camera: boolean;
  notification: boolean;
  wakeLock: boolean;
}> {
  let mic = false;
  let camera = false;

  // 1. Trigger real Android / Browser microphone permission prompt
  try {
    const micRes = await requestMicrophonePermission();
    mic = micRes.success;
  } catch (e) {
    console.warn('Microphone request error during onboarding:', e);
  }

  // 2. Trigger real Android / Browser camera permission prompt
  try {
    const camRes = await requestCameraPermission();
    camera = camRes.success;
  } catch (e) {
    console.warn('Camera request error during onboarding:', e);
  }

  // 3. Trigger notification permission prompt & activate WakeLock
  const bgRes = await requestBackgroundPermission();

  return {
    mic,
    camera,
    notification: bgRes.notificationGranted,
    wakeLock: bgRes.wakeLockAcquired,
  };
}

