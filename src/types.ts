export interface LauncherConfig {
  windowTitle: string;
  subTitle: string;
  launcherCDN: string;
  baseNewsURL: string;
  websiteLink: string;
  optionExecName: string;
  isCDNUsingSSL: boolean;
  isDllInjectEnable: boolean;
  injectDLLName: string;
  updateTimeoutSeconds?: number;
}

export interface Arquivo {
  FileID: number;
  FileHash: string;
  FilePath: string;
  ToUpdate: boolean;
  sizeBytes?: number;
}

export interface GameOptionConfig {
  resolution: string;
  windowed: boolean;
  colorDepth: '16bit' | '32bit';
  bgmVolume: number;
  sfxVolume: number;
  bgmMute: boolean;
  sfxMute: boolean;
  sightDistance: 'Low' | 'Medium' | 'High';
  effectQuality: 'Low' | 'Normal' | 'High';
}

export interface PatchVersion {
  version: number;
  date: string;
  description: string;
  files: Arquivo[];
}

export interface GameServerConfig {
  serverName: string;
  ip: string;
  port: number;
  worldPort?: number;
  description?: string;
  pingMs?: number;
}

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  nickname?: string;
  rememberPass: boolean;
  autoLogin: boolean;
  characterSlot?: number;
  lastUsed?: string;
}

export interface NewsItem {
  id: string;
  tag?: string;
  category?: string;
  title: string;
  date: string;
  content?: string;
  summary?: string;
  link?: string;
}

export type UpdateServerMode = 'normal' | 'simulate_timeout' | 'simulate_refused';

export interface UpdateServerStatus {
  status: 'idle' | 'checking' | 'connected' | 'timed_out' | 'offline';
  message: string;
  timeoutSeconds: number;
  isGameAllowed: boolean;
}
