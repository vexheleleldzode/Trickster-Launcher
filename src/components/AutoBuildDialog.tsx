import React, { useState, useEffect } from 'react';
import { X, Cpu, CheckCircle2, Play, Download, Terminal, Layers, FileCode, ExternalLink, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { LauncherConfig, GameServerConfig } from '../types';

interface AutoBuildDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: LauncherConfig;
  serverConfig: GameServerConfig;
}

export const AutoBuildDialog: React.FC<AutoBuildDialogProps> = ({
  isOpen,
  onClose,
  config,
  serverConfig,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'cloud' | 'simulate' | 'script'>('cloud');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(0);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [buildSuccess, setBuildSuccess] = useState(false);

  const startSimulatedBuild = () => {
    setIsBuilding(true);
    setBuildSuccess(false);
    setBuildStep(0);
    setBuildLogs(['[INFO] 初始化 GitHub Actions 云端构建 Runner (windows-latest)...']);

    const steps = [
      { delay: 400, text: '[Step 1/5] 检出 Git 仓库代码并挂载 DirectX 9 SDK / OpenSSL / ImGui 库...' },
      { delay: 800, text: '[Step 2/5] 执行 NuGet Restore，还原 WebView2 1.0.3485 与 WIL 原生包... [OK]' },
      { delay: 1300, text: `[Step 3/5] 应用自定义配置: CDN=${config.launcherCDN}, 超时=${config.updateTimeoutSeconds || 3}s, 服务器=${serverConfig.ip}:${serverConfig.port}` },
      { delay: 1900, text: '[Step 4/5] MSBuild 启动！使用 MSVC v143 (C++20 标准) 编译 NewLauncher.vcxproj (Release|Win32)... [OK]' },
      { delay: 2400, text: '[Step 5/5] 打包生成 Output/Trickster Launcher/Splash.exe 与 FileListGen.exe... [完成]' },
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setBuildStep(idx + 1);
        setBuildLogs((prev) => [...prev, step.text]);
        if (idx === steps.length - 1) {
          setIsBuilding(false);
          setBuildSuccess(true);
          setBuildLogs((prev) => [
            ...prev,
            '==================================================',
            '🎉 [SUCCESS] 自动化构建成功！安装包已就绪: TricksterLauncher-Win32-Release.zip',
          ]);
        }
      }, step.delay);
    });
  };

  const handleDownloadMockBundle = () => {
    const configData = `[Launcher]
LauncherCDN=${config.launcherCDN}
UpdateTimeoutSeconds=${config.updateTimeoutSeconds || 3}
IsCDNUsingSSL=${config.isCDNUsingSSL}
ServerIP=${serverConfig.ip}
ServerPort=${serverConfig.port}
WorldPort=${serverConfig.worldPort || 21001}
GeneratedTime=${new Date().toISOString()}
`;
    const blob = new Blob([configData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Trickster_Launcher_Build_Config.ini';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="auto-build-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        id="auto-build-dialog"
        className="w-full max-w-2xl bg-neutral-900 border border-emerald-600/60 rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans"
      >
        {/* Header */}
        <div className="bg-neutral-950 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                自动编译与云端流水线 (CI/CD Auto Build)
              </h2>
              <p className="text-[11px] text-neutral-400">
                通过 GitHub Actions 云端 Windows 机器自动构建，省去手动安装 Visual Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-4 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`pb-2 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cloud'
                ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10 rounded-t'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <Sparkles size={13} />
            GitHub Actions 自动构建方案
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulate')}
            className={`pb-2 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'simulate'
                ? 'text-cyan-400 border-cyan-500 bg-cyan-500/10 rounded-t'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <Play size={13} />
            实时云端流水线模拟
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`pb-2 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'script'
                ? 'text-amber-400 border-amber-500 bg-amber-500/10 rounded-t'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <Terminal size={13} />
            本地一键脚本 (build.bat)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 max-h-[70vh] overflow-y-auto text-xs space-y-4">
          {activeTab === 'cloud' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-300 font-bold mb-1">
                  <CheckCircle2 size={16} />
                  已配置好 GitHub Actions 自动化编译工作流！
                </div>
                <p className="text-neutral-300 text-[11px] leading-relaxed">
                  项目已为您创建了 <code>.github/workflows/build.yml</code> 和完整的 <code>TricksterLauncher.sln</code> 解决方案文件。
                  代码提交推送到 GitHub 后，<strong>GitHub 的云端 Windows 服务器会自动编译出 Windows 可执行文件并生成压缩包</strong>，您完全不需要在本地自己配置编译环境。
                </p>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded border border-neutral-800 space-y-2">
                <h4 className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                  <Layers size={14} className="text-cyan-400" />
                  GitHub 自动编译机制工作流程：
                </h4>
                <ol className="list-decimal list-inside text-neutral-300 space-y-1.5 text-[11px] leading-relaxed">
                  <li>
                    <strong>自动触发</strong>：每次向 <code>main</code> / <code>master</code> 分支推送代码，或者创建版本 Tag（如 <code>v1.0.0</code>）时触发；
                  </li>
                  <li>
                    <strong>云端 Runner</strong>：自动分配一台全新的 <code>windows-latest</code> 虚拟机；
                  </li>
                  <li>
                    <strong>自动还原依赖</strong>：自动还原 NuGet 上的 WebView2 与 WIL 原生包；
                  </li>
                  <li>
                    <strong>多线程 MSBuild</strong>：使用 Visual Studio 2022 v143 编译器将 <code>NewLauncher</code> 与 <code>FileListGen</code> 编译为 Release 性能包；
                  </li>
                  <li>
                    <strong>自动打包下载</strong>：自动将 <code>Splash.exe</code>（登录器主程序）和 <code>FileListGen.exe</code> 打包为 <code>TricksterLauncher-Win32-Release.zip</code>，直接存放在 GitHub Actions 的 <strong>Artifacts (工件)</strong> 中供下载！
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-200">工作流文件位置</div>
                  <div className="text-[11px] text-neutral-400 font-mono">.github/workflows/build.yml</div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600/20 text-emerald-300 rounded border border-emerald-500/30 text-[10px] font-semibold">
                  就绪 (Active)
                </span>
              </div>
            </div>
          )}

          {activeTab === 'simulate' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-neutral-300 text-[11px]">
                  点击下方按钮可立即在网页端预览 GitHub 云端 Runner 的实时编译过程：
                </p>
                <button
                  type="button"
                  onClick={startSimulatedBuild}
                  disabled={isBuilding}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center gap-1.5 text-xs transition-colors cursor-pointer disabled:opacity-50 shadow"
                >
                  <RefreshCw size={13} className={isBuilding ? 'animate-spin' : ''} />
                  {isBuilding ? '云端编译中...' : '运行自动编译 (Trigger Build)'}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                  <span>编译进度: {buildStep}/5</span>
                  <span>{buildStep === 5 ? '100%' : `${buildStep * 20}%`}</span>
                </div>
                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${buildStep * 20}%` }}
                  />
                </div>
              </div>

              {/* Terminal Logs */}
              <div className="bg-black/90 p-3 rounded font-mono text-[11px] text-emerald-400 border border-neutral-800 h-44 overflow-y-auto space-y-1 select-all">
                {buildLogs.length === 0 ? (
                  <span className="text-neutral-500">// 点击上方“运行自动编译”开始模拟流水线日志...</span>
                ) : (
                  buildLogs.map((log, i) => (
                    <div key={i} className={log.includes('[SUCCESS]') ? 'text-amber-300 font-bold' : ''}>
                      {log}
                    </div>
                  ))
                )}
              </div>

              {buildSuccess && (
                <div className="p-3 bg-neutral-950 rounded border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-emerald-300">构建完成！可执行配置包已就绪</div>
                      <div className="text-[10px] text-neutral-400">包含当前配置的 IP、端口与 3 秒超时规则</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadMockBundle}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-xs border border-neutral-700"
                  >
                    <Download size={13} /> 下载配置清单
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-3">
              <p className="text-neutral-300 text-[11px]">
                如果您将代码下载到了 Windows 本地电脑，我们也为您内置了 <code>build.bat</code> 自动化脚本，<strong>双击 <code>build.bat</code> 即可全自动编译</strong>：
              </p>

              <div className="bg-neutral-950 p-3 rounded border border-neutral-800 space-y-2">
                <div className="text-[11px] text-neutral-400 font-semibold flex items-center gap-1">
                  <FileCode size={13} className="text-amber-400" />
                  本地一键编译命令 (Windows CMD / PowerShell):
                </div>
                <div className="bg-black/90 p-2.5 rounded font-mono text-[11px] text-amber-300 select-all border border-neutral-800">
                  .\build.bat
                </div>
                <p className="text-[10px] text-neutral-400">
                  <code>build.bat</code> 会自动通过 <code>vswhere</code> 寻找系统中已安装的 MSBuild，自动还原 NuGet 并将生成的 <code>Splash.exe</code> 放置到 <code>Output/Trickster Launcher/</code> 目录下。
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded border border-neutral-800 space-y-2">
                <div className="text-[11px] text-neutral-400 font-semibold">
                  或者直接使用 MSBuild 命令行：
                </div>
                <div className="bg-black/90 p-2.5 rounded font-mono text-[11px] text-cyan-300 select-all border border-neutral-800">
                  msbuild TricksterLauncher.sln /p:Configuration=Release /p:Platform=Win32 /m
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-950 border-t border-neutral-800 px-4 py-3 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            解决方案: <code>TricksterLauncher.sln</code> • 包含 Launcher & FileListGen
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-medium transition-colors cursor-pointer text-xs"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
