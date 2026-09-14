import React, { useState } from 'react';
import { GameOptionConfig } from '../types';
import { X, Monitor, Volume2, ShieldCheck, Check } from 'lucide-react';

interface OptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  options: GameOptionConfig;
  onOptionsChange: (newOptions: GameOptionConfig) => void;
  isDllInjectEnable: boolean;
  injectDLLName: string;
  onToggleDllInject: (enable: boolean) => void;
  language: 'en' | 'pt' | 'zh';
  onLanguageChange: (lang: 'en' | 'pt' | 'zh') => void;
}

export const OptionDialog: React.FC<OptionDialogProps> = ({
  isOpen,
  onClose,
  options,
  onOptionsChange,
  isDllInjectEnable,
  injectDLLName,
  onToggleDllInject,
  language,
  onLanguageChange,
}) => {
  if (!isOpen) return null;

  const [localOptions, setLocalOptions] = useState<GameOptionConfig>({ ...options });
  const [localDllInject, setLocalDllInject] = useState(isDllInjectEnable);
  const [localLanguage, setLocalLanguage] = useState<'en' | 'pt' | 'zh'>(language);

  const handleSave = () => {
    onOptionsChange(localOptions);
    onToggleDllInject(localDllInject);
    onLanguageChange(localLanguage);
    onClose();
  };

  return (
    <div
      id="option-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div
        id="option-modal-window"
        className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden text-neutral-100 flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-neutral-800/90 border-b border-neutral-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor size={18} className="text-amber-400" />
            <h2 className="font-semibold text-sm tracking-wide">
              Trickster Setup (Setup.exe)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Display Settings */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-800 pb-1">
              <Monitor size={14} /> Video & Resolution Settings
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Resolution</label>
                <select
                  value={localOptions.resolution}
                  onChange={(e) =>
                    setLocalOptions({ ...localOptions, resolution: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="800x600">800 x 600 (Classic 4:3)</option>
                  <option value="1024x768">1024 x 768 (Standard 4:3)</option>
                  <option value="1280x720">1280 x 720 (HD 16:9)</option>
                  <option value="1920x1080">1920 x 1080 (FHD 16:9)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Color Depth</label>
                <select
                  value={localOptions.colorDepth}
                  onChange={(e) =>
                    setLocalOptions({
                      ...localOptions,
                      colorDepth: e.target.value as '16bit' | '32bit',
                    })
                  }
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="32bit">32-Bit High Color (Recommended)</option>
                  <option value="16bit">16-Bit Low Color</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="windowed-mode-check"
                checked={localOptions.windowed}
                onChange={(e) =>
                  setLocalOptions({ ...localOptions, windowed: e.target.checked })
                }
                className="rounded border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="windowed-mode-check" className="text-neutral-300 cursor-pointer">
                Run in Windowed Mode (No Fullscreen Lock)
              </label>
            </div>
          </div>

          {/* Sound & Audio */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-800 pb-1">
              <Volume2 size={14} /> Sound & Music Volume
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Background Music (BGM)</span>
                  <span className="font-mono text-neutral-200">
                    {localOptions.bgmMute ? 'Muted' : `${localOptions.bgmVolume}%`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localOptions.bgmVolume}
                    disabled={localOptions.bgmMute}
                    onChange={(e) =>
                      setLocalOptions({ ...localOptions, bgmVolume: Number(e.target.value) })
                    }
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <label className="flex items-center gap-1 text-[11px] text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localOptions.bgmMute}
                      onChange={(e) =>
                        setLocalOptions({ ...localOptions, bgmMute: e.target.checked })
                      }
                      className="cursor-pointer"
                    />
                    Mute
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Sound Effects (SFX)</span>
                  <span className="font-mono text-neutral-200">
                    {localOptions.sfxMute ? 'Muted' : `${localOptions.sfxVolume}%`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localOptions.sfxVolume}
                    disabled={localOptions.sfxMute}
                    onChange={(e) =>
                      setLocalOptions({ ...localOptions, sfxVolume: Number(e.target.value) })
                    }
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <label className="flex items-center gap-1 text-[11px] text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localOptions.sfxMute}
                      onChange={(e) =>
                        setLocalOptions({ ...localOptions, sfxMute: e.target.checked })
                      }
                      className="cursor-pointer"
                    />
                    Mute
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* DLL Injection & Advanced */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-800 pb-1">
              <ShieldCheck size={14} /> Launcher & DLL Injection (Config.cpp)
            </div>

            <div className="bg-neutral-950/70 p-3 rounded border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-neutral-200">
                    DLL Injection Routine
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Inject <code className="text-amber-300">{injectDLLName}</code> upon Game Start (VirtualAllocEx / LoadLibraryA)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localDllInject}
                  onChange={(e) => setLocalDllInject(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-neutral-400">Launcher Language:</span>
                <select
                  value={localLanguage}
                  onChange={(e) => setLocalLanguage(e.target.value as 'en' | 'pt' | 'zh')}
                  className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-neutral-200 text-xs"
                >
                  <option value="zh">中文 (简体)</option>
                  <option value="en">English (Default)</option>
                  <option value="pt">Português (Brasil)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="bg-neutral-800/80 border-t border-neutral-700 px-4 py-3 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-neutral-300 hover:text-white bg-neutral-700/60 hover:bg-neutral-700 transition-colors cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded font-medium text-white bg-amber-600 hover:bg-amber-500 transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow"
          >
            <Check size={14} /> Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
