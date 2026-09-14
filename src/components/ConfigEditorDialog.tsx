import React, { useState } from 'react';
import { LauncherConfig } from '../types';
import { X, Settings2, Check, RefreshCw } from 'lucide-react';
import { DEFAULT_CONFIG } from '../data/defaultConfig';

interface ConfigEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: LauncherConfig;
  onSaveConfig: (cfg: LauncherConfig) => void;
}

export const ConfigEditorDialog: React.FC<ConfigEditorDialogProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<LauncherConfig>({ ...config });

  const handleSave = () => {
    onSaveConfig(form);
    onClose();
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_CONFIG });
  };

  return (
    <div
      id="config-editor-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
    >
      <div
        id="config-editor-modal-window"
        className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden text-neutral-100 flex flex-col"
      >
        {/* Header */}
        <div className="bg-neutral-800/90 border-b border-neutral-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-amber-400" />
            <h2 className="font-semibold text-sm tracking-wide">
              Launcher Configuration (Config.cpp)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          <p className="text-neutral-400 leading-relaxed text-[11px]">
            Modify the parameters defined in <code>Source/NewLauncher/Config.cpp</code>.
            These settings govern the desktop window title, CDN endpoints, website hyperlinks, and DLL injection.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-neutral-400 mb-1 font-mono">
                WindowTitle (std::wstring)
              </label>
              <input
                type="text"
                value={form.windowTitle}
                onChange={(e) => setForm({ ...form, windowTitle: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-mono">
                SubTitle (std::string)
              </label>
              <input
                type="text"
                value={form.subTitle}
                onChange={(e) => setForm({ ...form, subTitle: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-mono">
                LauncherCDN (std::string)
              </label>
              <input
                type="text"
                value={form.launcherCDN}
                onChange={(e) => setForm({ ...form, launcherCDN: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1 font-mono">
                  BaseNewsURL (std::wstring)
                </label>
                <input
                  type="text"
                  value={form.baseNewsURL}
                  onChange={(e) => setForm({ ...form, baseNewsURL: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono">
                  WebsiteLink (std::string)
                </label>
                <input
                  type="text"
                  value={form.websiteLink}
                  onChange={(e) => setForm({ ...form, websiteLink: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1 font-mono">
                  OptionExecName (std::string)
                </label>
                <input
                  type="text"
                  value={form.optionExecName}
                  onChange={(e) => setForm({ ...form, optionExecName: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono">
                  InjectDLLName (std::string)
                </label>
                <input
                  type="text"
                  value={form.injectDLLName}
                  onChange={(e) => setForm({ ...form, injectDLLName: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="bg-neutral-950/70 p-3 rounded border border-neutral-800 space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-neutral-300">IsCDNUsingSSL (bool)</span>
                <input
                  type="checkbox"
                  checked={form.isCDNUsingSSL}
                  onChange={(e) => setForm({ ...form, isCDNUsingSSL: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono text-neutral-300">IsDllInjectEnable (bool)</span>
                <input
                  type="checkbox"
                  checked={form.isDllInjectEnable}
                  onChange={(e) => setForm({ ...form, isDllInjectEnable: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-800/80 border-t border-neutral-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-neutral-400 hover:text-white flex items-center gap-1 text-xs cursor-pointer"
          >
            <RefreshCw size={12} /> Reset to Defaults
          </button>
          <div className="flex items-center space-x-2">
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
              <Check size={14} /> Save Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
