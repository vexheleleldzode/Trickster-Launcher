import React, { useState, useEffect, useRef } from 'react';
import { DesktopLauncher } from './components/DesktopLauncher';
import { OptionDialog } from './components/OptionDialog';
import { FileListGenDialog } from './components/FileListGenDialog';
import { ConfigEditorDialog } from './components/ConfigEditorDialog';
import { GameClientSimulation } from './components/GameClientSimulation';
import { ServerConfigDialog } from './components/ServerConfigDialog';
import { AccountManagerDialog } from './components/AccountManagerDialog';
import {
  DEFAULT_CONFIG,
  DEFAULT_OPTIONS,
  INITIAL_PATCH_VERSIONS,
  DEFAULT_GAME_SERVER,
  DEFAULT_ACCOUNTS,
} from './data/defaultConfig';
import { LANGUAGES } from './data/languages';
import {
  LauncherConfig,
  GameOptionConfig,
  PatchVersion,
  Arquivo,
  GameServerConfig,
  UserAccount,
} from './types';
import {
  FileCode,
  Settings,
  Server,
  ShieldCheck,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  Laptop,
  Key,
  Wifi,
  WifiOff,
  Clock,
  Play,
} from 'lucide-react';

export function App() {
  const [config, setConfig] = useState<LauncherConfig>(() => {
    try {
      const saved = localStorage.getItem('trickster_launcher_config');
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      // ignore
    }
    return DEFAULT_CONFIG;
  });

  const handleSaveLauncherConfig = (newConfig: LauncherConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('trickster_launcher_config', JSON.stringify(newConfig));
    } catch (e) {
      // ignore
    }
  };

  const [options, setOptions] = useState<GameOptionConfig>(DEFAULT_OPTIONS);
  const [language, setLanguage] = useState<'en' | 'pt' | 'zh'>('zh');
  const [patchVersions, setPatchVersions] = useState<PatchVersion[]>(INITIAL_PATCH_VERSIONS);
  const [isMaintenance, setIsMaintenance] = useState<boolean>(false);

  // Game server config with localStorage persistence
  const [gameServer, setGameServer] = useState<GameServerConfig>(() => {
    try {
      const saved = localStorage.getItem('trickster_game_server');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_GAME_SERVER;
  });

  // Saved accounts with localStorage persistence
  const [savedAccounts, setSavedAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('trickster_accounts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_ACCOUNTS;
  });

  const [activeAccountId, setActiveAccountId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem('trickster_active_account_id');
      if (savedId) return savedId;
    } catch (e) {
      // ignore
    }
    return DEFAULT_ACCOUNTS[0]?.id || null;
  });

  // Update server connection simulation mode & timeout states
  const [updateServerMode, setUpdateServerMode] = useState<'normal' | 'timeout' | 'offline'>('normal');
  const [updateServerTimeout, setUpdateServerTimeout] = useState<boolean>(false);
  const [isUpdateServerOffline, setIsUpdateServerOffline] = useState<boolean>(false);

  // Server files (representing files in the /Update folder)
  const [serverFiles, setServerFiles] = useState<Arquivo[]>(() => {
    const map: Record<string, Arquivo> = {};
    INITIAL_PATCH_VERSIONS.forEach((v) => {
      v.files.forEach((f) => {
        map[f.FilePath] = f;
      });
    });
    return Object.values(map);
  });

  const [launcherHash, setLauncherHash] = useState<string>('8b4cf617a22e6b72d24269d0d3cb1e8b');

  // Launcher runtime state
  const [fileProgress, setFileProgress] = useState<number>(0);
  const [totalProgress, setTotalProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('初始化登录器引擎...');
  const [speedText, setSpeedText] = useState<string>('0 B/s');
  const [isWorkerDone, setIsWorkerDone] = useState<boolean>(false);
  const [localVersion, setLocalVersion] = useState<number>(1);

  // Dialogs
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const [isFileListGenOpen, setIsFileListGenOpen] = useState(false);
  const [isConfigEditorOpen, setIsConfigEditorOpen] = useState(false);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState(false);
  const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [showArchDocs, setShowArchDocs] = useState(false);

  const lang = LANGUAGES[language] || LANGUAGES.zh;
  const isVerifyingRef = useRef(false);
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save server config to localStorage
  const handleSaveGameServer = (newServer: GameServerConfig) => {
    setGameServer(newServer);
    try {
      localStorage.setItem('trickster_game_server', JSON.stringify(newServer));
    } catch (e) {
      // ignore
    }
  };

  // Save accounts to localStorage
  const handleSaveAccounts = (newAccounts: UserAccount[]) => {
    setSavedAccounts(newAccounts);
    try {
      localStorage.setItem('trickster_accounts', JSON.stringify(newAccounts));
    } catch (e) {
      // ignore
    }
  };

  const handleSelectAccount = (id: string) => {
    setActiveAccountId(id);
    try {
      localStorage.setItem('trickster_active_account_id', id);
    } catch (e) {
      // ignore
    }
  };

  const activeAccount = savedAccounts.find((a) => a.id === activeAccountId) || savedAccounts[0] || null;

  // Replicates C++ Helper::CheckWorker and FileCheckUpdate with Timeout and Offline tolerance
  const runFileCheck = (isFullCheck = false, forcedMode?: 'normal' | 'timeout' | 'offline') => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;

    // Clear previous timers
    if (checkTimerRef.current) clearInterval(checkTimerRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

    const currentMode = forcedMode || updateServerMode;
    setIsWorkerDone(false);
    setFileProgress(0);
    setTotalProgress(0);
    setUpdateServerTimeout(false);
    setIsUpdateServerOffline(false);

    setStatusText('正在连接更新服务器并获取版本列表 (Connecting CDN)...');
    setSpeedText('连接中...');

    // If update server is in timeout or offline simulation mode
    if (currentMode === 'timeout' || currentMode === 'offline') {
      const timeoutMs = (config.updateTimeoutSeconds || 3) * 1000;
      timeoutTimerRef.current = setTimeout(() => {
        setUpdateServerTimeout(true);
        setIsUpdateServerOffline(true);
        setFileProgress(1.0);
        setTotalProgress(1.0);
        setSpeedText(`连接超时 (${config.updateTimeoutSeconds || 3}s)`);
        setStatusText(`${lang.launcher_update_timeout} (已等待 ${config.updateTimeoutSeconds || 3} 秒)`);

        // Crucial requirement: "但是不影响启动游戏" (Allow Game Start!)
        setIsWorkerDone(true);
        isVerifyingRef.current = false;
      }, timeoutMs);
      return;
    }

    // Normal flow: Simulate reading versions from CDN and verifying files
    checkTimerRef.current = setTimeout(() => {
      const filesToCheck = [...serverFiles];
      let currentIndex = 0;

      const interval = setInterval(() => {
        if (currentIndex < filesToCheck.length) {
          const file = filesToCheck[currentIndex];
          const fileName = file.FilePath.split(/[/\\]/).pop() || file.FilePath;
          const pct = (currentIndex + 1) / filesToCheck.length;

          setStatusText(`${lang.splash_check}${fileName}`);
          setFileProgress(Math.random() * 0.4 + 0.6);
          setTotalProgress(pct);

          const speeds = ['14.2 MB/s', '18.9 MB/s', '11.5 MB/s', '22.1 MB/s', '9.8 MB/s'];
          setSpeedText(speeds[currentIndex % speeds.length]);

          currentIndex++;
        } else {
          clearInterval(interval);
          setFileProgress(1.0);
          setTotalProgress(1.0);
          setSpeedText('0 B/s');

          if (isMaintenance) {
            setStatusText(lang.launcher_worker_maintenance);
          } else {
            setStatusText(lang.launcher_worker_complete);
          }

          setIsWorkerDone(true);
          isVerifyingRef.current = false;
        }
      }, 110);
    }, 400);
  };

  // Run initial file check on mount
  useEffect(() => {
    runFileCheck(false);
    return () => {
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    };
  }, [isMaintenance]);

  const handleGameStart = () => {
    if (isMaintenance) {
      alert('服务器当前处于维护状态，请稍后再试。');
      return;
    }
    setIsGameRunning(true);
  };

  // Double-click auto-login or quick launch with account
  const handleLaunchWithAccount = (account: UserAccount) => {
    handleSelectAccount(account.id);
    if (isMaintenance) {
      alert('服务器当前处于维护状态，无法登录。');
      return;
    }
    setIsGameRunning(true);
  };

  const handleExit = () => {
    if (window.confirm('是否确定退出 Trickster 登录器？')) {
      setStatusText('登录器已关闭。');
      setIsWorkerDone(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-between p-4 sm:p-6 select-none font-sans">
      {/* Top Navbar & Quick Tools */}
      <header className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-white shadow">
            TL
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-neutral-100 flex items-center gap-2">
              Trickster Online 登录器与补丁管理
              <span className="bg-neutral-800 text-neutral-400 text-[10px] px-2 py-0.5 rounded font-mono">
                Direct3D 9 & Auto-Login
              </span>
            </h1>
            <p className="text-[11px] text-neutral-400 flex items-center gap-2">
              <span>CDN: <code className="text-amber-300">{config.launcherCDN}</code></span>
              <span>•</span>
              <span>游戏服: <code className="text-cyan-300">{gameServer.ip}:{gameServer.port}</code></span>
              {activeAccount && (
                <>
                  <span>•</span>
                  <span>当前账号: <code className="text-emerald-300">{activeAccount.username}</code></span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons & Network Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* User Requested: Game Server IP & Port Configuration button */}
          <button
            id="top-server-config-btn"
            type="button"
            onClick={() => setIsServerConfigOpen(true)}
            className="px-3 py-1.5 rounded font-medium bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-200 flex items-center gap-1.5 transition-colors cursor-pointer text-xs shadow-sm"
            title="配置游戏服务器IP与端口"
          >
            <Server size={13} className="text-cyan-400" />
            配置游戏服务器
          </button>

          {/* User Requested: Account & Auto-Login Manager */}
          <button
            id="top-account-manager-btn"
            type="button"
            onClick={() => setIsAccountManagerOpen(true)}
            className="px-3 py-1.5 rounded font-medium bg-neutral-900 hover:bg-neutral-800 border border-amber-500/60 hover:border-amber-400 text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
            title="管理保存的账号与自动登录"
          >
            <Key size={13} />
            账号与自动登录
          </button>

          {/* Update Server Timeout Simulator (Allows testing the user requirement easily) */}
          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded overflow-hidden text-[11px]">
            <span className="px-2 py-1 text-neutral-400 font-medium">更新服测试:</span>
            <button
              type="button"
              onClick={() => {
                setUpdateServerMode('normal');
                runFileCheck(false, 'normal');
              }}
              className={`px-2 py-1 transition-colors cursor-pointer flex items-center gap-1 ${
                updateServerMode === 'normal'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'hover:bg-neutral-800 text-neutral-300'
              }`}
              title="更新服务器正常可连"
            >
              <Wifi size={10} /> 正常
            </button>
            <button
              type="button"
              onClick={() => {
                setUpdateServerMode('timeout');
                runFileCheck(false, 'timeout');
              }}
              className={`px-2 py-1 transition-colors cursor-pointer flex items-center gap-1 ${
                updateServerMode === 'timeout'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'hover:bg-neutral-800 text-neutral-300'
              }`}
              title="模拟更新服务器连接超时（超时后仍可正常进入游戏）"
            >
              <Clock size={10} /> 模拟超时 ({config.updateTimeoutSeconds || 3}s)
            </button>
          </div>

          {/* Maintenance Toggle */}
          <button
            type="button"
            onClick={() => setIsMaintenance(!isMaintenance)}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer text-xs ${
              isMaintenance
                ? 'bg-red-950 text-red-300 border border-red-800 hover:bg-red-900'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
            }`}
            title="切换维护模式 (Maintenance.txt)"
          >
            {isMaintenance ? '维护中' : '服务正常'}
          </button>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'pt' | 'zh')}
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-neutral-300 hover:text-white cursor-pointer text-xs"
          >
            <option value="zh">中文 (简体)</option>
            <option value="en">English</option>
            <option value="pt">Português (BR)</option>
          </select>

          {/* Architecture details toggle */}
          <button
            type="button"
            onClick={() => setShowArchDocs(!showArchDocs)}
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
            title="查看架构说明与新特性"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* Main Showcase: Direct3D ImGui Launcher Frame */}
      <main className="my-5 flex flex-col items-center">
        <div className="relative">
          {/* Authentic 538x564 Launcher Component */}
          <DesktopLauncher
            config={config}
            language={language}
            isMaintenance={isMaintenance}
            fileProgress={fileProgress}
            totalProgress={totalProgress}
            statusText={statusText}
            speedText={speedText}
            isWorkerDone={isWorkerDone}
            onCheckFiles={() => runFileCheck(true)}
            onOpenOptions={() => setIsOptionOpen(true)}
            onGameStart={handleGameStart}
            onExit={handleExit}
            onOpenAdmin={() => setIsFileListGenOpen(true)}
            onOpenConfig={() => setIsConfigEditorOpen(true)}
            gameServer={gameServer}
            onOpenServerConfig={() => setIsServerConfigOpen(true)}
            savedAccounts={savedAccounts}
            activeAccount={activeAccount}
            onOpenAccountManager={() => setIsAccountManagerOpen(true)}
            onSelectAccount={handleSelectAccount}
            onLaunchWithAccount={handleLaunchWithAccount}
            isUpdateServerOffline={isUpdateServerOffline}
            updateServerTimeout={updateServerTimeout}
            onRetryConnection={() => runFileCheck(false, 'normal')}
          />
        </div>

        {/* Quick hint beneath the launcher */}
        <div className="mt-3 text-center text-xs text-neutral-400 max-w-xl flex flex-wrap items-center justify-center gap-2">
          <span>💡 提示:</span>
          <span className="text-amber-300">
            更新服务器若超时会自动提示并解锁“进入游戏”
          </span>
          <span>•</span>
          <span className="text-neutral-300">
            点击下方中间“配置IP/端口”可修改游戏服务器
          </span>
          <span>•</span>
          <span className="text-emerald-300">
            双击账号卡片或双击按钮可实现自动免密登录
          </span>
        </div>
      </main>

      {/* Technical Overview Drawer (Collapsible) */}
      {showArchDocs && (
        <div className="w-full max-w-5xl bg-neutral-900/95 border border-neutral-800 rounded-lg p-5 text-xs text-neutral-300 space-y-4 mb-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <Laptop size={16} /> 登录器功能更新与技术实现说明
            </h3>
            <button
              onClick={() => setShowArchDocs(false)}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              关闭
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-950 p-3 rounded border border-neutral-800/80 space-y-1">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Clock size={13} /> 1. 更新服务器超时非阻塞机制
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                在原版 C++ <code>Helper::CheckWorker</code> 中，若 CDN 或 HTTP 挂起会导致登录器一直卡死在 <code>Connecting...</code>。
                优化后加入了 2.5 秒超时机制，连接失败或超时时立即弹出离线警告横幅，并解锁“进入游戏”按钮，玩家可直接离线或直连游戏服游玩。
              </p>
            </div>

            <div className="bg-neutral-950 p-3 rounded border border-neutral-800/80 space-y-1">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Server size={13} /> 2. 独立配置游戏服务器 IP 与端口
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                登录器新增了专门的“配置游戏服务器”按键。支持修改游戏主服 IP、端口号、快捷预设切换（如本地回环 127.0.0.1、测试服、私服），并自动保存至本地缓存与客户端启动参数中。
              </p>
            </div>

            <div className="bg-neutral-950 p-3 rounded border border-neutral-800/80 space-y-1">
              <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <Key size={13} /> 3. 账号密码保存与双击自动登录
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                支持持久化保存多个玩家账号与密码。开启“双击自动登录”后，双击账号卡片或登录快捷栏，登录器会将凭证注入游戏进程启动命令（如 <code>/id:account /pwd:hash /autologin</code>），跳过手动输入直接进入角色选择界面！
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-5xl flex items-center justify-between text-[11px] text-neutral-500 pt-3 border-t border-neutral-800">
        <div>Trickster Online Launcher & Patch Suite • Direct3D 9 & React Web Migration</div>
        <div className="flex items-center space-x-3">
          <span>服务器状态: {updateServerTimeout || isUpdateServerOffline ? '离线就绪' : '正常'}</span>
          <span>•</span>
          <span>游戏服: {gameServer.ip}:{gameServer.port}</span>
          <span>•</span>
          <a
            href={config.websiteLink}
            target="_blank"
            rel="noreferrer"
            className="text-amber-400/80 hover:text-amber-400"
          >
            官网链接
          </a>
        </div>
      </footer>

      {/* Modals */}
      <OptionDialog
        isOpen={isOptionOpen}
        onClose={() => setIsOptionOpen(false)}
        options={options}
        onOptionsChange={setOptions}
        isDllInjectEnable={config.isDllInjectEnable}
        injectDLLName={config.injectDLLName}
        onToggleDllInject={(enable) => setConfig({ ...config, isDllInjectEnable: enable })}
        language={language}
        onLanguageChange={setLanguage}
      />

      <FileListGenDialog
        isOpen={isFileListGenOpen}
        onClose={() => setIsFileListGenOpen(false)}
        patchVersions={patchVersions}
        onAddPatchVersion={(newV) => setPatchVersions([...patchVersions, newV])}
        isMaintenance={isMaintenance}
        onToggleMaintenance={setIsMaintenance}
        serverFiles={serverFiles}
        onUpdateServerFiles={setServerFiles}
        launcherHash={launcherHash}
        onUpdateLauncherHash={setLauncherHash}
      />

      <ConfigEditorDialog
        isOpen={isConfigEditorOpen}
        onClose={() => setIsConfigEditorOpen(false)}
        config={config}
        onSaveConfig={setConfig}
      />

      {/* User Requested: Server IP & Port Dialog */}
      <ServerConfigDialog
        isOpen={isServerConfigOpen}
        onClose={() => setIsServerConfigOpen(false)}
        serverConfig={gameServer}
        onSave={handleSaveGameServer}
        launcherConfig={config}
        onSaveLauncherConfig={handleSaveLauncherConfig}
      />

      {/* User Requested: Account & Auto-Login Dialog */}
      <AccountManagerDialog
        isOpen={isAccountManagerOpen}
        onClose={() => setIsAccountManagerOpen(false)}
        accounts={savedAccounts}
        activeAccountId={activeAccountId}
        onSaveAccounts={handleSaveAccounts}
        onSelectAccount={handleSelectAccount}
        onLaunchWithAccount={handleLaunchWithAccount}
      />

      {/* Game Client Simulation */}
      <GameClientSimulation
        isOpen={isGameRunning}
        onClose={() => setIsGameRunning(false)}
        options={options}
        isDllInjected={config.isDllInjectEnable}
        dllName={config.injectDLLName}
        serverConfig={gameServer}
        activeAccount={activeAccount}
      />
    </div>
  );
}

export default App;

