import React, { useState } from 'react';
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
  Sparkles,
  ArrowDownToLine,
  CheckCircle2
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSimulateFileShare = (type: 'apk' | 'video' | 'image' | 'document') => {
    const randomSizes = {
      apk: '14.8 MB',
      video: '42.1 MB',
      image: '3.4 MB',
      document: '1.2 MB',
    };
    const randomNames = {
      apk: `NetMaster_v2.4_${Math.floor(Math.random() * 899 + 100)}.apk`,
      video: `Offgrid_Recording_${Math.floor(Math.random() * 89 + 10)}.mp4`,
      image: `Cam_Snapshot_${Math.floor(Math.random() * 899 + 100)}.jpg`,
      document: `Network_Manual_${Math.floor(Math.random() * 89 + 10)}.pdf`,
    };

    const newFile: SharedFile = {
      id: `file-${Date.now()}`,
      name: randomNames[type],
      sizeFormatted: randomSizes[type],
      sizeBytes: 15000000,
      senderName: profile.username,
      senderIp: profile.localIp,
      timestamp: Date.now(),
      type: type,
      downloadUrl: '#',
    };
    onShareFile(newFile);
    showToast(`فایل ${newFile.name} با موفقیت در شبکه محلی به اشتراک گذاشته شد.`);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'apk':
        return <FileCode className="w-5 h-5 text-[#00F59B]" />;
      case 'video':
        return <Video className="w-5 h-5 text-[#00D2FF]" />;
      case 'image':
        return <Image className="w-5 h-5 text-[#FFB800]" />;
      default:
        return <FileText className="w-5 h-5 text-[#A855F7]" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07090E] text-white select-none overflow-hidden relative" dir="rtl">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-3 left-4 right-4 z-50 bg-[#0E1726] border border-[#00F59B]/40 text-white px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-2xl text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-[#00F59B] shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-tab switcher: Chat vs File Sharing */}
      <div className="p-2.5 bg-[#0D121F] border-b border-[#1E2638] flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-[#07090E] p-1 rounded-2xl border border-[#1E2638] w-full">
          <button
            onClick={() => setSubTab('chat')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'chat'
                ? 'bg-gradient-to-r from-[#00D2FF] to-[#00F59B] text-black shadow-md shadow-[#00D2FF]/20'
                : 'text-[#8B95A8] hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>پیام‌رسان آفلاین LAN</span>
            <span className="text-[10px] bg-black/30 px-2 py-0.2 rounded-full font-mono">
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('files')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'files'
                ? 'bg-gradient-to-r from-[#00D2FF] to-[#00F59B] text-black shadow-md shadow-[#00D2FF]/20'
                : 'text-[#8B95A8] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>انتقال پرسرعت فایل</span>
            <span className="text-[10px] bg-black/30 px-2 py-0.2 rounded-full font-mono">
              {files.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Panel */}
      {subTab === 'chat' ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {messages.map((msg) => {
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
                        ? 'bg-gradient-to-tr from-[#00D2FF] to-[#00F59B] text-black font-semibold rounded-tr-none'
                        : 'bg-[#0E1524] text-white border border-[#1E2638] rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat input bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-[#0D121F] border-t border-[#1E2638] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="پیام خود را در شبکه محلی بدون اینترنت بنویسید..."
              className="flex-1 bg-[#07090E] border border-[#1E2638] focus:border-[#00F59B] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#626E86] focus:outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#00F59B] hover:opacity-90 disabled:opacity-40 text-black flex items-center justify-center transition-all shadow-md shadow-[#00D2FF]/20 shrink-0"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-3 space-y-3 overflow-y-auto">
          {/* Quick Share Actions */}
          <div className="p-3 bg-[#0D121F] border border-[#1E2638] rounded-2xl space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#00F59B]" />
                اشتراک‌گذاری فوق‌سریع در LAN (تا ۵۰ مگابایت/ثانیه)
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleSimulateFileShare('apk')}
                className="p-2.5 bg-[#07090E] hover:bg-[#141A26] border border-[#1E2638] hover:border-[#00F59B]/50 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all"
              >
                <FileCode className="w-5 h-5 text-[#00F59B]" />
                <span className="text-[10px] text-white font-semibold">ارسال APK</span>
              </button>

              <button
                onClick={() => handleSimulateFileShare('video')}
                className="p-2.5 bg-[#07090E] hover:bg-[#141A26] border border-[#1E2638] hover:border-[#00D2FF]/50 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all"
              >
                <Video className="w-5 h-5 text-[#00D2FF]" />
                <span className="text-[10px] text-white font-semibold">ویدیو</span>
              </button>

              <button
                onClick={() => handleSimulateFileShare('image')}
                className="p-2.5 bg-[#07090E] hover:bg-[#141A26] border border-[#1E2638] hover:border-[#FFB800]/50 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all"
              >
                <Image className="w-5 h-5 text-[#FFB800]" />
                <span className="text-[10px] text-white font-semibold">عکس</span>
              </button>

              <button
                onClick={() => handleSimulateFileShare('document')}
                className="p-2.5 bg-[#07090E] hover:bg-[#141A26] border border-[#1E2638] hover:border-[#A855F7]/50 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all"
              >
                <FileBox className="w-5 h-5 text-[#A855F7]" />
                <span className="text-[10px] text-white font-semibold">سند / PDF</span>
              </button>
            </div>
          </div>

          {/* Shared Files List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8B95A8] px-1 font-semibold">
              <span>فایل‌های آماده دریافت ({files.length})</span>
              <span className="text-[10px] font-mono text-[#00F59B]">سرعت لینک: 1 Gbps</span>
            </div>

            {files.map((file) => (
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
                      <span>ارسال: {file.senderName}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => showToast(`فایل ${file.name} با موفقیت در پوشه دانلود ذخیره شد.`)}
                  className="px-3.5 py-1.5 bg-[#00F59B]/15 hover:bg-[#00F59B]/25 text-[#00F59B] border border-[#00F59B]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>دریافت</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
