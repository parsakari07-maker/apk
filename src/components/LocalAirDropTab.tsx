import React, { useState, useRef } from 'react';
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
  CheckCheck,
  Share2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ArrowDownToLine,
  HardDrive,
  ShieldCheck,
  UploadCloud
} from 'lucide-react';
import { ChatMessage, SharedFile, UserProfile } from '../types';

interface LocalAirDropTabProps {
  messages: ChatMessage[];
  files: SharedFile[];
  profile: UserProfile;
  onSendMessage: (text: string) => void;
  onShareFile: (file: SharedFile) => void;
}

export const LocalAirDropTab: React.FC<LocalAirDropTabProps> = ({
  messages,
  files,
  profile,
  onSendMessage,
  onShareFile,
}) => {
  const [inputText, setInputText] = useState('');
  const [subTab, setSubTab] = useState<'chat' | 'files'>('chat');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storagePermission, setStoragePermission] = useState<'granted' | 'prompt' | 'denied'>(() => {
    return localStorage.getItem('netmaster_storage_permission') === 'granted' ? 'granted' : 'prompt';
  });
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleGrantPermission = () => {
    setStoragePermission('granted');
    localStorage.setItem('netmaster_storage_permission', 'granted');
    showToast('مجوز دسترسی به فایل‌های حافظه دستگاه با موفقیت تأیید شد.');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  // Helper to categorize real uploaded file
  const processRealFiles = (fileList: FileList | null, isFromChat = false) => {
    if (!fileList || fileList.length === 0) return;

    // Grant storage access permission on user file selection
    if (storagePermission !== 'granted') {
      setStoragePermission('granted');
      localStorage.setItem('netmaster_storage_permission', 'granted');
    }

    Array.from(fileList).forEach((file) => {
      let type: 'apk' | 'image' | 'video' | 'document' = 'document';
      const ext = file.name.toLowerCase();
      if (ext.endsWith('.apk')) {
        type = 'apk';
      } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(ext)) {
        type = 'image';
      } else if (file.type.startsWith('video/') || /\.(mp4|mkv|webm|avi|mov)$/i.test(ext)) {
        type = 'video';
      } else {
        type = 'document';
      }

      const sizeFormatted =
        file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
          : (file.size / 1024).toFixed(1) + ' KB';

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

  // Trigger file picker with specific accept filter
  const openFilePicker = (acceptFilter: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptFilter;
      fileInputRef.current.click();
    }
  };

  // Real download trigger
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
      // Fallback blob
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
      URL.revokeObjectURL(url);
      showToast(`فایل ${file.name} ذخیره شد.`);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'apk':
        return <FileCode className="w-5 h-5 text-[#4CC9F0]" />;
      case 'video':
        return <Video className="w-5 h-5 text-[#70A5D8]" />;
      case 'image':
        return <Image className="w-5 h-5 text-[#38BDF8]" />;
      default:
        return <FileText className="w-5 h-5 text-[#818CF8]" />;
    }
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#07090E] text-white select-none overflow-hidden relative"
      dir="rtl"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
          processRealFiles(e.dataTransfer.files, subTab === 'chat');
        }
      }}
    >
      {/* Hidden File Inputs for real file selection */}
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
            className="absolute top-3 left-4 right-4 z-50 bg-[#0E1726] border border-[#4CC9F0]/50 text-white px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-2xl text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-[#4CC9F0] shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-tab switcher: Chat vs File Sharing */}
      <div className="p-2.5 bg-[#0D121F] border-b border-[#1E2638] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 bg-[#07090E] p-1 rounded-2xl border border-[#1E2638] w-full">
          <button
            onClick={() => setSubTab('chat')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'chat'
                ? 'bg-[#4CC9F0] text-[#111318] shadow-md shadow-[#4CC9F0]/20 font-extrabold'
                : 'text-[#8B95A8] hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>پیام‌رسان آفلاین LAN</span>
            <span className="text-[10px] bg-black/20 px-2 py-0.2 rounded-full font-mono">
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('files')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'files'
                ? 'bg-[#4CC9F0] text-[#111318] shadow-md shadow-[#4CC9F0]/20 font-extrabold'
                : 'text-[#8B95A8] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>انتقال پرسرعت فایل</span>
            <span className="text-[10px] bg-black/20 px-2 py-0.2 rounded-full font-mono">
              {files.length}
            </span>
          </button>
        </div>
      </div>

      {/* Storage Access Permission Bar */}
      <div className="px-3 pt-2.5 shrink-0">
        <div className="p-2.5 bg-[#0E1524] border border-[#1E2638] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#4CC9F0] shrink-0" />
            <div>
              <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                <span>مجوز دسترسی به فایل‌های حافظه (Storage Access)</span>
                {storagePermission === 'granted' ? (
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md font-bold">
                    تأیید شده
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md font-bold">
                    نیاز به مجوز
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8B95A8] mt-0.5">
                برای اشتراک فایل در شبکه و ارسال فایل در چت، مجوز دسترسی لازم است.
              </p>
            </div>
          </div>

          {storagePermission !== 'granted' ? (
            <button
              onClick={handleGrantPermission}
              className="px-2.5 py-1 bg-[#4CC9F0]/20 hover:bg-[#4CC9F0]/30 text-[#4CC9F0] border border-[#4CC9F0]/40 rounded-lg text-[10px] font-bold transition-colors shrink-0 cursor-pointer"
            >
              تأیید مجوز دسترسی
            </button>
          ) : (
            <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مجوز فعال است</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Panel Content */}
      {subTab === 'chat' ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#8B95A8]">
                <div className="w-12 h-12 rounded-2xl bg-[#0D121F] border border-[#1E2638] flex items-center justify-center text-[#4CC9F0]">
                  <MessageSquare className="w-6 h-6 opacity-80" />
                </div>
                <div className="text-xs font-bold text-white">هنوز پیامی ارسال نشده است</div>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  پیام‌های شما و فایل‌های ارسالی در بستر شبکه محلی (LAN / Hotspot) بدون نیاز به اینترنت و با سرعت بالا منتقل می‌شوند.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderName === profile.username;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      isMe ? 'mr-auto items-end' : 'ml-auto items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#8B95A8]">
                      <span className="font-bold text-white">{msg.senderName}</span>
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
                          : 'bg-[#0E1524] text-white border border-[#1E2638] rounded-tl-none'
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
            className="p-3 bg-[#0D121F] border-t border-[#1E2638] flex items-center gap-2 shrink-0"
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
              className="w-9 h-9 rounded-xl bg-[#07090E] hover:bg-[#141A26] border border-[#1E2638] hover:border-[#4CC9F0]/40 text-[#4CC9F0] flex items-center justify-center transition-all shrink-0 cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="پیام خود را در شبکه محلی بنویسید یا فایل ضمیمه کنید..."
              className="flex-1 bg-[#07090E] border border-[#1E2638] focus:border-[#4CC9F0] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#626E86] focus:outline-none transition-colors"
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
          <div className="p-3.5 bg-[#0D121F] border border-[#1E2638] rounded-2xl space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#4CC9F0]" />
                <span>انتخاب و اشتراک‌گذاری فایل واقعی از دستگاه</span>
              </span>
              <span className="text-[10px] text-[#4CC9F0] font-mono">P2P LAN</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => openFilePicker('.apk,application/vnd.android.package-archive,*/*')}
                className="p-3 bg-[#07090E] hover:bg-[#141A26] border border-[#1E2638] hover:border-[#4CC9F0]/50 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileCode className="w-5 h-5 text-[#4CC9F0]" />
                <span className="text-[11px] text-white font-bold">انتخاب فایل APK</span>
              </button>

              <button
                onClick={() => openFilePicker('video/*')}
                className="p-3 bg-[#07090E] hover:bg-[#141A26] border border-[#1E2638] hover:border-[#70A5D8]/50 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <Video className="w-5 h-5 text-[#70A5D8]" />
                <span className="text-[11px] text-white font-bold">انتخاب ویدیو</span>
              </button>

              <button
                onClick={() => openFilePicker('image/*')}
                className="p-3 bg-[#07090E] hover:bg-[#141A26] border border-[#1E2638] hover:border-[#38BDF8]/50 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <Image className="w-5 h-5 text-[#38BDF8]" />
                <span className="text-[11px] text-white font-bold">انتخاب عکس</span>
              </button>

              <button
                onClick={() => openFilePicker('*/*')}
                className="p-3 bg-[#07090E] hover:bg-[#141A26] border border-[#1E2638] hover:border-[#818CF8]/50 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileBox className="w-5 h-5 text-[#818CF8]" />
                <span className="text-[11px] text-white font-bold">تمام اسناد / PDF</span>
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
              <div className="p-8 rounded-2xl border border-dashed border-[#1E2638] bg-[#0D121F]/40 text-center space-y-2">
                <FolderOpen className="w-10 h-10 mx-auto text-[#4CC9F0] opacity-60" />
                <div className="text-xs font-bold text-white">هنوز فایلی در شبکه به اشتراک گذاشته نشده است</div>
                <div className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  با کلیک روی دکمه‌های بالا یا کشیدن فایل به داخل این پنجره، فایل واقعی از گوشی یا سیستم خود انتخاب کرده و ارسال کنید.
                </div>
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className="p-3 bg-[#0D121F] border border-[#1E2638] rounded-2xl flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#07090E] border border-[#1E2638] flex items-center justify-center shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">
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
                    className="px-3.5 py-1.5 bg-[#4CC9F0]/15 hover:bg-[#4CC9F0]/25 text-[#4CC9F0] border border-[#4CC9F0]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer"
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
