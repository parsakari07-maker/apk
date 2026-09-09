import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Search, Terminal, Code2, Layers } from 'lucide-react';
import { ANDROID_FILES } from '../data/sourceCode';
import { CodeTabKey } from '../types';

interface CodeInspectorProps {
  initialTab?: CodeTabKey;
}

export const CodeInspector: React.FC<CodeInspectorProps> = ({ initialTab = 'walkieSound' }) => {
  const [activeFileKey, setActiveFileKey] = useState<CodeTabKey>(initialTab);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const currentFile = ANDROID_FILES[activeFileKey] || ANDROID_FILES['walkieSound'];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const lines = currentFile.code.split('\n');

  return (
    <div className="w-full h-full flex flex-col bg-[#121214] text-white rounded-2xl border border-[#2A2A35] overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="bg-[#18181C] border-b border-[#2A2A35] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00E676]/15 border border-[#00E676]/30 flex items-center justify-center text-[#00E676]">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>استودیوی معماری و کدهای کامل اندروید (Kotlin & Jetpack Compose)</span>
              <span className="text-[10px] bg-[#2A2A35] text-[#00E676] px-2 py-0.5 rounded-full font-mono">
                Production-Ready
              </span>
            </div>
            <div className="text-xs text-[#A0A0AB]">
              کدهای ۴ تحویل درخواستی کاربر با معماری لایه‌ای، پروتکل‌های آفلاین و تایپوگرافی وزیرمتن
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-[#2A2A35] hover:bg-[#3A3A4A] text-white text-xs px-3 py-2 rounded-xl border border-[#3F3F4E] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00E676]" />
                <span className="text-[#00E676]">کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>کپی این فایل</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadSingle}
            className="flex items-center gap-1.5 bg-[#00E676] hover:bg-[#00C853] text-black font-bold text-xs px-3.5 py-2 rounded-xl transition-transform active:scale-95 shadow-md shadow-[#00E676]/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود فایل ({currentFile.filename})</span>
          </button>
        </div>
      </div>

      {/* File Tabs */}
      <div className="bg-[#151518] border-b border-[#2A2A35] px-4 flex items-center gap-1.5 overflow-x-auto py-2">
        {(Object.keys(ANDROID_FILES) as CodeTabKey[]).map((key) => {
          const file = ANDROID_FILES[key];
          const isActive = activeFileKey === key;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveFileKey(key);
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#1E1E24] text-white border border-[#3A86FF] shadow-md shadow-[#3A86FF]/10 font-semibold'
                  : 'bg-transparent text-[#A0A0AB] hover:bg-[#1E1E24]/60 hover:text-white border border-transparent'
              }`}
            >
              <FileCode
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-[#3A86FF]' : 'text-[#71717A]'
                }`}
              />
              <span>{file.filename}</span>
              {key === 'manifest' ? (
                <span className="text-[9px] bg-[#E91E63]/20 text-[#E91E63] px-1.5 py-0.5 rounded font-sans font-bold">
                  مجوزها
                </span>
              ) : key === 'gradle' ? (
                <span className="text-[9px] bg-[#0288D1]/20 text-[#0288D1] px-1.5 py-0.5 rounded font-sans font-bold">
                  گریدل
                </span>
              ) : key === 'mainScreen' ? (
                <span className="text-[9px] bg-[#00E676]/20 text-[#00E676] px-1.5 py-0.5 rounded font-sans font-bold">
                  ۵ ماژول Compose
                </span>
              ) : key === 'radarScreen' ? (
                <span className="text-[9px] bg-[#00E676]/20 text-[#00E676] px-1.5 py-0.5 rounded font-sans font-bold">
                  رادار & قطب‌نما
                </span>
              ) : key === 'walkieEngine' ? (
                <span className="text-[9px] bg-[#00E676]/20 text-[#00E676] px-1.5 py-0.5 rounded font-sans font-bold">
                  موتور UDP
                </span>
              ) : key === 'walkieSound' ? (
                <span className="text-[9px] bg-[#00E676]/20 text-[#00E676] px-1.5 py-0.5 rounded font-sans font-bold">
                  صوت و ویبره
                </span>
              ) : key === 'cctvStealth' ? (
                <span className="text-[9px] bg-[#3A86FF]/20 text-[#3A86FF] px-1.5 py-0.5 rounded font-sans font-bold">
                  دوربین & Stealth
                </span>
              ) : key === 'airDropEngine' ? (
                <span className="text-[9px] bg-[#FFB74D]/20 text-[#FFB74D] px-1.5 py-0.5 rounded font-sans font-bold">
                  ایردراپ فایل
                </span>
              ) : key === 'screenMirror' ? (
                <span className="text-[9px] bg-[#AB47BC]/20 text-[#AB47BC] px-1.5 py-0.5 rounded font-sans font-bold">
                  اشتراک صفحه
                </span>
              ) : key === 'qrUtils' || key === 'qrScanner' ? (
                <span className="text-[9px] bg-[#3A86FF]/20 text-[#3A86FF] px-1.5 py-0.5 rounded font-sans font-bold">
                  QR & ML Kit
                </span>
              ) : key === 'pttButton' ? (
                <span className="text-[9px] bg-[#FFB74D]/20 text-[#FFB74D] px-1.5 py-0.5 rounded font-sans font-bold">
                  PTT Compose
                </span>
              ) : key === 'githubWorkflow' ? (
                <span className="text-[9px] bg-[#AB47BC]/20 text-[#AB47BC] px-1.5 py-0.5 rounded font-sans font-bold">
                  بیلد APK
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* File Path & Search Bar */}
      <div className="bg-[#121214] px-4 py-2 border-b border-[#2A2A35] flex items-center justify-between text-xs font-mono text-[#A0A0AB]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#3A86FF]" />
          <span className="text-white text-[11px]">{currentFile.path}</span>
          <span className="text-[#71717A]">({lines.length} خط کد)</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در کد..."
            className="bg-[#1E1E24] border border-[#2A2A35] focus:border-[#3A86FF] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none w-44 font-sans"
          />
          <Search className="w-3 h-3 text-[#71717A] absolute left-2 top-2" />
        </div>
      </div>

      {/* Code Viewer with Line Numbers */}
      <div className="flex-1 overflow-auto bg-[#0E0E10] p-4 text-xs font-mono leading-relaxed" dir="ltr">
        <pre className="relative">
          <code>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const matchesSearch =
                searchTerm && line.toLowerCase().includes(searchTerm.toLowerCase());

              return (
                <div
                  key={lineNum}
                  className={`flex items-start hover:bg-[#1E1E24]/70 px-2 py-0.5 rounded transition-colors ${
                    matchesSearch ? 'bg-[#3A86FF]/20 border-l-2 border-[#3A86FF]' : ''
                  }`}
                >
                  <span className="w-10 text-[#52525B] text-right select-none pr-4 shrink-0 text-[11px]">
                    {lineNum}
                  </span>
                  <span className={`text-[#E5E7EB] flex-1 whitespace-pre-wrap break-all ${
                    line.trim().startsWith('//') || line.trim().startsWith('<!--') || line.trim().startsWith('*')
                      ? 'text-[#6EE7B7]'
                      : line.includes('fun ') || line.includes('val ') || line.includes('class ') || line.includes('package ') || line.includes('import ')
                      ? 'text-[#93C5FD]'
                      : ''
                  }`}>
                    {line || ' '}
                  </span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* Footer Info */}
      <div className="bg-[#151518] border-t border-[#2A2A35] px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-[#A0A0AB]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00E676]" />
          <span>تست‌شده با کامپایلر Jetpack Compose 2024، Kotlin 2.0 و Target SDK 34</span>
        </div>
        <div className="font-mono text-[11px] text-[#3A86FF]">
          Package: com.localnet.walkiecctv
        </div>
      </div>
    </div>
  );
};
