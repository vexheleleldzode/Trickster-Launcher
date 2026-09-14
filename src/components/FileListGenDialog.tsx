import React, { useState } from 'react';
import { Arquivo, PatchVersion } from '../types';
import { md5 } from '../utils/md5';
import {
  X,
  FileCode,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  Play,
  FileText,
  ShieldCheck,
  Server
} from 'lucide-react';

interface FileListGenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patchVersions: PatchVersion[];
  onAddPatchVersion: (newVersion: PatchVersion) => void;
  isMaintenance: boolean;
  onToggleMaintenance: (isMaint: boolean) => void;
  serverFiles: Arquivo[];
  onUpdateServerFiles: (files: Arquivo[]) => void;
  launcherHash: string;
  onUpdateLauncherHash: (hash: string) => void;
}

export const FileListGenDialog: React.FC<FileListGenDialogProps> = ({
  isOpen,
  onClose,
  patchVersions,
  onAddPatchVersion,
  isMaintenance,
  onToggleMaintenance,
  serverFiles,
  onUpdateServerFiles,
  launcherHash,
  onUpdateLauncherHash,
}) => {
  if (!isOpen) return null;

  const [execMode, setExecMode] = useState<'Parallel' | 'Sequential'>('Parallel');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'FileListGen v1.0.4 Ready.',
    'Working directory: /Update',
    `Current maintenance mode: ${isMaintenance ? 'TRUE (Offline)' : 'FALSE (Online)'}`,
    `Latest version: version_${patchVersions.length}.json`,
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  // New file input state
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  const addLog = (msg: string) => {
    setConsoleLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Replicates FileListGen.exe workflow
  const handleRunFileListGen = () => {
    setIsProcessing(true);
    addLog('---------------------------------');
    addLog(`Running FileListGen in ${execMode} mode...`);
    addLog('Loading current version files from /version/*.json ...');

    setTimeout(() => {
      // 1. Gather all existing versions
      const mapAntigos: Record<string, Arquivo> = {};
      patchVersions.forEach((v) => {
        v.files.forEach((f) => {
          mapAntigos[f.FilePath] = f;
        });
      });
      addLog(`Loaded ${Object.keys(mapAntigos).length} baseline file signatures.`);

      // 2. Scan update directory files
      addLog('Scanning files in /Update directory...');
      const novos = serverFiles.map((f) => ({
        ...f,
        FileHash: md5(f.FilePath + (f.sizeBytes || 1000)), // dynamic MD5
      }));

      // 3. Compare with old version hashes
      addLog('Checking for file MD5 changes...');
      const diffFiles: Arquivo[] = [];
      novos.forEach((novo) => {
        const old = mapAntigos[novo.FilePath];
        if (!old || old.FileHash !== novo.FileHash) {
          diffFiles.push({
            ...novo,
            ToUpdate: true,
          });
        }
      });

      // 4. Calculate Splash.exe hash
      const splashFile = novos.find((f) => f.FilePath.toLowerCase().includes('splash'));
      const newSplashHash = splashFile ? splashFile.FileHash : md5('Splash.exe_v' + (patchVersions.length + 1));
      onUpdateLauncherHash(newSplashHash);
      addLog(`Calculated current Splash.exe MD5: ${newSplashHash}`);
      addLog('Saved launcher MD5 to launcher.txt');

      if (diffFiles.length > 0) {
        const nextVer = patchVersions.length + 1;
        const newPatch: PatchVersion = {
          version: nextVer,
          date: new Date().toISOString().split('T')[0],
          description: `Auto-generated patch v${nextVer} (${diffFiles.length} files changed)`,
          files: diffFiles,
        };
        onAddPatchVersion(newPatch);
        addLog(`Found ${diffFiles.length} changed files!`);
        addLog(`Generated and saved version_${nextVer}.json to /version/`);
      } else {
        addLog('No file changes detected between /Update and existing manifests.');
      }

      addLog('FileListGen process completed successfully.');
      addLog('---------------------------------');
      setIsProcessing(false);
    }, 800);
  };

  const handleAddNewFile = () => {
    if (!newFilePath.trim()) return;
    const computedHash = md5(newFileContent || newFilePath);
    const newArquivo: Arquivo = {
      FileID: serverFiles.length + 1,
      FilePath: newFilePath.trim(),
      FileHash: computedHash,
      ToUpdate: false,
      sizeBytes: newFileContent.length || 1024 * 50,
    };
    onUpdateServerFiles([...serverFiles, newArquivo]);
    addLog(`Added file to /Update: ${newArquivo.FilePath} (Hash: ${newArquivo.FileHash.substring(0, 8)}...)`);
    setNewFilePath('');
    setNewFileContent('');
  };

  const handleDeleteFile = (id: number) => {
    const target = serverFiles.find((f) => f.FileID === id);
    if (target) {
      onUpdateServerFiles(serverFiles.filter((f) => f.FileID !== id));
      addLog(`Removed file from /Update: ${target.FilePath}`);
    }
  };

  const handleSimulateFileEdit = (file: Arquivo) => {
    const updated = serverFiles.map((f) => {
      if (f.FileID === file.FileID) {
        return {
          ...f,
          FileHash: md5(f.FilePath + '_' + Date.now()),
          sizeBytes: (f.sizeBytes || 1000) + 128,
        };
      }
      return f;
    });
    onUpdateServerFiles(updated);
    addLog(`Modified file content: ${file.FilePath}. MD5 checksum updated. Re-run FileListGen to produce patch!`);
  };

  // Export helper
  const handleExportJSON = (content: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="filelistgen-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
    >
      <div
        id="filelistgen-modal-window"
        className="w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-neutral-800/90 border-b border-neutral-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode size={18} className="text-amber-500" />
            <h2 className="font-semibold text-sm tracking-wide flex items-center gap-2">
              FileListGen Admin Suite (FileListGen.exe)
              <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded font-mono">
                C++ Utility Replica
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Left Column: Server /Update Management & Generator Controls */}
          <div className="space-y-4">
            {/* Quick Server Controls */}
            <div className="bg-neutral-950/70 p-3.5 rounded border border-neutral-800 space-y-3">
              <div className="font-bold text-neutral-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-400 uppercase tracking-wider text-[11px]">
                  <Server size={13} /> Server Maintenance Switch (maintenance.txt)
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    isMaintenance ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isMaintenance ? 'Maintenance Active' : 'Server Online'}
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-300">
                <p className="text-[11px] text-neutral-400 max-w-[240px]">
                  Setting to <code>true</code> halts client Game Start buttons and displays "In Maintenance!".
                </p>
                <button
                  onClick={() => {
                    const next = !isMaintenance;
                    onToggleMaintenance(next);
                    addLog(`Updated maintenance.txt: ${next ? 'true' : 'false'}`);
                  }}
                  className={`px-3 py-1.5 rounded font-medium text-xs transition-colors cursor-pointer ${
                    isMaintenance
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {isMaintenance ? 'Set to Online' : 'Set to Maintenance'}
                </button>
              </div>
            </div>

            {/* Run FileListGen Action */}
            <div className="bg-neutral-950/70 p-3.5 rounded border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-200 flex items-center gap-1.5 text-[11px] uppercase text-amber-400">
                  <Play size={13} /> Execute FileListGen.exe
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setExecMode('Parallel')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                      execMode === 'Parallel' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Parallel (8 Thr)
                  </button>
                  <button
                    onClick={() => setExecMode('Sequential')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                      execMode === 'Sequential' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Sequential
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400">
                Scans all files in <code>/Update</code>, computes MD5 hashes, identifies differences from earlier versions,
                and outputs new <code>version_X.json</code> patch files and <code>launcher.txt</code>.
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={isProcessing}
                  onClick={handleRunFileListGen}
                  className="flex-1 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs disabled:opacity-50 shadow"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Scanning & Generating...
                    </>
                  ) : (
                    <>
                      <Play size={14} /> Run FileListGen Check
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Server Files in /Update */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-300 text-[11px] uppercase tracking-wider">
                  Update Directory Files ({serverFiles.length})
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {serverFiles.map((file) => (
                  <div
                    key={file.FileID}
                    className="bg-neutral-950 p-2 rounded border border-neutral-800 flex items-center justify-between gap-2"
                  >
                    <div className="truncate flex-1">
                      <div className="font-mono text-neutral-200 text-[11px] truncate">
                        {file.FilePath}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono truncate">
                        MD5: {file.FileHash}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSimulateFileEdit(file)}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded text-[10px] cursor-pointer"
                        title="Simulate modifying this file"
                      >
                        Modify
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.FileID)}
                        className="p-1 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete file"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New File form */}
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 space-y-2">
                <div className="text-[10px] font-medium text-neutral-400">Add New Game File:</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. data/maps/megalo.gpk"
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
                  />
                  <button
                    onClick={handleAddNewFile}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Console Log & Manifest Exports */}
          <div className="space-y-4 flex flex-col">
            {/* Real-time C++ Console Output Simulation */}
            <div className="flex-1 flex flex-col bg-black rounded border border-neutral-800 font-mono text-[11px] p-3 text-emerald-400 overflow-hidden shadow-inner">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-neutral-400 text-[10px]">
                <span>FileListGen.exe Console Output</span>
                <span className="text-neutral-500">{consoleLogs.length} events</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-56">
                {consoleLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed break-all">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Version Manifests List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-300 text-[11px] uppercase tracking-wider">
                  Generated Versions ({patchVersions.length})
                </span>
                <button
                  onClick={() =>
                    handleExportJSON(
                      patchVersions.map((v) => ({
                        version: v.version,
                        files: v.files,
                      })),
                      'filelist.json'
                    )
                  }
                  className="text-amber-400 hover:text-amber-300 text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Download size={11} /> Export filelist.json
                </button>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {patchVersions.map((v) => (
                  <div
                    key={v.version}
                    className="bg-neutral-950 p-2 rounded border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-neutral-200 text-xs">
                        version_{v.version}.json
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {v.files.length} files • {v.date}
                      </div>
                    </div>
                    <button
                      onClick={() => handleExportJSON(v.files, `version_${v.version}.json`)}
                      className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Download size={11} /> JSON
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-800/80 border-t border-neutral-700 px-4 py-3 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400">
            Launcher MD5: <span className="font-mono text-neutral-200">{launcherHash.substring(0, 16)}...</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-medium text-white bg-neutral-700 hover:bg-neutral-600 transition-colors cursor-pointer text-xs"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
