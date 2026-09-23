import React, { useState, useEffect } from 'react';
import { LauncherConfig, GameServerConfig, UserAccount } from '../types';
import { LANGUAGES } from '../data/languages';
import {
  Minus,
  X,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Server,
  Key,
  WifiOff,
  Zap,
  Play,
  Check,
  User,
  Activity,
  AlertTriangle,
  Settings2,
  Cpu
} from 'lucide-react';

interface DesktopLauncherProps {
  config: LauncherConfig;
  language: 'en' | 'pt' | 'zh';
  isMaintenance: boolean;
  fileProgress: number;
  totalProgress: number;
  statusText: string;
  speedText: string;
  isWorkerDone: boolean;
  isUpdateServerOffline?: boolean;
  updateServerTimeout?: boolean;
  gameServer: GameServerConfig;
  savedAccounts: UserAccount[];
  activeAccount: UserAccount | null;
  onCheckFiles: () => void;
  onOpenOptions: () => void;
  onGameStart: () => void;
  onExit: () => void;
  activeNewsUrl?: string;
  onOpenAdmin: () => void;
  onOpenConfig: () => void;
  onOpenServerConfig: () => void;
  onOpenAccountManager: () => void;
  onSelectAccount: (accountId: string) => void;
  onLaunchWithAccount: (account: UserAccount) => void;
  onRetryConnection: () => void;
  onOpenAutoBuild?: () => void;
}

export const DesktopLauncher: React.FC<DesktopLauncherProps> = ({
  config,
  language,
  isMaintenance,
  fileProgress,
  totalProgress,
  statusText,
  speedText,
  isWorkerDone,
  isUpdateServerOffline = false,
  updateServerTimeout = false,
  gameServer,
  savedAccounts,
  activeAccount,
  onCheckFiles,
  onOpenOptions,
  onGameStart,
  onExit,
  onOpenAdmin,
  onOpenConfig,
  onOpenServerConfig,
  onOpenAccountManager,
  onSelectAccount,
  onLaunchWithAccount,
  onRetryConnection,
  onOpenAutoBuild,
}) => {
  const lang = LANGUAGES[language] || LANGUAGES.zh || LANGUAGES.en;

  // Active button pressed state simulation
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [newsTab, setNewsTab] = useState<'notices' | 'events' | 'patchNotes' | 'accounts'>('notices');

  // Locks match C++ logic:
  // When worker is not done, check_l, option_l, game_l are locked
  // BUT if update server timed out or is offline, the user intent explicitly requires:
  // "更新服务器连不上的时候，不要一直等待，而是超时了就提示更新服务器无法连接，但是不影响启动游戏。"
  // Therefore, when updateServerTimeout or isUpdateServerOffline is true, isGameLocked becomes false!
  const isCheckLocked = !isWorkerDone && !updateServerTimeout && !isUpdateServerOffline;
  const isOptionLocked = !isWorkerDone && !updateServerTimeout && !isUpdateServerOffline;
  const isExitLocked = false;
  const isGameLocked = (!isWorkerDone && !updateServerTimeout && !isUpdateServerOffline) || isMaintenance;

  const getButtonSrc = (
    name: 'check' | 'option' | 'exit' | 'game',
    isLocked: boolean
  ) => {
    if (isLocked) {
      return `/resources/normal/${name}.png`;
    }
    if (pressedBtn === name) {
      return `/resources/pressed/${name}.png`;
    }
    if (hoveredBtn === name) {
      return `/resources/hover/${name}.png`;
    }
    return `/resources/normal/${name}.png`;
  };


  return (
    <div
      id="desktop-launcher-window"
      className="relative select-none shadow-2xl rounded-sm overflow-hidden border border-neutral-700 bg-neutral-900"
      style={{
        width: '538px',
        height: '564px',
        backgroundImage: "url('/resources/bg.png')",
        backgroundSize: '538px 564px',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Top Title Bar (x: 0, y: 0 to 24px) */}
      <div className="absolute top-0 left-0 right-0 h-6 flex items-center justify-between px-3 cursor-move z-20">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-neutral-300 drop-shadow">
            {config.windowTitle}
          </span>
          {isMaintenance && (
            <span className="bg-red-600/90 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 shadow">
              <ShieldAlert size={11} /> Maintenance
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[11px] text-neutral-300 drop-shadow">
            {config.subTitle}
          </span>
          <div className="flex items-center space-x-1">
            <button
              id="launcher-min-btn"
              onClick={() => alert('Launcher minimized to tray.')}
              className="text-neutral-400 hover:text-white p-0.5 transition-colors cursor-pointer"
              title="Minimize"
            >
              <Minus size={12} />
            </button>
            <button
              id="launcher-close-btn"
              onClick={onExit}
              className="text-neutral-400 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Embedded News WebView Container (bounds: x:19, y:32, w:503, h:343) */}
      <div
        id="launcher-webview-container"
        className="absolute bg-neutral-950/90 rounded border border-neutral-700/60 overflow-hidden flex flex-col text-neutral-200"
        style={{
          left: '19px',
          top: '32px',
          width: '503px',
          height: '343px',
        }}
      >
        {/* WebView Header Bar with Quick Nav */}
        <div className="h-8 bg-neutral-900/95 border-b border-neutral-800 flex items-center justify-between px-3 text-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setNewsTab('notices')}
              className={`font-medium transition-colors cursor-pointer ${
                newsTab === 'notices'
                  ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Notices
            </button>
            <button
              onClick={() => setNewsTab('events')}
              className={`font-medium transition-colors cursor-pointer ${
                newsTab === 'events'
                  ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setNewsTab('patchNotes')}
              className={`font-medium transition-colors cursor-pointer ${
                newsTab === 'patchNotes'
                  ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Patch Notes
            </button>
            <button
              onClick={() => setNewsTab('accounts')}
              className={`font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                newsTab === 'accounts'
                  ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Key size={11} /> 账号与自动登录
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-neutral-400">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                updateServerTimeout || isUpdateServerOffline
                  ? 'bg-amber-500'
                  : 'bg-emerald-500 animate-pulse'
              }`}
            ></span>
            <span>{config.launcherCDN}</span>
            {(updateServerTimeout || isUpdateServerOffline) && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-medium border border-amber-500/40">
                离线
              </span>
            )}
          </div>
        </div>

        {/* WebView Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 text-xs bg-gradient-to-b from-neutral-900/80 to-neutral-950/90">
          {/* Timeout / Offline Notice Banner */}
          {(updateServerTimeout || isUpdateServerOffline) && (
            <div className="bg-amber-950/90 border border-amber-500/70 text-amber-200 text-[11px] p-2.5 rounded-md flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>更新服务器连接超时</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.2 rounded border border-amber-500/40">
                      {config.updateTimeoutSeconds || 3}s 阈值
                    </span>
                  </div>
                  <div className="text-neutral-300 text-[10px] mt-0.5">
                    已进入离线就绪模式，不影响游戏正常启动。可直接点击“进入游戏”或双击账号。
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={onOpenServerConfig}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 border border-neutral-700"
                  title="手动修改更新服务器 CDN 地址或调整超时时间"
                >
                  <Settings2 size={10} /> 配置更新源/超时
                </button>
                <button
                  type="button"
                  onClick={onRetryConnection}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 shadow"
                >
                  <RefreshCw size={10} /> 重新连接
                </button>
              </div>
            </div>
          )}

          {newsTab === 'notices' && (
            <div className="space-y-2.5">
              {/* Featured Banner */}
              <div className="relative rounded bg-gradient-to-r from-amber-950/60 via-purple-950/60 to-indigo-950/60 border border-amber-500/30 p-3 shadow">
                <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold tracking-wide uppercase mb-1">
                  <Sparkles size={12} /> Server News & Announcement
                </div>
                <h3 className="font-semibold text-sm text-amber-100">
                  Welcome to Trickster Online Revolution!
                </h3>
                <p className="text-neutral-300 text-[11px] mt-1 leading-relaxed">
                  Enjoy high-speed CDN auto-patching, full widescreen support up to 1080p,
                  balanced drilling rates, and exciting guild battles.
                </p>
              </div>

              <div className="bg-neutral-900/70 p-2.5 rounded border border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-blue-400 font-medium">[Update] Episode 6 Island of Caballa</span>
                  <span className="text-neutral-500">2026-09-12</span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  New drilling areas open in Caballa Relics dungeons. Rare artifact excavation multiplier active this weekend!
                </p>
              </div>

              <div className="bg-neutral-900/70 p-2.5 rounded border border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-400 font-medium">[Security] MD5 File Integrity Enforced</span>
                  <span className="text-neutral-500">2026-09-08</span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Direct3D launcher validates all client packages against manifest hashes before launch to ensure anti-cheat compliance.
                </p>
              </div>
            </div>
          )}

          {newsTab === 'events' && (
            <div className="space-y-2">
              <div className="bg-neutral-900/70 p-2.5 rounded border border-emerald-900/40 space-y-1">
                <span className="text-emerald-400 font-bold text-[11px]">[Active Event] Mega Drill Festival</span>
                <p className="text-neutral-300 text-[11px]">
                  Drill depth cap increased + 100% additional EXP gained from all excavation treasures across Megalo Island.
                </p>
              </div>
              <div className="bg-neutral-900/70 p-2.5 rounded border border-neutral-800 space-y-1">
                <span className="text-purple-400 font-bold text-[11px]">[Weekend Boost] EXP & Pet Evolution x2</span>
                <p className="text-neutral-300 text-[11px]">
                  Double card battle rating and double pet affection gained in all party instances this Saturday & Sunday.
                </p>
              </div>
            </div>
          )}

          {newsTab === 'patchNotes' && (
            <div className="space-y-2 font-mono text-[11px]">
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <div className="text-amber-400 font-bold mb-1">Patch v2.04 Notes</div>
                <ul className="text-neutral-300 space-y-0.5 list-disc list-inside">
                  <li>Added client resolution options: 1920x1080 and 1280x720.</li>
                  <li>Updated `Splash.exe` launcher MD5 check routines.</li>
                  <li>Fixed BGM loop hitching in Megalo Shop Plaza.</li>
                  <li>Enhanced DLL inject compatibility for custom overlays.</li>
                </ul>
              </div>
            </div>
          )}

          {newsTab === 'accounts' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={12} /> 已保存的快捷账号 (双击卡片直接启动游戏)
                </span>
                <button
                  type="button"
                  onClick={onOpenAccountManager}
                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-medium transition-colors cursor-pointer"
                >
                  管理账号
                </button>
              </div>

              <div className="space-y-2">
                {savedAccounts.map((acc) => {
                  const isCurrent = activeAccount?.id === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onDoubleClick={() => onLaunchWithAccount(acc)}
                      onClick={() => onSelectAccount(acc.id)}
                      className={`p-2 rounded border transition-all cursor-pointer flex items-center justify-between text-xs ${
                        isCurrent
                          ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                      }`}
                      title="双击以此账号直接启动并自动登录"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] ${
                            isCurrent
                              ? 'bg-amber-500 text-black'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {acc.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-neutral-100 truncate text-[11px]">
                            {acc.nickname || acc.username}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            账号: {acc.username}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {acc.autoLogin && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-medium border border-emerald-500/40 flex items-center gap-0.5">
                            <Zap size={9} /> 自动登录
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLaunchWithAccount(acc);
                          }}
                          className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Play size={9} fill="white" /> 双击启动
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800/80 text-[11px] text-neutral-400 flex items-center gap-2">
                <Sparkles size={12} className="text-amber-400 shrink-0" />
                <span>双击上方任意账号卡片，游戏客户端将跳过密码输入直接进入角色选择！</span>
              </div>
            </div>
          )}
        </div>

        {/* WebView Bottom Status */}
        <div className="h-6 bg-neutral-950 border-t border-neutral-800/80 px-3 flex items-center justify-between text-[10px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span>CDN: {config.isCDNUsingSSL ? 'HTTPS / SSL' : 'HTTP'}</span>
            <span>•</span>
            <span>DLL Inject: {config.isDllInjectEnable ? config.injectDLLName : 'Disabled'}</span>
          </div>
          <a
            href={config.websiteLink}
            target="_blank"
            rel="noreferrer"
            className="text-amber-400/90 hover:text-amber-300 flex items-center gap-1"
          >
            Official Web <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Progress & Status labels (x: 23, y: 379 [winSize.y - 185]) */}
      <div
        className="absolute flex items-center justify-between text-[11px] text-neutral-100 font-medium select-none"
        style={{
          left: '23px',
          top: '379px',
          width: '492px',
        }}
      >
        <span className="truncate max-w-[340px] drop-shadow-md">
          {statusText}
        </span>
        <span className="font-mono text-neutral-300 drop-shadow-md">
          {speedText}
        </span>
      </div>

      {/* Dual Progress Bars:
          File progress: x: 24, y: 399 [winSize.y - 165], w: 362, h: 7
          Total progress: x: 24, y: 412 [winSize.y - 152], w: 362, h: 12
      */}
      {/* File Progress Bar (White) */}
      <div
        id="launcher-file-progress"
        className="absolute bg-neutral-800/90 rounded-[2px] overflow-hidden border border-neutral-700/80 shadow-inner"
        style={{
          left: '24px',
          top: '399px',
          width: '362px',
          height: '7px',
        }}
      >
        <div
          className="h-full bg-white transition-all duration-150 ease-out shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{ width: `${Math.min(Math.max(fileProgress * 100, 0), 100)}%` }}
        />
      </div>

      {/* Total Progress Bar (Cyan #85F2FE) */}
      <div
        id="launcher-total-progress"
        className="absolute bg-neutral-800/90 rounded-[2px] overflow-hidden border border-neutral-700/80 shadow-inner"
        style={{
          left: '24px',
          top: '412px',
          width: '362px',
          height: '12px',
        }}
      >
        <div
          className="h-full transition-all duration-150 ease-out"
          style={{
            backgroundColor: '#85f2fe',
            width: `${Math.min(Math.max(totalProgress * 100, 0), 100)}%`,
            boxShadow: '0 0 10px rgba(133, 242, 254, 0.7)',
          }}
        />
      </div>

      {/* Action Buttons: Check, Option, Exit (y: 432 [winSize.y - 132], w: 113, h: 27) */}
      {/* Check Files Button (x: 23) */}
      <div
        id="launcher-check-btn"
        className="absolute cursor-pointer"
        style={{
          left: '23px',
          top: '432px',
          width: '113px',
          height: '27px',
          opacity: isCheckLocked ? 0.45 : 1,
          filter: isCheckLocked ? 'grayscale(100%)' : 'none',
          pointerEvents: isCheckLocked ? 'none' : 'auto',
        }}
        onMouseEnter={() => setHoveredBtn('check')}
        onMouseLeave={() => {
          setHoveredBtn(null);
          setPressedBtn(null);
        }}
        onMouseDown={() => !isCheckLocked && setPressedBtn('check')}
        onMouseUp={() => {
          if (pressedBtn === 'check' && !isCheckLocked) {
            onCheckFiles();
          }
          setPressedBtn(null);
        }}
      >
        <img
          src={getButtonSrc('check', isCheckLocked)}
          alt="Check Files"
          className="w-full h-full object-contain pixelated"
          draggable={false}
        />
      </div>

      {/* Option Button (x: 150) */}
      <div
        id="launcher-option-btn"
        className="absolute cursor-pointer"
        style={{
          left: '150px',
          top: '432px',
          width: '113px',
          height: '27px',
          opacity: isOptionLocked ? 0.45 : 1,
          filter: isOptionLocked ? 'grayscale(100%)' : 'none',
          pointerEvents: isOptionLocked ? 'none' : 'auto',
        }}
        onMouseEnter={() => setHoveredBtn('option')}
        onMouseLeave={() => {
          setHoveredBtn(null);
          setPressedBtn(null);
        }}
        onMouseDown={() => !isOptionLocked && setPressedBtn('option')}
        onMouseUp={() => {
          if (pressedBtn === 'option' && !isOptionLocked) {
            onOpenOptions();
          }
          setPressedBtn(null);
        }}
      >
        <img
          src={getButtonSrc('option', isOptionLocked)}
          alt="Option"
          className="w-full h-full object-contain pixelated"
          draggable={false}
        />
      </div>

      {/* Exit Button (x: 274) */}
      <div
        id="launcher-exit-btn"
        className="absolute cursor-pointer"
        style={{
          left: '274px',
          top: '432px',
          width: '113px',
          height: '27px',
          opacity: isExitLocked ? 0.45 : 1,
        }}
        onMouseEnter={() => setHoveredBtn('exit')}
        onMouseLeave={() => {
          setHoveredBtn(null);
          setPressedBtn(null);
        }}
        onMouseDown={() => !isExitLocked && setPressedBtn('exit')}
        onMouseUp={() => {
          if (pressedBtn === 'exit' && !isExitLocked) {
            onExit();
          }
          setPressedBtn(null);
        }}
      >
        <img
          src={getButtonSrc('exit', isExitLocked)}
          alt="Exit"
          className="w-full h-full object-contain pixelated"
          draggable={false}
        />
      </div>

      {/* Big Game Start Button: x: 399 [winSize.x - 139], y: 398 [winSize.y - 166], w: 118, h: 61 */}
      <div
        id="launcher-game-btn"
        className="absolute cursor-pointer"
        style={{
          left: '399px',
          top: '398px',
          width: '118px',
          height: '61px',
          opacity: isGameLocked ? 0.45 : 1,
          filter: isGameLocked ? 'grayscale(100%)' : 'none',
          pointerEvents: isGameLocked ? 'none' : 'auto',
        }}
        onMouseEnter={() => setHoveredBtn('game')}
        onMouseLeave={() => {
          setHoveredBtn(null);
          setPressedBtn(null);
        }}
        onMouseDown={() => !isGameLocked && setPressedBtn('game')}
        onMouseUp={() => {
          if (pressedBtn === 'game' && !isGameLocked) {
            onGameStart();
          }
          setPressedBtn(null);
        }}
      >
        <img
          src={getButtonSrc('game', isGameLocked)}
          alt="Game Start"
          className="w-full h-full object-contain pixelated"
          draggable={false}
        />
      </div>

      {/* Trickster Logo: x: 11, y: 466 [winSize.y - 98], w: 185, h: 71 */}
      <div
        id="launcher-logo"
        className="absolute pointer-events-none"
        style={{
          left: '11px',
          top: '466px',
          width: '185px',
          height: '71px',
        }}
      >
        <img
          src="/resources/logo.png"
          alt="Trickster Online Logo"
          className="w-full h-full object-contain pixelated"
          draggable={false}
        />
      </div>

      {/* Middle Interactive Toolbar: Server Config & Account Auto-Login (x: 202, y: 466, w: 320) */}
      <div
        id="launcher-quick-action-dock"
        className="absolute flex flex-col gap-1.5 z-10"
        style={{
          left: '202px',
          top: '464px',
          width: '320px',
        }}
      >
        <div className="flex items-center gap-1.5">
          {/* Main User Requested Button: Server IP & Port Configuration */}
          <button
            id="launcher-server-config-btn"
            type="button"
            onClick={onOpenServerConfig}
            className="flex-1 bg-neutral-900/95 hover:bg-neutral-800/95 border border-amber-500/70 hover:border-amber-400 text-neutral-100 rounded px-2.5 py-1 flex items-center justify-between text-left transition-all shadow-md group cursor-pointer"
            title="配置游戏服务器IP与端口 (Game Server Settings)"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded bg-amber-500/25 text-amber-300 flex items-center justify-center shrink-0">
                <Server size={12} />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  服务器设置 <span className="text-[8px] bg-emerald-500/25 text-emerald-300 px-1 rounded font-mono">{gameServer.pingMs || 20}ms</span>
                </div>
                <div className="text-[10px] font-mono text-neutral-200 truncate leading-none mt-0.5">
                  {gameServer.ip}:{gameServer.port}
                </div>
              </div>
            </div>
            <span className="text-[9px] text-amber-400/90 group-hover:text-amber-200 font-semibold px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 shrink-0">
              配置IP/端口
            </span>
          </button>

          {/* Account Auto-Login / Selection Bar */}
          <button
            id="launcher-account-quick-btn"
            type="button"
            onClick={onOpenAccountManager}
            onDoubleClick={() => activeAccount && onLaunchWithAccount(activeAccount)}
            className="flex-1 bg-neutral-900/95 hover:bg-neutral-800/95 border border-neutral-700/90 hover:border-amber-500/60 text-neutral-100 rounded px-2.5 py-1 flex items-center justify-between text-left transition-all shadow-md group cursor-pointer"
            title="双击以此账号直接启动并自动登录，单击切换或管理账号"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                <Key size={12} />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  登录账号 {activeAccount?.autoLogin && <Zap size={8} className="text-emerald-400" />}
                </div>
                <div className="text-[10px] font-mono text-neutral-200 truncate leading-none mt-0.5">
                  {activeAccount ? activeAccount.username : '未设置账号'}
                </div>
              </div>
            </div>
            <span className="text-[9px] text-neutral-400 group-hover:text-amber-300 font-semibold px-1 py-0.5 rounded bg-neutral-800/60 shrink-0">
              双击登录
            </span>
          </button>
        </div>

        {/* Website Link and Quick Help */}
        <div className="flex items-center justify-between text-[10px] text-neutral-300 px-1 select-none">
          <div className="flex items-center gap-1 text-neutral-400">
            <span>{lang.launcher_site_desc}</span>
            <a
              id="launcher-site-click-link"
              href={config.websiteLink}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
            >
              {lang.launcher_site_click}
            </a>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenConfig}
              className="hover:text-neutral-100 text-neutral-400 px-1 py-0.5 rounded transition-colors cursor-pointer text-[9px]"
              title="Edit Config.cpp"
            >
              Config.cpp
            </button>
            <span>•</span>
            <button
              onClick={onOpenAdmin}
              className="hover:text-amber-300 text-neutral-400 px-1 py-0.5 rounded transition-colors cursor-pointer text-[9px]"
              title="Open FileListGen.exe"
            >
              FileListGen
            </button>
            {onOpenAutoBuild && (
              <>
                <span>•</span>
                <button
                  onClick={onOpenAutoBuild}
                  className="hover:text-emerald-300 text-emerald-400/90 px-1 py-0.5 rounded transition-colors cursor-pointer text-[9px] flex items-center gap-0.5 font-medium"
                  title="查看与运行 GitHub Actions 自动编译流水线"
                >
                  <Cpu size={9} className="text-emerald-400" />
                  自动编译 CI/CD
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
