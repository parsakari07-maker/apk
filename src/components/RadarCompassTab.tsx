import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Radio,
  Navigation,
  Target,
  VolumeX,
  UserX,
  Signal,
  Wifi,
  ShieldCheck,
  Crosshair
} from 'lucide-react';
import { PeerDevice, UserProfile } from '../types';

interface RadarCompassTabProps {
  peers: PeerDevice[];
  profile: UserProfile;
  onKickPeer: (peerId: string) => void;
  onToggleMutePeer: (peerId: string) => void;
  onToggleSpeakerMode: () => void;
  isDark?: boolean;
}

export const RadarCompassTab: React.FC<RadarCompassTabProps> = ({
  peers,
  profile,
  onKickPeer,
  onToggleMutePeer,
  isDark = true,
}) => {
  const [heading, setHeading] = useState(42);
  const [selectedPeer, setSelectedPeer] = useState<PeerDevice | null>(peers[0] || null);

  // Smooth simulated compass heading drift
  useEffect(() => {
    const interval = setInterval(() => {
      setHeading((prev) => (prev + (Math.random() * 2 - 1) + 360) % 360);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Update selected peer if peers change
  useEffect(() => {
    if (!selectedPeer && peers.length > 0) {
      setSelectedPeer(peers[0]);
    }
  }, [peers, selectedPeer]);

  // Helper to calculate distance category using tactical palette
  const getDistanceBand = (rssi: number) => {
    if (rssi >= -50) return { label: 'بسیار نزدیک (۱-۳ متر)', rangeMeters: '۲.۴m', color: '#4CC9F0', radiusPct: 28 };
    if (rssi >= -70) return { label: 'فاصله متوسط (۴-۱۰ متر)', rangeMeters: '۷.۱m', color: '#70A5D8', radiusPct: 58 };
    return { label: 'فاصله دور (> ۱۰ متر)', rangeMeters: '۱۴.۸m', color: '#93C5FD', radiusPct: 82 };
  };

  // Azimuth degree dial markings around outer bezel
  const DIAL_DEGREES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  return (
    <div
      className={`flex-1 flex flex-col p-3 space-y-3 select-none overflow-y-auto transition-colors duration-300 ${
        isDark ? 'bg-[#111318] text-[#E2E8F0]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
      dir="rtl"
    >
      {/* Center Radar PPI Scope Container - Explicitly sized to NEVER collapse */}
      <div className="w-full flex items-center justify-center shrink-0 py-1">
        <div
          id="tactical-ppi-radar-scope"
          className="relative w-[280px] h-[280px] sm:w-[310px] sm:h-[310px] shrink-0 rounded-full overflow-hidden shadow-2xl bg-[#0A0C10] border-[3px] border-[#262C38] ring-2 ring-[#4CC9F0]/30 flex items-center justify-center"
          style={{ boxShadow: '0 0 35px rgba(0,0,0,0.9), inset 0 0 30px rgba(76,201,240,0.06)' }}
        >
          {/* 1. Phosphor Scope Ambient Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(76,201,240,0.12)_0%,rgba(10,12,16,0.95)_75%)] pointer-events-none" />

          {/* 2. Tactical Scanlines & CRT Grid Texture */}
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none" />

          {/* 3. Azimuth Degree Marks around Outer Bezel */}
          {DIAL_DEGREES.map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const rPct = 45;
            const x = 50 + rPct * Math.cos(rad);
            const y = 50 + rPct * Math.sin(rad);

            return (
              <div
                key={deg}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none text-[8px] font-mono text-[#70A5D8]/80 font-bold"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {deg.toString().padStart(3, '0')}°
              </div>
            );
          })}

          {/* 4. Concentric Range Rings (Polar Distance Rings) */}
          {/* Ring 3 (Outer - 30m) */}
          <div className="absolute inset-0 m-auto w-[84%] h-[84%] rounded-full border border-[#262C38] pointer-events-none" />
          <span className="absolute top-[8.5%] left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#94A3B8]/70 pointer-events-none">
            30m
          </span>

          {/* Ring 2 (Middle - 15m) */}
          <div className="absolute inset-0 m-auto w-[58%] h-[58%] rounded-full border border-[#70A5D8]/35 pointer-events-none" />
          <span className="absolute top-[21.5%] left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#70A5D8]/80 pointer-events-none font-bold">
            15m
          </span>

          {/* Ring 1 (Inner - 5m) */}
          <div className="absolute inset-0 m-auto w-[28%] h-[28%] rounded-full border border-[#4CC9F0]/45 pointer-events-none" />
          <span className="absolute top-[36.5%] left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#4CC9F0] pointer-events-none font-bold">
            5m
          </span>

          {/* 5. Radial Crosshairs & 45-degree Diagonal Azimuth Guidelines */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#262C38] pointer-events-none" />
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[#262C38] pointer-events-none" />
          <div className="absolute inset-0 m-auto w-full h-[1px] bg-[#262C38]/50 rotate-45 pointer-events-none" />
          <div className="absolute inset-0 m-auto w-full h-[1px] bg-[#262C38]/50 -rotate-45 pointer-events-none" />

          {/* Measurement tick notches */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[84%] h-[6px] border-x border-[#4CC9F0]/40" />
            <div className="w-[58%] h-[6px] border-x border-[#4CC9F0]/40 absolute" />
            <div className="w-[28%] h-[6px] border-x border-[#4CC9F0]/40 absolute" />
          </div>

          {/* 6. ROTATING TACTICAL PPI SWEEP BEAM WITH 65-DEGREE PHOSPHOR TRAIL */}
          <div
            className="absolute inset-0 w-full h-full rounded-full pointer-events-none z-10 animate-radar"
            style={{ willChange: 'transform' }}
          >
            {/* Phosphor Decay Trail (Conic gradient trailing behind 12 o'clock sweep) */}
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  'conic-gradient(from 0deg at 50% 50%, rgba(76,201,240,0.55) 0deg, transparent 0.6deg, transparent 295deg, rgba(76,201,240,0.02) 296deg, rgba(76,201,240,0.08) 325deg, rgba(76,201,240,0.22) 345deg, rgba(76,201,240,0.55) 360deg)',
              }}
            />

            {/* Sharp High-Intensity Leading Beam Ray (Center 50%,50% to Top Perimeter) */}
            <div
              className="absolute top-0 left-1/2 w-[2px] h-1/2 -translate-x-1/2 origin-bottom bg-gradient-to-t from-[#4CC9F0] via-cyan-200 to-white"
              style={{
                boxShadow: '0 0 10px #4CC9F0, 0 0 18px rgba(76, 201, 240, 0.9)',
              }}
            />
          </div>

          {/* 7. Center Host Radar Station / Compass Pointer */}
          <div className="relative z-20 w-8 h-8 rounded-full bg-[#111318] border-2 border-[#4CC9F0] flex items-center justify-center text-[#4CC9F0] shadow-xl shadow-[#4CC9F0]/40">
            <Navigation
              className="w-3.5 h-3.5 transition-transform duration-300 stroke-[2.5]"
              style={{ transform: `rotate(${heading}deg)` }}
            />
          </div>

          {/* 8. Connected Peer Blips (Tactical Radar Contacts) */}
          {peers.map((peer, idx) => {
            const band = getDistanceBand(peer.rssi);
            const angle = (idx * 115 + 40) % 360;
            const rad = (angle * Math.PI) / 180;
            const radiusPct = band.radiusPct * 0.44;
            const x = 50 + radiusPct * Math.cos(rad);
            const y = 50 + radiusPct * Math.sin(rad);

            const isSelected = selectedPeer?.id === peer.id;

            return (
              <button
                key={peer.id}
                onClick={() => setSelectedPeer(peer)}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer focus:outline-none transition-transform hover:scale-125"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                    style={{ backgroundColor: band.color }}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 border-2 ${
                      isSelected ? 'ring-2 ring-white scale-125 shadow-lg' : ''
                    }`}
                    style={{ backgroundColor: band.color, borderColor: '#111318' }}
                  />
                </span>
                <span className="text-[8px] bg-[#111318]/95 px-1.5 py-0.5 rounded text-white font-mono border border-[#262C38] shadow-sm whitespace-nowrap mt-0.5">
                  {peer.name.split(' ')[0]} ({band.rangeMeters})
                </span>
              </button>
            );
          })}

          {/* Cardinal Directions */}
          <span className="absolute top-1.5 text-[10px] font-mono text-[#4CC9F0] font-extrabold z-20 pointer-events-none">
            N
          </span>
          <span className="absolute bottom-1.5 text-[10px] font-mono text-[#94A3B8] z-20 pointer-events-none">
            S
          </span>
          <span className="absolute right-2.5 text-[10px] font-mono text-[#94A3B8] z-20 pointer-events-none">
            E
          </span>
          <span className="absolute left-2.5 text-[10px] font-mono text-[#94A3B8] z-20 pointer-events-none">
            W
          </span>
        </div>
      </div>

      {/* Selected Peer Tactical Telemetry Card */}
      {selectedPeer && (
        <div
          className={`p-3 rounded-2xl border space-y-2.5 shadow-md shrink-0 ${
            isDark ? 'bg-[#1B1F28] border-[#262C38]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#4CC9F0]/15 border border-[#4CC9F0]/30 flex items-center justify-center text-[#4CC9F0]">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedPeer.name}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                  {selectedPeer.ip} • پورت {selectedPeer.port}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono border font-bold bg-[#4CC9F0]/10 text-[#4CC9F0] border-[#4CC9F0]/30">
                سیگنال: {selectedPeer.rssi} dBm
              </span>
            </div>
          </div>

          <div
            className={`grid grid-cols-2 gap-2 text-[11px] pt-1 border-t ${
              isDark ? 'border-[#262C38]' : 'border-slate-100'
            }`}
          >
            <div
              className={`p-2 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-[#111318] border-[#262C38]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className={isDark ? 'text-[#94A3B8]' : 'text-slate-500'}>تخمین فاصله:</span>
              <span className="font-mono font-bold text-[#4CC9F0]">
                {getDistanceBand(selectedPeer.rssi).rangeMeters}
              </span>
            </div>
            <div
              className={`p-2 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-[#111318] border-[#262C38]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className={isDark ? 'text-[#94A3B8]' : 'text-slate-500'}>باند فرکانسی:</span>
              <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ۵ گیگاهرتز
              </span>
            </div>
          </div>

          {/* Host Control Actions on Peer */}
          {profile.role === 'host' && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onToggleMutePeer(selectedPeer.id)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  selectedPeer.isMutedByHost
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : isDark
                    ? 'bg-[#262C38] hover:bg-[#333C4E] text-white border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>{selectedPeer.isMutedByHost ? 'لغو بی‌صدا' : 'بی‌صدا کردن'}</span>
              </button>

              <button
                onClick={() => onKickPeer(selectedPeer.id)}
                className="py-1.5 px-3 rounded-xl text-xs font-bold bg-[#FF5252]/15 hover:bg-[#FF5252]/25 text-[#FF5252] border border-[#FF5252]/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>قطع اتصال</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Peers Summary List */}
      <div className="space-y-1.5 shrink-0 pb-2">
        <div className="flex items-center justify-between text-xs px-1 font-semibold">
          <span className={`flex items-center gap-1.5 ${isDark ? 'text-[#94A3B8]' : 'text-slate-600'}`}>
            <Radio className="w-3.5 h-3.5 text-[#4CC9F0]" />
            گره‌های کشف‌شده در رادار ({peers.length})
          </span>
          <span className="text-[10px] font-mono text-[#70A5D8]">نرخ چرخش: ۱۵ RPM</span>
        </div>

        {peers.length === 0 ? (
          <div
            className={`p-4 rounded-xl border border-dashed text-center text-xs space-y-1.5 ${
              isDark
                ? 'bg-[#141A26]/50 border-[#262C38] text-slate-400'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <Crosshair className="w-5 h-5 mx-auto text-[#4CC9F0] opacity-60 animate-pulse" />
            <div className="font-medium text-[11px]">هیچ دستگاه دیگری در رادار محلی کشف نشده است</div>
            <div className="text-[10px] text-slate-500">
              به محض اتصال گوشی دیگر به این Wi-Fi یا هات‌اسپات، موقعیت آن نمایان می‌شود
            </div>
          </div>
        ) : (
          peers.map((peer) => {
            const band = getDistanceBand(peer.rssi);
            return (
              <div
                key={peer.id}
                onClick={() => setSelectedPeer(peer)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedPeer?.id === peer.id
                    ? isDark
                      ? 'bg-[#1B1F28] border-[#4CC9F0] shadow-md shadow-[#4CC9F0]/10'
                      : 'bg-sky-50 border-sky-400 shadow-sm'
                    : isDark
                    ? 'bg-[#1B1F28]/60 hover:bg-[#1B1F28] border-[#262C38]'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: band.color }}
                  />
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {peer.name}
                  </span>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                    {peer.ip}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#4CC9F0] font-bold">
                    {band.rangeMeters}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                    باتری: {peer.battery}٪
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
