import React, { useState } from 'react';
import { UserAccount } from '../types';
import { User, Key, Check, X, Trash2, Plus, Sparkles, ShieldCheck, Zap, Play, Eye, EyeOff } from 'lucide-react';

interface AccountManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  activeAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
  onSaveAccounts: (accounts: UserAccount[]) => void;
  onLaunchWithAccount: (account: UserAccount) => void;
}

export const AccountManagerDialog: React.FC<AccountManagerDialogProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccountId,
  onSelectAccount,
  onSaveAccounts,
  onLaunchWithAccount,
}) => {
  if (!isOpen) return null;

  const [accountList, setAccountList] = useState<UserAccount[]>(accounts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  // New account form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [rememberPass, setRememberPass] = useState(true);
  const [autoLogin, setAutoLogin] = useState(true);
  const [slot, setSlot] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleToggleShowPassword = (id: string) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    const newAcc: UserAccount = {
      id: 'acc-' + Date.now(),
      username: newUsername.trim(),
      password: newPassword,
      nickname: newNickname.trim() || newUsername.trim(),
      rememberPass,
      autoLogin,
      characterSlot: slot,
      lastUsed: 'Just now',
    };

    const updated = [...accountList, newAcc];
    setAccountList(updated);
    onSaveAccounts(updated);
    onSelectAccount(newAcc.id);

    // Reset form
    setNewUsername('');
    setNewPassword('');
    setNewNickname('');
    setIsAdding(false);
  };

  const handleDeleteAccount = (id: string) => {
    const updated = accountList.filter((a) => a.id !== id);
    setAccountList(updated);
    onSaveAccounts(updated);
    if (activeAccountId === id && updated.length > 0) {
      onSelectAccount(updated[0].id);
    }
  };

  const handleToggleAutoLogin = (id: string) => {
    const updated = accountList.map((a) => {
      if (a.id === id) {
        return { ...a, autoLogin: !a.autoLogin };
      }
      return a;
    });
    setAccountList(updated);
    onSaveAccounts(updated);
  };

  return (
    <div
      id="account-manager-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        id="account-manager-dialog"
        className="w-full max-w-lg bg-neutral-900 border border-amber-600/60 rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans"
      >
        {/* Header */}
        <div className="bg-neutral-950 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded">
              <Key size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                账号管理与自动登录 (Account & Auto-Login)
              </h2>
              <p className="text-[11px] text-neutral-400">
                保存账号与密码，双击列表中的账号即可一键自动登录游戏
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

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-neutral-200">
          {/* Tip Banner */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-md p-3 flex items-start gap-2.5">
            <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-200/90 leading-relaxed">
              <strong className="text-amber-300">💡 极速登录提示：</strong>
              <span>
                在下方列表中<strong>双击任意账号</strong>，登录器将直接携带该账号密码启动游戏客户端（Trickster.exe），绕过手动输入界面并自动进入游戏角色选择！
              </span>
            </div>
          </div>

          {/* Accounts List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
                已保存账号列表 ({accountList.length})
              </label>
              <button
                type="button"
                onClick={() => setIsAdding(!isAdding)}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              >
                <Plus size={13} /> {isAdding ? '收起表单' : '添加新账号'}
              </button>
            </div>

            {accountList.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 bg-neutral-950/60 rounded border border-neutral-800">
                暂无保存的账号，请点击上方“添加新账号”。
              </div>
            ) : (
              <div className="space-y-2">
                {accountList.map((acc) => {
                  const isActive = activeAccountId === acc.id;
                  const isVisible = showPassword[acc.id];

                  return (
                    <div
                      key={acc.id}
                      onDoubleClick={() => onLaunchWithAccount(acc)}
                      onClick={() => onSelectAccount(acc.id)}
                      className={`p-3 rounded-md border transition-all cursor-pointer select-none group relative ${
                        isActive
                          ? 'bg-amber-600/15 border-amber-500/80 shadow-xs'
                          : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                      }`}
                      title="双击以此账号直接启动并自动登录游戏"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                              isActive
                                ? 'bg-amber-500 text-black shadow'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {acc.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-neutral-100 text-xs truncate">
                                {acc.nickname || acc.username}
                              </span>
                              {isActive && (
                                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-medium border border-amber-500/40">
                                  当前默认
                                </span>
                              )}
                              {acc.autoLogin && (
                                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-medium border border-emerald-500/40 flex items-center gap-0.5">
                                  <Zap size={9} /> 自动登录
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-2 font-mono mt-0.5">
                              <span>账号: {acc.username}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                密码: {isVisible ? acc.password : '••••••••'}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleShowPassword(acc.id);
                                  }}
                                  className="text-neutral-400 hover:text-neutral-200 cursor-pointer ml-1"
                                >
                                  {isVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                                </button>
                              </span>
                              <span>•</span>
                              <span>角色栏: #{acc.characterSlot || 1}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLaunchWithAccount(acc);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            title="以此账号启动游戏"
                          >
                            <Play size={11} fill="white" /> 双击登录
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAccount(acc.id);
                            }}
                            className="p-1 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="删除账号记录"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Account Form */}
          {isAdding && (
            <form
              onSubmit={handleAddAccount}
              className="bg-neutral-950 p-4 rounded-md border border-neutral-700/80 space-y-3 animate-in fade-in duration-150"
            >
              <div className="font-semibold text-amber-300 text-xs flex items-center gap-1.5">
                <Plus size={13} /> 添加新游戏账号
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 text-[11px] font-medium mb-1">
                    游戏账号 (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="输入账号名"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 focus:border-amber-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 text-[11px] font-medium mb-1">
                    游戏密码 (Password) *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入密码"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 focus:border-amber-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 text-[11px] font-medium mb-1">
                    账号备注/昵称 (可选)
                  </label>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="如: 大号 - 羊法师"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 focus:border-amber-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 text-[11px] font-medium mb-1">
                    默认进入角色栏位
                  </label>
                  <select
                    value={slot}
                    onChange={(e) => setSlot(parseInt(e.target.value) || 1)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 focus:border-amber-500 focus:outline-none text-xs"
                  >
                    <option value={1}>角色槽 1 (Slot 1)</option>
                    <option value={2}>角色槽 2 (Slot 2)</option>
                    <option value={3}>角色槽 3 (Slot 3)</option>
                    <option value={4}>角色槽 4 (Slot 4)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-300">
                  <input
                    type="checkbox"
                    checked={rememberPass}
                    onChange={(e) => setRememberPass(e.target.checked)}
                    className="accent-amber-500"
                  />
                  记住密码 (保存在本地配置)
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-300">
                  <input
                    type="checkbox"
                    checked={autoLogin}
                    onChange={(e) => setAutoLogin(e.target.checked)}
                    className="accent-amber-500"
                  />
                  启用双击自动登录
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 bg-neutral-800 text-neutral-300 hover:text-white rounded text-xs cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium cursor-pointer"
                >
                  保存账号
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-950 border-t border-neutral-800 px-4 py-3 flex items-center justify-between text-xs">
          <div className="text-neutral-400 text-[11px]">
            当前选中默认账号：
            <span className="text-amber-400 font-semibold ml-1">
              {accountList.find((a) => a.id === activeAccountId)?.username || '未选择'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-medium transition-colors cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
