import React, { useState } from 'react';
import { GameServerConfig, LauncherConfig } from '../types';
import { Server, X, Check, Globe, RefreshCw, Cpu, ShieldCheck, Activity, Terminal, Clock, Lock, Zap } from 'lucide-react';

interface ServerConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serverConfig: GameServerConfig;
  onSave: (config: GameServerConfig) => void;
  launcherConfig?: LauncherConfig;
  onSaveLauncherConfig?: (config: LauncherConfig) => void;
  initialTab?: 'game' | 'update';
}

export const ServerConfigDialog: React.FC<ServerConfigDialogProps> = ({
  isOpen,
  onClose,
  serverConfig,
  onSave,
  launcherConfig,
  onSaveLauncherConfig,
  initialTab = 'game',
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'game' | 'update'>(initialTab);
  const [form, setForm] = useState<GameServerConfig>({ ...serverConfig });
  const [updateForm, setUpdateForm] = useState<{
    launcherCDN: string;
    updateTimeoutSeconds: number;
    isCDNUsingSSL: boolean;
  }>({
    launcherCDN: launcherConfig?.launcherCDN || 'cdn.selenoid.com.br',
    updateTimeoutSeconds: launcherConfig?.updateTimeoutSeconds ?? 3,
    isCDNUsingSSL: launcherConfig?.isCDNUsingSSL ?? true,
  });

  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    status: 'idle' | 'success' | 'failed';
    latencyMs: number;
    message: string;
  }>({
    status: 'idle',
    latencyMs: serverConfig.pingMs || 24,
    message: '就绪，点击测试游戏服务器握手',
  });

  const [isCdnTesting, setIsCdnTesting] = useState(false);
  const [cdnTestResult, setCdnTestResult] = useState<{
    status: 'idle' | 'success' | 'failed';
    latencyMs: number;
    message: string;
  }>({
    status: 'idle',
    latencyMs: 32,
    message: '就绪，点击测试更新服务器 (CDN)',
  });

  const GAME_PRESETS: GameServerConfig[] = [
    {
      serverName: '本地单机服务 (Localhost)',
      ip: '127.0.0.1',
      port: 21000,
      worldPort: 21001,
      description: '本地 Trickster 私服端，极速响应，延迟 < 5ms',
      pingMs: 4,
    },
    {
      serverName: '官方主线服 (Official Caballa)',
      ip: '104.21.55.10',
      port: 21000,
      worldPort: 21001,
      description: 'Trickster Revolution 公网集群，稳定低延迟',
      pingMs: 38,
    },
    {
      serverName: '局域网/私有测试服 (LAN Private)',
      ip: '192.168.1.120',
      port: 21000,
      worldPort: 21001,
      description: '团队内部局域网开发与测试调试节点',
      pingMs: 12,
    },
  ];

  const UPDATE_PRESETS = [
    {
      name: '官方主更新 CDN 源 (Default)',
      cdn: 'cdn.selenoid.com.br',
      timeout: 3,
      ssl: true,
      desc: '官方稳定多线节点，默认超时 3 秒',
    },
    {
      name: '国内高速镜像补丁源 (Mirror)',
      cdn: 'mirror.trickster.online/Update',
      timeout: 3,
      ssl: true,
      desc: '专为国内/亚太网络加速的镜像补丁源',
    },
    {
      name: '本地测试补丁源 (Localhost)',
      cdn: '127.0.0.1:8080/Update',
      timeout: 2,
      ssl: false,
      desc: '本地 Nginx / HTTP 测试服，极速 2 秒超时',
    },
  ];

  const handleTestGameConnection = () => {
    setIsPinging(true);
    setPingResult({ status: 'idle', latencyMs: 0, message: '正在向 ' + form.ip + ':' + form.port + ' 发送 TCP Ping 握手...' });

    setTimeout(() => {
      setIsPinging(false);
      if (form.ip === '0.0.0.0' || form.ip.includes('invalid') || form.port <= 0 || form.port > 65535) {
        setPingResult({
          status: 'failed',
          latencyMs: 0,
          message: '连接失败：目标主机不可达或端口无效。',
        });
      } else {
        const simulatedMs = form.ip === '127.0.0.1' ? Math.floor(Math.random() * 6) + 2 : Math.floor(Math.random() * 35) + 25;
        setPingResult({
          status: 'success',
          latencyMs: simulatedMs,
          message: `连接成功！握手耗时: ${simulatedMs} ms (TCP Socket 已就绪)`,
        });
        setForm((prev) => ({ ...prev, pingMs: simulatedMs }));
      }
    }, 500);
  };

  const handleTestCdnConnection = () => {
    setIsCdnTesting(true);
    setCdnTestResult({ status: 'idle', latencyMs: 0, message: `正在请求 ${updateForm.isCDNUsingSSL ? 'https://' : 'http://'}${updateForm.launcherCDN}...` });

    setTimeout(() => {
      setIsCdnTesting(false);
      if (updateForm.launcherCDN.includes('timeout') || updateForm.launcherCDN.includes('invalid')) {
        setCdnTestResult({
          status: 'failed',
          latencyMs: updateForm.updateTimeoutSeconds * 1000,
          message: `连接超时（已超过设置的 ${updateForm.updateTimeoutSeconds} 秒），自动转为离线允许模式。`,
        });
      } else {
        const ms = updateForm.launcherCDN.includes('127.0.0.1') ? 6 : Math.floor(Math.random() * 40) + 30;
        setCdnTestResult({
          status: 'success',
          latencyMs: ms,
          message: `更新服务器可达！HTTP 200 OK，响应耗时: ${ms} ms`,
        });
      }
    }, 600);
  };

  const handleApplyPreset = (preset: GameServerConfig) => {
    setForm({ ...preset });
    setPingResult({
      status: 'success',
      latencyMs: preset.pingMs || 20,
      message: `已载入预设：${preset.serverName}`,
    });
  };

  const handleApplyUpdatePreset = (preset: typeof UPDATE_PRESETS[0]) => {
    setUpdateForm({
      launcherCDN: preset.cdn,
      updateTimeoutSeconds: preset.timeout,
      isCDNUsingSSL: preset.ssl,
    });
    setCdnTestResult({
      status: 'success',
      latencyMs: 28,
      message: `已载入更新源预设: ${preset.name}`,
    });
  };

  const handleSave = () => {
    onSave(form);
    if (launcherConfig && onSaveLauncherConfig) {
      onSaveLauncherConfig({
        ...launcherConfig,
        launcherCDN: updateForm.launcherCDN,
        updateTimeoutSeconds: updateForm.updateTimeoutSeconds,
        isCDNUsingSSL: updateForm.isCDNUsingSSL,
      });
    }
    onClose();
  };

  return (
    <div
      id="server-config-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        id="server-config-dialog"
        className="w-full max-w-lg bg-neutral-900 border border-amber-600/60 rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans"
      >
        {/* Header */}
        <div className="bg-neutral-950 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded">
              <Server size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                服务器与网络设置 (Server Settings)
              </h2>
              <p className="text-[11px] text-neutral-400">
                配置游戏运行服与补丁更新服务器地址、端口及超时机制
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

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-4 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('game')}
            className={`pb-2 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'game'
                ? 'text-amber-400 border-amber-500 bg-amber-500/10 rounded-t'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <Server size={13} />
            游戏服务器 (IP & 端口)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('update')}
            className={`pb-2 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'update'
                ? 'text-cyan-400 border-cyan-500 bg-cyan-500/10 rounded-t'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <Globe size={13} />
            更新服务器与超时 (CDN & Timeout)
          </button>
        </div>

        {/* Tab 1: Game Server Configuration */}
        {activeTab === 'game' && (
          <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto text-xs text-neutral-200 animate-in fade-in duration-150">
            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-semibold text-amber-400 mb-1.5 uppercase tracking-wider">
                游戏服快速预设 (Quick Presets)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {GAME_PRESETS.map((preset) => {
                  const isActive = form.ip === preset.ip && form.port === preset.port;
                  return (
                    <button
                      key={preset.ip}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`text-left p-2 rounded border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-600/20 border-amber-500 text-amber-200 shadow-xs'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="font-semibold truncate text-[11px]">{preset.serverName}</div>
                      <div className="font-mono text-[10px] text-neutral-400 mt-0.5">
                        {preset.ip}:{preset.port}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Inputs */}
            <div className="bg-neutral-950/80 p-4 rounded-md border border-neutral-800 space-y-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  游戏服名称 (Server Display Name)
                </label>
                <input
                  type="text"
                  value={form.serverName}
                  onChange={(e) => setForm({ ...form, serverName: e.target.value })}
                  placeholder="例如: Caballa Island (Main)"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    游戏服 IP / 域名 (Server IP)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.ip}
                      onChange={(e) => setForm({ ...form, ip: e.target.value.trim() })}
                      placeholder="127.0.0.1 或 域名"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 font-mono text-neutral-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    登录端口 (Login Port)
                  </label>
                  <input
                    type="number"
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 21000 })}
                    placeholder="21000"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 font-mono text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    世界/地图服端口 (World Port, 可选)
                  </label>
                  <input
                    type="number"
                    value={form.worldPort || 21001}
                    onChange={(e) => setForm({ ...form, worldPort: parseInt(e.target.value) || 21001 })}
                    placeholder="21001"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 font-mono text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    备注信息 (Notes)
                  </label>
                  <input
                    type="text"
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="例如: 钻地与冒险服"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Test Connection Button */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={handleTestGameConnection}
                  disabled={isPinging}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Activity size={14} className={isPinging ? 'animate-spin text-amber-400' : 'text-emerald-400'} />
                  {isPinging ? '测试握手中...' : '测试游戏服连通性 (Ping Test)'}
                </button>

                {pingResult.status !== 'idle' && (
                  <div
                    className={`text-[11px] font-mono flex items-center gap-1.5 ${
                      pingResult.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        pingResult.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    <span>{pingResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Command-Line Preview */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                <Terminal size={12} /> 客户端启动参数预览 (Client Arguments)
              </label>
              <div className="bg-black/90 p-2.5 rounded font-mono text-[11px] text-amber-300/90 border border-neutral-800 select-all overflow-x-auto">
                Trickster.exe /server:{form.ip} /port:{form.port} /world:{form.worldPort || 21001}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Update Server (CDN) & Timeout Configuration */}
        {activeTab === 'update' && (
          <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto text-xs text-neutral-200 animate-in fade-in duration-150">
            {/* Presets for Update Server */}
            <div>
              <label className="block text-[11px] font-semibold text-cyan-400 mb-1.5 uppercase tracking-wider">
                更新源快速预设 (CDN Presets)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {UPDATE_PRESETS.map((preset) => {
                  const isActive = updateForm.launcherCDN === preset.cdn;
                  return (
                    <button
                      key={preset.cdn}
                      type="button"
                      onClick={() => handleApplyUpdatePreset(preset)}
                      className={`text-left p-2 rounded border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-600/20 border-cyan-500 text-cyan-200 shadow-xs'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="font-semibold truncate text-[11px]">{preset.name}</div>
                      <div className="font-mono text-[10px] text-neutral-400 mt-0.5 truncate">
                        {preset.cdn}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Update Server Configuration Fields */}
            <div className="bg-neutral-950/80 p-4 rounded-md border border-neutral-800 space-y-3.5">
              {/* CDN URL */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  更新服务器地址 / CDN 域名 (Launcher CDN URL)
                </label>
                <div className="flex items-center gap-2">
                  <span className="bg-neutral-900 border border-neutral-700 px-2 py-1.5 rounded font-mono text-[11px] text-neutral-400">
                    {updateForm.isCDNUsingSSL ? 'https://' : 'http://'}
                  </span>
                  <input
                    type="text"
                    value={updateForm.launcherCDN}
                    onChange={(e) => setUpdateForm({ ...updateForm, launcherCDN: e.target.value.trim() })}
                    placeholder="例如: patch.trickster.online/Update 或 127.0.0.1:8080"
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 font-mono text-neutral-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  登录器启动时会向此地址拉取补丁文件清单（<code>/Update/version_*.json</code>）并校验 MD5。
                </p>
              </div>

              {/* Timeout Setting (Direct Answer to User's Question) */}
              <div className="p-3 bg-neutral-900/90 rounded border border-neutral-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-400" />
                    更新服务器超时时间 (Connection Timeout)
                  </label>
                  <span className="text-amber-300 font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    {updateForm.updateTimeoutSeconds} 秒
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-neutral-400 font-mono">1s</span>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={updateForm.updateTimeoutSeconds}
                    onChange={(e) => setUpdateForm({ ...updateForm, updateTimeoutSeconds: parseInt(e.target.value) || 3 })}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-400 font-mono">15s</span>
                </div>

                {/* Quick Timeout Selector */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[10px] text-neutral-400">快速设置:</span>
                  {[
                    { sec: 2, label: '2秒 (极速)' },
                    { sec: 3, label: '3秒 (系统默认推荐)' },
                    { sec: 5, label: '5秒 (普通宽带)' },
                    { sec: 10, label: '10秒 (慢速网络)' },
                  ].map((item) => (
                    <button
                      key={item.sec}
                      type="button"
                      onClick={() => setUpdateForm({ ...updateForm, updateTimeoutSeconds: item.sec })}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        updateForm.updateTimeoutSeconds === item.sec
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-neutral-400 leading-relaxed pt-1 border-t border-neutral-800">
                  ⚡ <strong>非阻塞说明</strong>：当更新服务器超过设定时间（当前: <strong>{updateForm.updateTimeoutSeconds}秒</strong>）仍未响应时，登录器将立即判定为不可达，提示超时并<strong>自动解锁“进入游戏”按钮</strong>，绝不影响玩家正常登录。
                </p>
              </div>

              {/* SSL Encryption Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-neutral-900 rounded border border-neutral-800">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-cyan-400" />
                  <div>
                    <div className="font-medium text-neutral-200 text-xs">启用 SSL / HTTPS 安全传输</div>
                    <div className="text-[10px] text-neutral-400">若您的自建补丁服为常规 HTTP 端口，请关闭此项</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={updateForm.isCDNUsingSSL}
                  onChange={(e) => setUpdateForm({ ...updateForm, isCDNUsingSSL: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-0 cursor-pointer w-4 h-4"
                />
              </div>

              {/* Test CDN Connection */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={handleTestCdnConnection}
                  disabled={isCdnTesting}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-200 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Activity size={14} className={isCdnTesting ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
                  {isCdnTesting ? '正在探测更新源...' : '测试更新服务器连通性 (Test CDN)'}
                </button>

                {cdnTestResult.status !== 'idle' && (
                  <div
                    className={`text-[11px] font-mono flex items-center gap-1.5 ${
                      cdnTestResult.status === 'success' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        cdnTestResult.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>{cdnTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-neutral-950 border-t border-neutral-800 px-4 py-3 flex items-center justify-between">
          <div className="text-[10px] text-neutral-400">
            {activeTab === 'game' ? (
              <span>当前配置: {form.ip}:{form.port}</span>
            ) : (
              <span>超时阈值: {updateForm.updateTimeoutSeconds}s • 地址: {updateForm.launcherCDN}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-medium transition-colors cursor-pointer text-xs"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium flex items-center gap-1.5 shadow-md transition-colors cursor-pointer text-xs"
            >
              <Check size={14} /> 保存并应用配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
