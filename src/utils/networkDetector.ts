// networkDetector.ts
// Automatic detection of network interface and role (Host vs Client)
// Queries native Android network bridge when available, or WebRTC ICE candidates in browser.

export interface DetectedNetworkInfo {
  role: 'host' | 'client';
  localIp: string;
  networkSsid: string;
  isHotspotGateway: boolean;
  subnet: string;
}

// Inspect candidate IP to test if ending in .1 (typical Android Wi-Fi hotspot gateway)
export function isGatewayIp(ip: string): boolean {
  if (!ip) return false;
  const parts = ip.split('.');
  if (parts.length === 4) {
    const lastOctet = parseInt(parts[3], 10);
    return lastOctet === 1;
  }
  return false;
}

// Discover local network IP and role
export async function detectLocalNetworkAndRole(): Promise<DetectedNetworkInfo> {
  // 1. Check Native Android Bridge if present
  if (typeof window !== 'undefined' && (window as any).AndroidNetwork) {
    try {
      const nativeIp = (window as any).AndroidNetwork.getWifiIpAddress();
      const nativeSsid = (window as any).AndroidNetwork.getWifiSsid() || 'شبکه محلی Wi-Fi';
      if (nativeIp && nativeIp !== '0.0.0.0' && nativeIp !== '127.0.0.1') {
        const isHost = isGatewayIp(nativeIp);
        const parts = nativeIp.split('.');
        const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
        const isAndroidHotspot = nativeIp.startsWith('192.168.43.');

        return {
          role: isHost ? 'host' : 'client',
          localIp: nativeIp,
          networkSsid: isAndroidHotspot
            ? 'هات‌اسپات اندروید (Hotspot AP)'
            : isHost
            ? 'شبکه محلی میزبان (Host AP)'
            : nativeSsid,
          isHotspotGateway: isHost,
          subnet,
        };
      }
    } catch (e) {
      console.warn('[NetworkDetector] Native bridge IP check error:', e);
    }
  }

  // 2. WebRTC ICE Candidate Discovery for standard browser environment
  return new Promise((resolve) => {
    let resolved = false;

    // Timeout fallback after 2.5 seconds
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          role: 'client',
          localIp: '192.168.1.104',
          networkSsid: 'شبکه محلی (Wi-Fi Local)',
          isHotspotGateway: false,
          subnet: '192.168.1.0/24',
        });
      }
    }, 2500);

    try {
      const RTCPeer = window.RTCPeerConnection || (window as unknown as { webkitRTCPeerConnection: typeof RTCPeerConnection }).webkitRTCPeerConnection;
      if (!RTCPeer) {
        clearTimeout(timeout);
        resolve({
          role: 'client',
          localIp: '192.168.1.104',
          networkSsid: 'شبکه محلی (Wi-Fi Local)',
          isHotspotGateway: false,
          subnet: '192.168.1.0/24',
        });
        return;
      }

      const pc = new RTCPeer({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.createDataChannel('net_role_detect');

      pc.onicecandidate = (e) => {
        if (!e || !e.candidate || !e.candidate.candidate) return;
        const candidateStr = e.candidate.candidate;
        const ipMatch = candidateStr.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (ipMatch) {
          const foundIp = ipMatch[1];
          if (
            foundIp.startsWith('192.168.') ||
            foundIp.startsWith('10.') ||
            foundIp.startsWith('172.')
          ) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              try { pc.close(); } catch {}

              const isHost = isGatewayIp(foundIp);
              const subnetParts = foundIp.split('.');
              const subnet = `${subnetParts[0]}.${subnetParts[1]}.${subnetParts[2]}.0/24`;
              const isAndroidHotspot = foundIp.startsWith('192.168.43.');

              resolve({
                role: isHost ? 'host' : 'client',
                localIp: foundIp,
                networkSsid: isAndroidHotspot
                  ? 'هات‌اسپات اندروید (Hotspot AP)'
                  : isHost
                  ? 'شبکه محلی میزبان (Host AP)'
                  : 'شبکه محلی Wi-Fi',
                isHotspotGateway: isHost,
                subnet,
              });
            }
          }
        }
      };

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {});
    } catch {
      // Handled by timeout
    }
  });
}
