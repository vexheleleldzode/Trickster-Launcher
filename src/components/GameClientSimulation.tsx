import React, { useState, useEffect } from 'react';
import { GameOptionConfig, GameServerConfig, UserAccount } from '../types';
import { X, Play, Shield, Terminal, Volume2, Sparkles, Server, UserCheck, Zap, Globe } from 'lucide-react';

interface GameClientSimulationProps {
  isOpen: boolean;
  onClose: () => void;
  options: GameOptionConfig;
  isDllInjected: boolean;
  dllName: string;
  serverConfig: GameServerConfig;
  activeAccount?: UserAccount | null;
}

export const GameClientSimulation: React.FC<GameClientSimulationProps> = ({
  isOpen,
  onClose,
  options,
  isDllInjected,
  dllName,
  serverConfig,
  activeAccount,
}) => {
  if (!isOpen) return null;

  const [launchStep, setLaunchStep] = useState<number>(0);
  const [drillDepth, setDrillDepth] = useState<number>(0);
  const [excavatedItem, setExcavatedItem] = useState<string | null>(null);

  useEffect(() => {
    // Launch sequence simulation with server connection & auto-login
    const t1 = setTimeout(() => setLaunchStep(1), 500); // Process started & memory allocated
    const t2 = setTimeout(() => setLaunchStep(2), 1100); // DLL injected & Server socket connected
    const t3 = setTimeout(() => setLaunchStep(3), 1700); // Auto-login credentials verified & character loaded
    const t4 = setTimeout(() => setLaunchStep(4), 2300); // Direct3D initialized & in-game world active

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleDig = () => {
    const nextDepth = drillDepth + Math.floor(Math.random() * 8) + 4;
    setDrillDepth(nextDepth);
    const items = [
      'Garnet Jewel [Grade 3]',
      'Ancient Caballa Fossil',
      'High Quality Drill Bit',
      'Golden Beetle Shell',
      'Mystic Compounding Stone',
      'Card Battle Pack #04',
      'Caballa Island Treasure Chest',
    ];
    if (Math.random() > 0.35) {
      setExcavatedItem(items[Math.floor(Math.random() * items.length)]);
    } else {
      setExcavatedItem(null);
    }
  };

  return (
    <div
      id="game-client-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        id="game-client-window"
        className="w-full max-w-3xl bg-neutral-950 border border-amber-600/60 rounded-lg shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Title Bar */}
        <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between text-xs text-neutral-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-bold text-amber-400">Trickster Online - Client Execution (Trickster.exe)</span>
            <span className="text-[10px] text-neutral-400">
              [{options.resolution} • {options.colorDepth} • PID: 5824]
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
          >
            Exit Game (Kill Process)
          </button>
        </div>

        {/* Client Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950/70 via-neutral-950 to-neutral-950 min-h-[440px] text-center">
          {launchStep < 4 ? (
            <div className="space-y-4 max-w-lg w-full">
              <div className="text-amber-400 font-mono text-sm animate-pulse flex items-center justify-center gap-2">
                <Zap size={15} /> 正在启动客户端并连接服务器...
              </div>

              <div className="bg-black/85 rounded p-4 border border-neutral-800 font-mono text-[11px] text-left text-neutral-300 space-y-1.5 shadow-inner">
                <div>[Process] Executed: `Trickster.exe /server:{serverConfig.ip} /port:{serverConfig.port} {activeAccount ? `/id:${activeAccount.username}` : ''}`</div>
                
                {launchStep >= 1 && (
                  <div className="text-emerald-400">
                    [Memory] Allocated game buffer (Heap Size: 256MB)
                  </div>
                )}
                
                {launchStep >= 2 && isDllInjected && (
                  <div className="text-amber-300">
                    [DLL Inject] Remote thread injected `{dllName}` into client process memory!
                  </div>
                )}

                {launchStep >= 2 && (
                  <div className="text-cyan-400 flex items-center gap-1">
                    <Globe size={11} /> [Network] Connected to Game Server ({serverConfig.serverName}): {serverConfig.ip}:{serverConfig.port} (Latency: {serverConfig.pingMs || 24}ms)
                  </div>
                )}

                {launchStep >= 3 && activeAccount ? (
                  <div className="text-emerald-300 flex items-center gap-1 font-semibold">
                    <UserCheck size={12} /> [Auto-Login] 自动登录成功！已载入账号: {activeAccount.username} (角色栏位: #{activeAccount.characterSlot || 1} {activeAccount.nickname})
                  </div>
                ) : launchStep >= 3 ? (
                  <div className="text-neutral-400">
                    [Login] 提示：未设置默认账号，进入手动账号输入界面。
                  </div>
                ) : null}

                {launchStep >= 3 && (
                  <div className="text-blue-400">
                    [DirectX] Direct3D 9 Device created successfully at {options.resolution}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full space-y-5 animate-in fade-in duration-300">
              {/* Game Header */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
                  <Sparkles size={13} /> Trickster Online Revolution — Megalo Island
                </div>
                <h1 className="text-2xl font-bold text-amber-100 tracking-wide mt-2">
                  Welcome to Caballa Island, Traveler!
                </h1>

                {/* Server & Auto-Login Status banner */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                  <span className="bg-neutral-900/90 border border-neutral-700/80 text-neutral-300 px-2.5 py-1 rounded flex items-center gap-1.5">
                    <Server size={12} className="text-amber-400" />
                    服务器: <strong className="text-amber-300">{serverConfig.serverName}</strong> ({serverConfig.ip}:{serverConfig.port})
                  </span>

                  {activeAccount && (
                    <span className="bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 px-2.5 py-1 rounded flex items-center gap-1.5">
                      <UserCheck size={12} className="text-emerald-400" />
                      当前角色: <strong>{activeAccount.nickname || activeAccount.username}</strong>
                      <span className="text-[10px] bg-emerald-500/30 px-1 rounded text-emerald-300">
                        自动登录生效
                      </span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-400 pt-1">
                  Client display: {options.resolution} • {options.windowed ? 'Windowed' : 'Fullscreen'} • BGM: {options.bgmVolume}%
                </p>
              </div>

              {/* Interactive Mini Game: The iconic Trickster Online Drilling Mechanic */}
              <div className="max-w-md mx-auto bg-neutral-900/90 border border-neutral-800 rounded-lg p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between text-xs border-b border-neutral-800 pb-2">
                  <span className="text-neutral-300 font-semibold">Drill Simulation (Drill.gpk)</span>
                  <span className="font-mono text-amber-400">Current Depth: {drillDepth}m</span>
                </div>

                <div className="bg-neutral-950 p-4 rounded border border-neutral-800/80 min-h-[70px] flex items-center justify-center">
                  {excavatedItem ? (
                    <div className="text-emerald-400 font-bold text-xs flex items-center gap-2 animate-bounce">
                      ✨ Found Artifact: {excavatedItem}!
                    </div>
                  ) : drillDepth > 0 ? (
                    <div className="text-neutral-400 text-xs italic">
                      Soil excavated... Keep drilling deeper!
                    </div>
                  ) : (
                    <div className="text-neutral-500 text-xs">
                      Press 'Drill Soil' to test in-game physics & character action!
                    </div>
                  )}
                </div>

                <button
                  onClick={handleDig}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded shadow-lg text-xs tracking-wider uppercase transition-all cursor-pointer"
                >
                  ⛏️ Drill Soil (Action Key)
                </button>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-400 font-mono">
                {isDllInjected && (
                  <span className="text-amber-300 flex items-center gap-1">
                    <Shield size={12} /> {dllName} injected
                  </span>
                )}
                <span>FPS: 60.0</span>
                <span>Ping: {serverConfig.pingMs || 24}ms</span>
                <span>Server Socket: OK</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
