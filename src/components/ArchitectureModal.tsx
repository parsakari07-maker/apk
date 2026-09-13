import React from 'react';
import { motion } from 'motion/react';
import { X, Network, Cpu, Radio, Video, ShieldCheck, Zap, Layers, CheckCircle2 } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose, isDark = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className={`w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl select-none relative max-h-[90vh] overflow-y-auto border transition-colors ${
          isDark
            ? 'bg-[#18181C] border-[#2A2A35] text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 left-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isDark
              ? 'bg-[#2A2A35] hover:bg-[#3A3A4A] text-[#A0A0AB] hover:text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#00E676]/15 border border-[#00E676]/30 flex items-center justify-center text-[#00E676]">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              معماری فنی و مهندسی سیستم شبکه محلی (Senior Android Architecture)
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A0A0AB]' : 'text-slate-500'}`}>
              طراحی سیستم بی‌سیم دوطرفه و دوربین مداربسته ۱۰۰٪ مستقل از اینترنت بر بستر Wi-Fi و Hotspot
            </p>
          </div>
        </div>

        {/* Architecture Grid */}
        <div className="space-y-6 text-sm">
          {/* 1. Topology */}
          <div
            className={`rounded-2xl p-5 border ${
              isDark ? 'bg-[#121214] border-[#2A2A35]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 text-[#00E676] font-bold text-base mb-2">
              <Zap className="w-5 h-5" />
              <span>۱. توپولوژی شبکه آفلاین (Offline Local Mesh / AP)</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-[#E5E7EB]' : 'text-slate-700'}`}>
              برنامه روی یک اکسس‌پوینت فیزیکی محلی، مودم بدون اینترنت یا هات‌اسپات یکی از گوشی‌ها کار می‌کند.
              هیچ بسته‌ای به خارج از شبکه سوییچ یا روتر ارسال نمی‌شود و برنامه حتی در صورت قطع کامل اینترنت شهری با نهایت سرعت و امنیت کار می‌کند.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#1E1E24] border-[#2A2A35]' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className={`text-[11px] ${isDark ? 'text-[#A0A0AB]' : 'text-slate-500'}`}>کشف سرویس‌ها</div>
                <div className={`text-xs font-mono font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  NsdManager (mDNS)
                </div>
                <div className="text-[10px] text-slate-400 mt-1">پروتکل RFC 6763 DNS-SD</div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#1E1E24] border-[#2A2A35]' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className={`text-[11px] ${isDark ? 'text-[#A0A0AB]' : 'text-slate-500'}`}>استریم صدا PTT</div>
                <div className="text-xs font-mono font-bold text-[#00E676] mt-0.5">UDP Port 50005</div>
                <div className="text-[10px] text-slate-400 mt-1">PCM 16kHz Mono (~4ms)</div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#1E1E24] border-[#2A2A35]' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className={`text-[11px] ${isDark ? 'text-[#A0A0AB]' : 'text-slate-500'}`}>استریم تصویر CCTV</div>
                <div className="text-xs font-mono font-bold text-[#3A86FF] mt-0.5">HTTP/MJPEG 8080</div>
                <div className="text-[10px] text-slate-400 mt-1">CameraX ImageAnalysis</div>
              </div>
            </div>
          </div>

          {/* 2. Walkie-Talkie Pipeline */}
          <div
            className={`rounded-2xl p-5 border ${
              isDark ? 'bg-[#121214] border-[#2A2A35]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 text-[#00E676] font-bold text-base mb-2">
              <Radio className="w-5 h-5" />
              <span>۲. پایپ‌لاین کم‌تاخیر صوتی (AudioRecord & AudioTrack)</span>
            </div>
            <div className={`space-y-2 text-xs leading-relaxed ${isDark ? 'text-[#E5E7EB]' : 'text-slate-700'}`}>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0 mt-0.5" />
                <span>
                  <strong>ضبط مستقیم بافر خام PCM:</strong> از `AudioRecord` با منبع `MediaRecorder.AudioSource.VOICE_COMMUNICATION` جهت فعال‌سازی لغو خودکار اکو (AEC) و نویزگیر سخت‌افزاری پردازنده استفاده می‌شود.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0 mt-0.5" />
                <span>
                  <strong>ارسال با پکت‌های ۲۰ میلی‌ثانیه‌ای:</strong> هر چانک بافر (۶۴۰ بایت) به یک DatagramPacket تبدیل شده و با برادکست ۲۵۵.۲۵۵.۲۵۵.۲۵۵ در کمتر از ۴ میلی‌ثانیه به تمام گره‌ها می‌رسد.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0 mt-0.5" />
                <span>
                  <strong>پخش بی‌درنگ با AudioTrack:</strong> در حالت `MODE_STREAM` با حداقل بافر سخت‌افزاری صدا فوراً از بلندگوی دستگاه پخش می‌گردد.
                </span>
              </div>
            </div>
          </div>

          {/* 3. CCTV Video Pipeline */}
          <div
            className={`rounded-2xl p-5 border ${
              isDark ? 'bg-[#121214] border-[#2A2A35]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 text-[#3A86FF] font-bold text-base mb-2">
              <Video className="w-5 h-5" />
              <span>۳. پایپ‌لاین تصویر مداربسته (CameraX & Ktor Embedded)</span>
            </div>
            <div className={`space-y-2 text-xs leading-relaxed ${isDark ? 'text-[#E5E7EB]' : 'text-slate-700'}`}>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3A86FF] shrink-0 mt-0.5" />
                <span>
                  <strong>تحلیل فریم با CameraX:</strong> استفاده از `ImageAnalysis.Builder()` با استراتژی `STRATEGY_KEEP_ONLY_LATEST` جهت پیشگیری کامل از تاخیر فریم‌ها و سرریز حافظه.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3A86FF] shrink-0 mt-0.5" />
                <span>
                  <strong>سرور داخلی Ktor Netty:</strong> استریم چندبخشی `multipart/x-mixed-replace` با استانداردهای شبکه محلی، سازگار با انواع پلیرهای ویدیویی، کلاینت‌های متصل و کدهای کاتلین.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3A86FF] shrink-0 mt-0.5" />
                <span>
                  <strong>پاسخگویی خودکار (Auto-Accept):</strong> پیاده‌سازی دست‌تکانی UDP (Handshake) که در صورت تایید کاربر یا روشن بودن سوییچ خودکار، پورت استریم را در جا اکسپوز می‌کند.
                </span>
              </div>
            </div>
          </div>

          {/* 4. Jetpack Compose UI/UX */}
          <div
            className={`rounded-2xl p-5 border ${
              isDark ? 'bg-[#121214] border-[#2A2A35]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-base mb-2">
              <Layers className="w-5 h-5 text-[#00E676]" />
              <span className={isDark ? 'text-white' : 'text-slate-900'}>
                ۴. رابط کاربری و انیمیشن‌ها (Jetpack Compose & Vazirmatn)
              </span>
            </div>
            <ul className={`list-disc list-inside text-xs space-y-1 ${isDark ? 'text-[#A0A0AB]' : 'text-slate-600'}`}>
              <li>پشتیبانی پیش‌فرض RTL با `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl)`</li>
              <li>انیمیشن گسترش نرم کارت‌ها با `animateContentSize()` و `AnimatedVisibility`</li>
              <li>انیمیشن لغزنده تب کپسولی با `animateFloatAsState` و محاسبات فیزیک Spring</li>
              <li>افکت ریپل و امواج نئونی دکمه PTT با `rememberInfiniteTransition`</li>
              <li>لایه‌های شیشه‌ای شناور (Glassmorphic) با بلور پس‌زمینه و حاشیه‌های شفاف</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`mt-6 pt-4 border-t flex items-center justify-end ${
            isDark ? 'border-[#2A2A35]' : 'border-slate-200'
          }`}
        >
          <button
            onClick={onClose}
            className="bg-[#00E676] hover:bg-[#00C853] text-black font-bold text-xs px-6 py-2.5 rounded-xl transition-transform active:scale-95 cursor-pointer"
          >
            متوجه شدم، بستن پنجره
          </button>
        </div>
      </motion.div>
    </div>
  );
};
