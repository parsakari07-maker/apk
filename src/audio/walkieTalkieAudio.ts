/**
 * Audio synthesis for Walkie-Talkie effects:
 * - Radio squelch / open mic click
 * - Roger beep on release (dual-tone standard)
 * - Microphone input analyzer for real voice waveform
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays short walkie-talkie squelch / static click when PTT is pressed
 */
export function playPttStartSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // White noise burst
    const bufferSize = ctx.sampleRate * 0.07;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter to simulate radio speaker
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.07);

    // Initial chirp tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.04);

    oscGain.gain.setValueAtTime(0.08, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);

    // Trigger tactical press haptic
    triggerTacticalHaptic('press');
  } catch (e) {
    console.warn('Could not play audio', e);
  }
}

/**
 * Plays authentic military dual-tone "Roger Beep": 1200Hz followed by 1000Hz
 */
export function playRogerBeep() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Tone 1: 1200 Hz for ~60ms
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.setValueAtTime(0.12, now + 0.06);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.07);

    // Tone 2: 1000 Hz for ~80ms right after tone 1
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1000, now + 0.075);
    gain2.gain.setValueAtTime(0.12, now + 0.075);
    gain2.gain.setValueAtTime(0.12, now + 0.155);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.075);
    osc2.stop(now + 0.17);

    // Trigger tactical release haptic (double tap)
    triggerTacticalHaptic('release');
  } catch (e) {
    console.warn('Could not play roger beep', e);
  }
}

/**
 * Tactical Haptic feedback using Web Vibration API if supported
 */
export function triggerTacticalHaptic(type: 'press' | 'release' | 'qrScan') {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'press') {
        // Crisp single tap on mic engage
        navigator.vibrate(28);
      } else if (type === 'release') {
        // Iconic double pulse matching the dual roger beep
        navigator.vibrate([22, 35, 25]);
      } else if (type === 'qrScan') {
        // Sharp positive confirmation pattern
        navigator.vibrate([40, 30, 60]);
      }
    }
  } catch (err) {
    // Ignore unsupported environments
  }
}
