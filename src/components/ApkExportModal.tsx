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
  isDark?: boolean;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({
  isOpen,
  onClose,
  onDownloadZip,
  onViewGithubWorkflow,
  isDark = true,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border transition-colors ${
          isDark
            ? 'bg-[#0F1118] border-[#1E2232] text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F59B] to-[#00D2FF] p-0.5 flex items-center justify-center shadow-lg shadow-[#00F59B]/20">
              <div className={`w-full h-full rounded-[14px] flex items-center justify-center text-[#00F59B] ${
                isDark ? 'bg-[#0F1118]' : 'bg-white'
              }`}>
                <Smartphone className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>دریافت و ساخت فایل APK (بدون نیاز به کدنویسی)</span>
              </h3>
              <p className={`text-[11px] sm:text-xs mt-0.5 ${isDark ? 'text-[#9CA3AF]' : 'text-slate-500'}`}>
                ساده‌ترین راه‌ها برای داشتن فایل نصبی برنامه روی گوشی واقعی شما
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'bg-[#1E2232] hover:bg-[#2A3045] text-[#9CA3AF] hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Summary Pill Banner */}
        <div className={`p-3.5 border-b flex items-start gap-2.5 ${
          isDark ? 'bg-[#12151E] border-[#1E2232]' : 'bg-slate-100/70 border-slate-200'
        }`}>
          <Zap className="w-4 h-4 text-[#00F59B] shrink-0 mt-0.5" />
          <div className={`text-xs leading-relaxed ${isDark ? 'text-[#D1D5DB]' : 'text-slate-700'}`}>
            اگر با برنامه‌نویسی آشنا نیستید هیچ مشکلی نیست! کل پروژه کاملاً آماده و طراحی شده است. از میان روش‌های زیر، هرکدام برای شما راحت‌تر است را انتخاب کنید:
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`p-2.5 border-b flex items-center gap-1.5 overflow-x-auto ${
          isDark ? 'bg-[#0F1118] border-[#1E2232]' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('easy')}
            className={`flex-1 min-w-[140px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'easy'
                ? 'bg-[#00F59B] text-black shadow-md shadow-[#00F59B]/20 font-bold'
                : isDark
                ? 'text-[#9CA3AF] hover:text-white bg-[#141722]'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>روش ۱: کلاد گیتهاب (APK آماده)</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex-1 min-w-[140px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'scripts'
                ? 'bg-[#FFB800] text-black shadow-md shadow-[#FFB800]/20 font-bold'
                : isDark
                ? 'text-[#9CA3AF] hover:text-white bg-[#141722]'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>روش ۲: اسکریپت خودکار پایتون</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-[#00D2FF] text-black shadow-md shadow-[#00D2FF]/20 font-bold'
                : isDark
                ? 'text-[#9CA3AF] hover:text-white bg-[#141722]'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>روش ۳: Android Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-[#A855F7] text-white shadow-md shadow-[#A855F7]/20 font-bold'
                : isDark
                ? 'text-[#9CA3AF] hover:text-white bg-[#141722]'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
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
              <div className={`text-xs sm:text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <CheckCircle2 className="w-4 h-4 text-[#FFB800]" />
                <span>ساخت فوری تمام پوشه‌ها و فایل‌های پروژه در کامپیوتر با اسکریپت خودکار:</span>
              </div>

              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#D1D5DB]' : 'text-slate-700'}`}>
                این اسکریپت پایتون تمام ساختار استاندارد اندروید استودیو شامل مسیرهای <code className="text-[#00F59B]">app/src/main/java/...</code> و گریدل را در چند ثانیه به صورت فایل‌های مجزا می‌سازد.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleDownloadPython}
                  className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border font-bold text-xs transition-all shadow-md active:scale-98 cursor-pointer ${
                    isDark
                      ? 'bg-[#1E2638] hover:bg-[#2A354C] border-[#FFB800]/40 text-[#FFB800]'
                      : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود اسکریپت setup_netmaster_project.py</span>
                </button>

                <button
                  onClick={handleDownloadBash}
                  className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border font-bold text-xs transition-all shadow-md active:scale-98 cursor-pointer ${
                    isDark
                      ? 'bg-[#1E2638] hover:bg-[#2A354C] border-[#00D2FF]/40 text-[#00D2FF]'
                      : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-800'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>دانلود اسکریپت لینوکس/مک setup_project.sh</span>
                </button>
              </div>

              <div className={`p-3 border rounded-2xl space-y-1.5 text-xs ${
                isDark ? 'bg-[#0A0D14] border-[#1E2638] text-[#9CA3AF]' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>دستور اجرا در کامپیوتر:</div>
                <code className={`block p-2 rounded-xl font-mono dir-ltr text-left ${
                  isDark ? 'bg-[#121826] text-[#00F59B]' : 'bg-white border border-slate-200 text-emerald-700'
                }`}>
                  python setup_netmaster_project.py
                </code>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  این دستور پوشه‌های کامل پروژه را می‌سازد و می‌توانید فوراً پوشه را در Android Studio باز کرده و دکمه Run را بزنید!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'easy' && (
            <div className="space-y-3.5">
              <div className={`text-xs sm:text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <CheckCircle2 className="w-4 h-4 text-[#00F59B]" />
                <span>ساخت خودکار فایل APK در فضای ابری (بدون نیاز به نصب هیچ ابزاری):</span>
              </div>

              <div className={`space-y-2.5 text-xs leading-relaxed ${isDark ? 'text-[#D1D5DB]' : 'text-slate-700'}`}>
                <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                  isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="w-6 h-6 rounded-full bg-[#00F59B]/20 text-[#00F59B] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ۱
                  </div>
                  <div>
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>دانلود پکیج کامل پروژه:</strong> روی دکمه سبز رنگ پایین کلیک کنید تا اسکریپت ساخت پروژه را دریافت کنید.
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                  isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="w-6 h-6 rounded-full bg-[#00F59B]/20 text-[#00F59B] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ۲
                  </div>
                  <div>
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>آپلود در مخزن GitHub:</strong> وارد سایت <span className="text-[#00D2FF]">github.com</span> شوید، گزینه New Repository را بزنید و محتویات را آپلود کنید.
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                  isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="w-6 h-6 rounded-full bg-[#00F59B]/20 text-[#00F59B] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ۳
                  </div>
                  <div>
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>دانلود مستقیم APK:</strong> فایل خودکار بیلد (GitHub Action) که از قبل در پروژه قرار داده‌ایم، در تب Actions فایل <code className={`px-1.5 py-0.5 rounded ${isDark ? 'text-[#00F59B] bg-[#0F1118]' : 'text-emerald-700 bg-slate-200'}`}>NetMaster.apk</code> را برای دانلود می‌گذارد.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="space-y-3.5">
              <div className={`text-xs sm:text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Play className="w-4 h-4 text-[#00D2FF]" />
                <span>نصب با برنامه رایگان Android Studio (تنها با ۲ کلیک):</span>
              </div>

              <ol className={`space-y-2.5 text-xs leading-relaxed list-decimal list-inside ${isDark ? 'text-[#D1D5DB]' : 'text-slate-700'}`}>
                <li className={`p-3 rounded-2xl border ${isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'}`}>
                  فایل پروژه را با اسکریپت تولید کرده و در سیستم خود باز کنید.
                </li>
                <li className={`p-3 rounded-2xl border ${isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'}`}>
                  نرم‌افزار <strong>Android Studio</strong> را باز کرده و پوشه پروژه را انتخاب کنید.
                </li>
                <li className={`p-3 rounded-2xl border ${isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'}`}>
                  گوشی خود را با کابل USB وصل کنید و دکمه سبز رنگ <strong>Run (▶)</strong> بالای صفحه را فشار دهید؛ برنامه فوراً روی گوشی شما نصب و اجرا می‌شود!
                </li>
                <li className={`p-3 rounded-2xl border ${isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'}`}>
                  همچنین برای دریافت فایل خام `.apk`، از منوی بالا گزینه <strong>Build &gt; Build APKs</strong> را انتخاب نمایید.
                </li>
              </ol>

              {/* Terminal command snippet */}
              <div className={`border rounded-2xl p-3 ${isDark ? 'bg-[#12151E] border-[#1E2232]' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex items-center justify-between text-[11px] mb-1.5 ${isDark ? 'text-[#9CA3AF]' : 'text-slate-500'}`}>
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-[#00D2FF]" />
                    <span>دستور یک‌خطی ترمینال:</span>
                  </span>
                  <button
                    onClick={handleCopyCmd}
                    className="flex items-center gap-1 text-[10px] text-[#00F59B] hover:underline cursor-pointer"
                  >
                    {copiedCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd ? 'کپی شد' : 'کپی دستور'}</span>
                  </button>
                </div>
                <code className={`text-xs font-mono block dir-ltr text-left p-2 rounded-xl ${
                  isDark ? 'text-[#00F59B] bg-[#090A0F]' : 'text-emerald-700 bg-white border border-slate-200'
                }`}>
                  {gradleCmd}
                </code>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-3.5">
              <div className={`text-xs sm:text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Sparkles className="w-4 h-4 text-[#A855F7]" />
                <span>نصب فوری همین نسخه در گوشی به عنوان اپلیکیشن (PWA):</span>
              </div>

              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#D1D5DB]' : 'text-slate-700'}`}>
                می‌توانید این برنامه را مستقیماً مانند یک اپلیکیشن مستقل روی گوشی اندروید نصب کنید:
              </p>

              <ol className={`space-y-2.5 text-xs leading-relaxed list-decimal list-inside ${isDark ? 'text-[#D1D5DB]' : 'text-slate-700'}`}>
                <li className={`p-3 rounded-2xl border ${isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'}`}>
                  آدرس این برنامه را در دستگاه اندروید خود باز کنید.
                </li>
                <li className={`p-3 rounded-2xl border ${isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'}`}>
                  منوی مرورگر کروم را باز کنید.
                </li>
                <li className={`p-3 rounded-2xl border ${isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'}`}>
                  گزینه <strong>«نصب برنامه» (Install app)</strong> یا <strong>«افزودن به صفحه اصلی»</strong> را انتخاب کنید.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#141722] border-[#1E2232]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`text-[11px] hidden sm:block ${isDark ? 'text-[#9CA3AF]' : 'text-slate-500'}`}>
            تولید خودکار کل ساختار دایرکتوری و سورس کاتلین بدون تداخل
          </div>

          <button
            onClick={handleDownloadPython}
            className="flex items-center gap-2 bg-[#00F59B] hover:bg-[#00D687] text-black font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-[#00F59B]/20 active:scale-95 ml-auto sm:ml-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود اسکریپت ساخت پروژه (setup_netmaster_project.py)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
