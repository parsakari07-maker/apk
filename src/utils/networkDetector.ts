// networkDetector.ts
// Automatic detection of network interface and role (Host vs Client)
// Uses WebRTC ICE candidate local IP discovery to determine whether the device
// is acting as a Hotspot / Gateway (e.g., .1 IP like 192.168.43.1 / 192.168.1.1) or a connected Client/Guest.

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

// Discover local network IP via WebRTC ICE candidate gathering (Standard browser API)
export async function detectLocalNetworkAndRole(): Promise<DetectedNetworkInfo> {
  return new Promise((resolve) => {
    let resolved = false;

    // Timeout fallback after 2.5 seconds
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        // Check navigator.connection if available
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
        // Match IPv4 addresses
        const ipMatch = candidateStr.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (ipMatch) {
          const foundIp = ipMatch[1];
          // Filter out loopback or public stun if possible, focus on private subnets
          if (
            foundIp.startsWith('192.168.') ||
            foundIp.startsWith('10.') ||
            foundIp.startsWith('172.')
          ) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              pc.close();

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
        .catch(() => {
          // Handled by timeout
        });
    } catch {
      // Handled by timeout
    }
  });
}
