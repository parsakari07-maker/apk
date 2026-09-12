import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Smartphone,
  X,
  Download,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Github,
  Play,
  Sparkles,
  Zap,
  ArrowLeft,
  FileCode
} from 'lucide-react';
import { generatePythonSetupScript, generateBashSetupScript, triggerFileDownload } from '../utils/projectGenerator';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadZip?: () => void;
  onViewGithubWorkflow?: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({
  isOpen,
  onClose,
  onDownloadZip,
  onViewGithubWorkflow,
}) => {
  const [activeTab, setActiveTab] = useState<'easy' | 'studio' | 'scripts' | 'pwa'>('easy');
  const [copiedCmd, setCopiedCmd] = useState(false);

  const handleDownloadPython = () => {
    const script = generatePythonSetupScript();
    triggerFileDownload('setup_netmaster_project.py', script, 'text/x-python;charset=utf-8');
  };

  const handleDownloadBash = () => {
    const script = generateBashSetupScript();
    triggerFileDownload('setup_project.sh', script, 'application/x-sh;charset=utf-8');
  };

  if (!isOpen) return null;

  const gradleCmd = './gradlew assembleDebug';

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(gradleCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-[#0F1118] border border-[#1E2232] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#141722] border-b border-[#1E2232] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F59B] to-[#00D2FF] p-0.5 flex items-center justify-center shadow-lg shadow-[#00F59B]/20">
              <div className="w-full h-full bg-[#0F1118] rounded-[14px] flex items-center justify-center text-[#00F59B]">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>دریافت و ساخت فایل APK (بدون نیاز به کدنویسی)</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-[#9CA3AF] mt-0.5">
                ساده‌ترین راه‌ها برای داشتن فایل نصبی برنامه روی گوشی واقعی شما
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#1E2232] hover:bg-[#2A3045] text-[#9CA3AF] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Summary Pill Banner */}
        <div className="p-3.5 bg-[#12151E] border-b border-[#1E2232] flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-[#00F59B] shrink-0 mt-0.5" />
          <div className="text-xs text-[#D1D5DB] leading-relaxed">
            اگر با برنامه‌نویسی آشنا نیستید هیچ مشکلی نیست! کل پروژه کاملاً آماده و طراحی شده است. از میان ۳ روش ساده زیر، هرکدام برای شما راحت‌تر است را انتخاب کنید:
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="p-2.5 bg-[#0F1118] border-b border-[#1E2232] flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('easy')}
            className={`flex-1 min-w-[140px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'easy'
                ? 'bg-[#00F59B] text-black shadow-md shadow-[#00F59B]/20 font-bold'
                : 'text-[#9CA3AF] hover:text-white bg-[#141722]'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>روش ۱: کلاد گیتهاب (APK آماده)</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex-1 min-w-[140px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'scripts'
                ? 'bg-[#FFB800] text-black shadow-md shadow-[#FFB800]/20 font-bold'
                : 'text-[#9CA3AF] hover:text-white bg-[#141722]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>روش ۲: اسکریپت خودکار (setup.py)</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'studio'
                ? 'bg-[#00D2FF] text-black shadow-md shadow-[#00D2FF]/20 font-bold'
                : 'text-[#9CA3AF] hover:text-white bg-[#141722]'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>روش ۳: Android Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'pwa'
                ? 'bg-[#A855F7] text-white shadow-md shadow-[#A855F7]/20 font-bold'
                : 'text-[#9CA3AF] hover:text-white bg-[#141722]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>روش ۴: نصب آنی (PWA)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'scripts' && (
            <div className="space-y-3.5">
              <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FFB800]" />
                <span>ساخت فوری تمام پوشه‌ها و فایل‌های پروژه در کامپیوتر با اسکریپت خودکار:</span>
              </div>

              <p className="text-xs text-[#D1D5DB] leading-relaxed">
                برای جلوگیری از پیچیدگی کپی‌پیست تک‌تک فایل‌ها یا دریافت یک فایل متنی نامرتب، این اسکریپت پایتون تمام ساختار استاندارد اندروید استودیو شامل مسیرهای <code className="text-[#00F59B]">app/src/main/java/...</code> و گریدل را در چند ثانیه به صورت فایل‌های مجزا می‌سازد.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleDownloadPython}
                  className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-[#1E2638] hover:bg-[#2A354C] border border-[#FFB800]/40 text-[#FFB800] font-bold text-xs transition-all shadow-md active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود اسکریپت setup_netmaster_project.py</span>
                </button>

                <button
                  onClick={handleDownloadBash}
                  className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-[#1E2638] hover:bg-[#2A354C] border border-[#00D2FF]/40 text-[#00D2FF] font-bold text-xs transition-all shadow-md active:scale-98"
                >
                  <Terminal className="w-4 h-4" />
                  <span>دانلود اسکریپت لینوکس/مک setup_project.sh</span>
                </button>
              </div>

              <div className="p-3 bg-[#0A0D14] border border-[#1E2638] rounded-2xl space-y-1.5 text-xs text-[#9CA3AF]">
                <div className="text-white font-semibold">دستور اجرا در کامپیوتر:</div>
                <code className="block bg-[#121826] p-2 rounded-xl text-[#00F59B] font-mono dir-ltr text-left">
                  python setup_netmaster_project.py
                </code>
                <p className="text-[11px] text-slate-400">
                  این دستور پوشه‌های کامل پروژه را می‌سازد و می‌توانید فوراً پوشه را در Android Studio باز کرده و دکمه Run را بزنید!
                </p>
              </div>
            </div>
          )}
          {activeTab === 'easy' && (
            <div className="space-y-3.5">
              <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00F59B]" />
                <span>ساخت خودکار فایل APK در فضای ابری (بدون نیاز به نصب هیچ ابزاری):</span>
              </div>

              <div className="space-y-2.5 text-xs text-[#D1D5DB] leading-relaxed">
                <div className="p-3 rounded-2xl bg-[#141722] border border-[#1E2232] flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#00F59B]/20 text-[#00F59B] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ۱
                  </div>
                  <div>
                    <strong className="text-white">دانلود پکیج کامل پروژه:</strong> روی دکمه سبز رنگ پایین («دانلود پکیج کامل سورس پروژه») کلیک کنید تا یک فایل ZIP دریافت کنید.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#141722] border border-[#1E2232] flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#00F59B]/20 text-[#00F59B] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ۲
                  </div>
                  <div>
                    <strong className="text-white">آپلود در یک مخزن رایگان GitHub:</strong> وارد سایت <span className="text-[#00D2FF]">github.com</span> شوید، گزینه <strong>New Repository</strong> را بزنید و محتویات فایل زیپ را آپلود کنید.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#141722] border border-[#1E2232] flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#00F59B]/20 text-[#00F59B] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ۳
                  </div>
                  <div>
                    <strong className="text-white">دانلود مستقیم APK:</strong> فایل خودکار بیلد (GitHub Action) که از قبل در پروژه قرار داده‌ایم، ظرف ۱ دقیقه برنامه را کامپایل می‌کند و در تب <strong>Actions</strong> یا <strong>Releases</strong> فایل <code className="text-[#00F59B] bg-[#0F1118] px-1.5 py-0.5 rounded">NetMaster.apk</code> را برای دانلود در اختیارتان می‌گذارد.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="space-y-3.5">
              <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-[#00D2FF]" />
                <span>نصب با برنامه رایگان Android Studio (تنها با ۲ کلیک):</span>
              </div>

              <ol className="space-y-2.5 text-xs text-[#D1D5DB] leading-relaxed list-decimal list-inside">
                <li className="p-3 rounded-2xl bg-[#141722] border border-[#1E2232]">
                  فایل زیپ پروژه را از دکمه پایین دانلود کرده و از حالت فشرده خارج کنید.
                </li>
                <li className="p-3 rounded-2xl bg-[#141722] border border-[#1E2232]">
                  نرم‌افزار <strong>Android Studio</strong> را باز کرده و پوشه پروژه را انتخاب کنید.
                </li>
                <li className="p-3 rounded-2xl bg-[#141722] border border-[#1E2232]">
                  گوشی خود را با کابل USB وصل کنید و دکمه سبز رنگ <strong>Run (▶)</strong> بالای صفحه را فشار دهید؛ برنامه فوراً روی گوشی شما نصب و اجرا می‌شود!
                </li>
                <li className="p-3 rounded-2xl bg-[#141722] border border-[#1E2232]">
                  همچنین برای دریافت فایل خام `.apk`، از منوی بالا گزینه <strong>Build &gt; Build APKs</strong> را انتخاب نمایید.
                </li>
              </ol>

              {/* Terminal command snippet */}
              <div className="bg-[#12151E] border border-[#1E2232] rounded-2xl p-3">
                <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] mb-1.5">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-[#00D2FF]" />
                    <span>دستور یک‌خطی ترمینال:</span>
                  </span>
                  <button
                    onClick={handleCopyCmd}
                    className="flex items-center gap-1 text-[10px] text-[#00F59B] hover:underline"
                  >
                    {copiedCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd ? 'کپی شد' : 'کپی دستور'}</span>
                  </button>
                </div>
                <code className="text-xs text-[#00F59B] font-mono block dir-ltr text-left bg-[#090A0F] p-2 rounded-xl">
                  {gradleCmd}
                </code>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-3.5">
              <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A855F7]" />
                <span>نصب فوری همین نسخه در گوشی به عنوان اپلیکیشن (PWA):</span>
              </div>

              <p className="text-xs text-[#D1D5DB] leading-relaxed">
                اگر در حال حاضر به کامپیوتر دسترسی ندارید، می‌توانید همین صفحه را دقیقاً مانند یک اپلیکیشن مستقل روی گوشی نصب کنید:
              </p>

              <ol className="space-y-2.5 text-xs text-[#D1D5DB] leading-relaxed list-decimal list-inside">
                <li className="p-3 rounded-2xl bg-[#141722] border border-[#1E2232]">
                  آدرس این برنامه را در دستگاه اندروید خود باز کنید.
                </li>
                <li className="p-3 rounded-2xl bg-[#141722] border border-[#1E2232]">
                  منوی گزینه‌ها را بزنید.
                </li>
                <li className="p-3 rounded-2xl bg-[#141722] border border-[#1E2232]">
                  گزینه <strong>«نصب برنامه» (Install app)</strong> یا <strong>«افزودن به صفحه اصلی»</strong> را انتخاب کنید.
                </li>
                <li className="p-3 rounded-2xl bg-[#141722] border border-[#1E2232]">
                  برنامه روی دستگاه اندروید نصب شده و دسترسی کامل سخت‌افزاری فعال می‌شود.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#141722] border-t border-[#1E2232] flex items-center justify-between gap-3">
          <div className="text-[11px] text-[#9CA3AF] hidden sm:block">
            تولید خودکار کل ساختار دایرکتوری و سورس کاتلین بدون تداخل
          </div>

          <button
            onClick={handleDownloadPython}
            className="flex items-center gap-2 bg-[#00F59B] hover:bg-[#00D687] text-black font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-[#00F59B]/20 active:scale-95 ml-auto sm:ml-0"
          >
            <Download className="w-4 h-4" />
            <span>دانلود اسکریپت ساخت پروژه (setup_netmaster_project.py)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
