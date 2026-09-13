import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Zap,
  Download,
  FileCode,
  FileBox,
  Image,
  Video,
  FileText,
  MessageSquare,
  Share2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ArrowDownToLine,
  HardDrive,
  UploadCloud
} from 'lucide-react';
import { ChatMessage, SharedFile, UserProfile } from '../types';
import {
  requestStoragePermission,
  checkSystemPermissions,
  subscribePermissionChanges
} from '../utils/systemPermissions';

interface LocalAirDropTabProps {
  messages: ChatMessage[];
  files: SharedFile[];
  profile: UserProfile;
  isDark?: boolean;
  onSendMessage: (text: string) => void;
  onShareFile: (file: SharedFile) => void;
}

export const LocalAirDropTab: React.FC<LocalAirDropTabProps> = ({
  messages,
  files,
  profile,
  isDark = true,
  onSendMessage,
  onShareFile,
}) => {
  const [inputText, setInputText] = useState('');
  const [subTab, setSubTab] = useState<'chat' | 'files'>('chat');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storagePermission, setStoragePermission] = useState<'granted' | 'prompt' | 'denied'>('prompt');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    checkSystemPermissions().then((status) => {
      setStoragePermission(status.storage);
    });

    const unsubscribe = subscribePermissionChanges((status) => {
      setStoragePermission(status.storage);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleGrantPermission = async () => {
    const result = await requestStoragePermission();
    if (result.success || result.status === 'granted') {
      setStoragePermission('granted');
      showToast('مجوز دسترسی به فایل‌های حافظه با موفقیت اعطا شد.');
    } else {
      showToast('خطا در دریافت مجوز حافظه. لطفاً در تنظیمات دستگاه اجازه دهید.');
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const processRealFiles = (incomingFiles: FileList | null, isFromChat = false) => {
    if (!incomingFiles || incomingFiles.length === 0) return;

    const fileList = Array.from(incomingFiles);
    fileList.forEach((file) => {
      let type: SharedFile['type'] = 'other';
      if (file.name.endsWith('.apk') || file.type.includes('package-archive')) type = 'apk';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) type = 'document';

      let sizeFormatted = `${(file.size / 1024).toFixed(1)} KB`;
      if (file.size > 1024 * 1024) {
        sizeFormatted = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      }

      const downloadUrl = URL.createObjectURL(file);

      const sharedFile: SharedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        sizeBytes: file.size,
        sizeFormatted,
        type,
        senderName: profile.username || 'کاربر محلی',
        senderIp: profile.localIp,
        timestamp: Date.now(),
        downloadUrl,
      };

      onShareFile(sharedFile);

      if (isFromChat) {
        onSendMessage(`📎 [ارسال فایل]: ${file.name} (${sizeFormatted})`);
      }
    });

    showToast(`${fileList.length} فایل واقعی با موفقیت در شبکه محلی به اشتراک گذاشته شد.`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processRealFiles(e.target.files, false);
    if (e.target) e.target.value = '';
  };

  const handleChatFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processRealFiles(e.target.files, true);
    if (e.target) e.target.value = '';
  };

  const openFilePicker = (acceptFilter: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptFilter;
      fileInputRef.current.click();
    }
  };

  const handleDownload = (file: SharedFile) => {
    if (file.downloadUrl) {
      const a = document.createElement('a');
      a.href = file.downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`فایل ${file.name} با موفقیت در دستگاه شما ذخیره شد.`);
    } else {
      const blob = new Blob([`NetMaster Transfer\nFile: ${file.name}\nSize: ${file.sizeFormatted}`], {
        type: 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`فایل ${file.name} آماده‌سازی و بارگیری شد.`);
    }
  };

  const getFileIcon = (type: SharedFile['type']) => {
    switch (type) {
      case 'apk':
        return <FileCode className="w-5 h-5 text-[#4CC9F0]" />;
      case 'video':
        return <Video className="w-5 h-5 text-[#70A5D8]" />;
      case 'image':
        return <Image className="w-5 h-5 text-[#38BDF8]" />;
      case 'document':
        return <FileText className="w-5 h-5 text-[#818CF8]" />;
      default:
        return <FileBox className="w-5 h-5 text-[#A78BFA]" />;
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col h-full select-none overflow-hidden relative transition-colors duration-300 ${
        isDark ? 'bg-[#07090E] text-white' : 'bg-[#F8FAFC] text-slate-800'
      }`}
      dir="rtl"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        processRealFiles(e.dataTransfer.files, subTab === 'chat');
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        multiple
      />
      <input
        type="file"
        ref={chatFileInputRef}
        onChange={handleChatFileInputChange}
        className="hidden"
        multiple
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[#07090E]/90 border-2 border-dashed border-[#4CC9F0] flex flex-col items-center justify-center p-6 text-center space-y-3 pointer-events-none">
          <UploadCloud className="w-14 h-14 text-[#4CC9F0] animate-bounce" />
          <div className="text-sm font-bold text-white">فایل‌ها را رها کنید تا در شبکه محلی ارسال شوند</div>
          <div className="text-xs text-[#94A3B8]">انتقال مستقیم با حداکثر سرعت لینک محلی</div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-3 left-4 right-4 z-50 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-2xl text-xs font-semibold border ${
              isDark
                ? 'bg-[#0E1726] border-[#4CC9F0]/50 text-white'
                : 'bg-white border-[#4CC9F0] text-slate-800 shadow-lg'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#4CC9F0] shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-tab switcher: Chat vs File Sharing */}
      <div
        className={`p-2.5 border-b flex items-center justify-between shrink-0 transition-colors ${
          isDark ? 'bg-[#0D121F] border-[#1E2638]' : 'bg-slate-100/90 border-slate-200'
        }`}
      >
        <div
          className={`flex items-center gap-1.5 p-1 rounded-2xl border w-full ${
            isDark ? 'bg-[#07090E] border-[#1E2638]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <button
            onClick={() => setSubTab('chat')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'chat'
                ? 'bg-[#4CC9F0] text-[#111318] shadow-md shadow-[#4CC9F0]/20 font-extrabold'
                : isDark
                ? 'text-[#8B95A8] hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>پیام‌رسان آفلاین LAN</span>
            <span className="text-[10px] bg-black/10 px-2 py-0.2 rounded-full font-mono">
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('files')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'files'
                ? 'bg-[#4CC9F0] text-[#111318] shadow-md shadow-[#4CC9F0]/20 font-extrabold'
                : isDark
                ? 'text-[#8B95A8] hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>انتقال پرسرعت فایل</span>
            <span className="text-[10px] bg-black/10 px-2 py-0.2 rounded-full font-mono">
              {files.length}
            </span>
          </button>
        </div>
      </div>

      {/* Storage Access Permission Bar - ONLY shown until granted */}
      {storagePermission !== 'granted' && (
        <div className="px-3 pt-2.5 shrink-0">
          <div
            className={`p-2.5 rounded-xl flex items-center justify-between text-xs border ${
              isDark
                ? 'bg-[#0E1524] border-[#1E2638] text-white'
                : 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#4CC9F0] shrink-0" />
              <div>
                <div className="font-bold text-[11px] flex items-center gap-1.5">
                  <span>مجوز دسترسی به فایل‌های حافظه (Storage Access)</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-md font-bold">
                    نیاز به مجوز
                  </span>
                </div>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-[#8B95A8]' : 'text-slate-500'}`}>
                  برای اشتراک فایل در شبکه و ارسال فایل در چت، مجوز دسترسی لازم است.
                </p>
              </div>
            </div>

            <button
              onClick={handleGrantPermission}
              className="px-2.5 py-1 bg-[#4CC9F0]/20 hover:bg-[#4CC9F0]/30 text-[#0284C7] dark:text-[#4CC9F0] border border-[#4CC9F0]/40 rounded-lg text-[10px] font-bold transition-colors shrink-0 cursor-pointer"
            >
              تأیید مجوز دسترسی
            </button>
          </div>
        </div>
      )}

      {/* Main Panel Content */}
      {subTab === 'chat' ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#8B95A8]">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-[#4CC9F0] ${
                    isDark ? 'bg-[#0D121F] border-[#1E2638]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <MessageSquare className="w-6 h-6 opacity-80" />
                </div>
                <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  هنوز پیامی ارسال نشده است
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  پیام‌های شما و فایل‌های ارسالی در بستر شبکه محلی (LAN / Hotspot) بدون نیاز به اینترنت و با سرعت بالا منتقل می‌شوند.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderName === profile.username || msg.senderId === 'me';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      isMe ? 'mr-auto items-end' : 'ml-auto items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#8B95A8]">
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                        {msg.senderName}
                      </span>
                      <span className="font-mono text-[9px]">
                        {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-md ${
                        isMe
                          ? 'bg-[#4CC9F0] text-[#111318] font-semibold rounded-tr-none'
                          : isDark
                          ? 'bg-[#0E1524] text-white border border-[#1E2638] rounded-tl-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat input bar with File Attachment button */}
          <form
            onSubmit={handleSend}
            className={`p-3 border-t flex items-center gap-2 shrink-0 ${
              isDark ? 'bg-[#0D121F] border-[#1E2638]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => {
                if (chatFileInputRef.current) {
                  chatFileInputRef.current.click();
                }
              }}
              title="ارسال فایل در چت با مجوز دسترسی به فایل‌ها"
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isDark
                  ? 'bg-[#07090E] hover:bg-[#141A26] border-[#1E2638] hover:border-[#4CC9F0]/40 text-[#4CC9F0]'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-[#0284C7]'
              }`}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="پیام خود را در شبکه محلی بنویسید یا فایل ضمیمه کنید..."
              className={`flex-1 border rounded-xl px-3.5 py-2 text-xs focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#07090E] border-[#1E2638] focus:border-[#4CC9F0] text-white placeholder-[#626E86]'
                  : 'bg-slate-50 border-slate-200 focus:border-[#4CC9F0] text-slate-800 placeholder-slate-400'
              }`}
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-xl bg-[#4CC9F0] hover:opacity-90 disabled:opacity-40 text-[#111318] flex items-center justify-center transition-all shadow-md shadow-[#4CC9F0]/20 shrink-0 font-bold cursor-pointer"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-3 space-y-3 overflow-y-auto">
          {/* Quick Share Actions using Real Device File Access */}
          <div
            className={`p-3.5 border rounded-2xl space-y-3 shadow-lg ${
              isDark ? 'bg-[#0D121F] border-[#1E2638]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <Share2 className="w-4 h-4 text-[#4CC9F0]" />
                <span>انتخاب و اشتراک‌گذاری فایل واقعی از دستگاه</span>
              </span>
              <span className="text-[10px] text-[#4CC9F0] font-mono">P2P LAN</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => openFilePicker('.apk,application/vnd.android.package-archive,*/*')}
                className={`p-3 border rounded-xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#07090E] hover:bg-[#141A26] border-[#1E2638] hover:border-[#4CC9F0]/50'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <FileCode className="w-5 h-5 text-[#4CC9F0]" />
                <span className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  انتخاب فایل APK
                </span>
              </button>

              <button
                onClick={() => openFilePicker('video/*')}
                className={`p-3 border rounded-xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#07090E] hover:bg-[#141A26] border-[#1E2638] hover:border-[#70A5D8]/50'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <Video className="w-5 h-5 text-[#70A5D8]" />
                <span className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  انتخاب ویدیو
                </span>
              </button>

              <button
                onClick={() => openFilePicker('image/*')}
                className={`p-3 border rounded-xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#07090E] hover:bg-[#141A26] border-[#1E2638] hover:border-[#38BDF8]/50'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <Image className="w-5 h-5 text-[#38BDF8]" />
                <span className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  انتخاب عکس
                </span>
              </button>

              <button
                onClick={() => openFilePicker('*/*')}
                className={`p-3 border rounded-xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#07090E] hover:bg-[#141A26] border-[#1E2638] hover:border-[#818CF8]/50'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <FileBox className="w-5 h-5 text-[#818CF8]" />
                <span className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  تمام اسناد / PDF
                </span>
              </button>
            </div>
          </div>

          {/* Shared Files List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8B95A8] px-1 font-semibold">
              <span>فایل‌های آماده دریافت در شبکه ({files.length})</span>
              <span className="text-[10px] font-mono text-[#4CC9F0]">لینک مستقیم P2P</span>
            </div>

            {files.length === 0 ? (
              <div
                className={`p-8 rounded-2xl border border-dashed text-center space-y-2 ${
                  isDark
                    ? 'border-[#1E2638] bg-[#0D121F]/40'
                    : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                <FolderOpen className="w-10 h-10 mx-auto text-[#4CC9F0] opacity-60" />
                <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  هنوز فایلی در شبکه به اشتراک گذاشته نشده است
                </div>
                <div className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  با کلیک روی دکمه‌های بالا یا کشیدن فایل به داخل این پنجره، فایل واقعی از گوشی یا سیستم خود انتخاب کرده و ارسال کنید.
                </div>
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className={`p-3 border rounded-2xl flex items-center justify-between gap-3 shadow-md ${
                    isDark ? 'bg-[#0D121F] border-[#1E2638]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-[#07090E] border-[#1E2638]' : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      {getFileIcon(file.type)}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-xs font-bold block truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {file.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-[#8B95A8] font-mono mt-0.5">
                        <span>{file.sizeFormatted}</span>
                        <span>•</span>
                        <span>ارسال‌کننده: {file.senderName}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(file)}
                    className="px-3.5 py-1.5 bg-[#4CC9F0]/15 hover:bg-[#4CC9F0]/25 text-[#0284C7] dark:text-[#4CC9F0] border border-[#4CC9F0]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>دریافت فایل</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
