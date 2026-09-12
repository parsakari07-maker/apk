// Background Service & WakeLock Manager
// Provides real background execution capabilities:
// 1. Screen & CPU WakeLock to prevent OS power management from suspending network sockets
// 2. Notification permission for background PTT audio calls & CCTV alerts
// 3. WebAudio Keep-Alive oscillator to maintain audio context in background

class BackgroundServiceManager {
  private wakeLockSentinel: any = null;
  private audioContext: AudioContext | null = null;
  private isKeepAliveRunning = false;

  // Check if notification permission is granted
  public isNotificationGranted(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }

  // Check if wake lock is supported and active
  public isWakeLockActive(): boolean {
    return this.wakeLockSentinel !== null && !this.wakeLockSentinel.released;
  }

  // Acquire wake lock directly
  public async acquireWakeLock(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
        return true;
      }
    } catch (e) {
      console.warn('WakeLock request failed:', e);
    }
    return false;
  }

  // Request full background execution permissions: Notifications + Screen WakeLock
  public async requestBackgroundPermissions(): Promise<{
    notificationGranted: boolean;
    wakeLockAcquired: boolean;
    error?: string;
  }> {
    let notificationGranted = false;
    let wakeLockAcquired = false;

    // 1. Notification Permission
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          notificationGranted = true;
        } else if (Notification.permission !== 'denied') {
          const res = await Notification.requestPermission();
          notificationGranted = res === 'granted';
        }
      }
    } catch (e) {
      console.warn('Notification permission request failed:', e);
    }

    // 2. WakeLock Acquisition
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockAcquired = true;

        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
      }
    } catch (e: any) {
      console.warn('WakeLock request failed:', e);
    }

    // 3. Start audio keep-alive for background audio processing
    this.startAudioKeepAlive();

    localStorage.setItem('netmaster_background_service_enabled', 'true');

    return {
      notificationGranted,
      wakeLockAcquired,
    };
  }

  // Re-acquire WakeLock when visibility changes back to visible
  public async handleVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'visible' && !this.isWakeLockActive()) {
      try {
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
          const enabled = localStorage.getItem('netmaster_background_service_enabled') === 'true';
          if (enabled) {
            this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          }
        }
      } catch (e) {
        // Ignored
      }
    }
  }

  // Release wake lock and stop background service
  public releaseBackgroundService(): void {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch (e) {
        // Ignored
      }
      this.wakeLockSentinel = null;
    }
    this.stopAudioKeepAlive();
    localStorage.setItem('netmaster_background_service_enabled', 'false');
  }

  // Audio keep-alive creates an inaudible buffer oscillator to prevent thread suspension
  private startAudioKeepAlive(): void {
    if (this.isKeepAliveRunning) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      gain.gain.value = 0.00001; // Inaudible
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      this.isKeepAliveRunning = true;
    } catch (e) {
      console.warn('Audio keep-alive initialization skipped:', e);
    }
  }

  private stopAudioKeepAlive(): void {
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // Ignored
      }
      this.audioContext = null;
      this.isKeepAliveRunning = false;
    }
  }
}

export const backgroundService = new BackgroundServiceManager();
