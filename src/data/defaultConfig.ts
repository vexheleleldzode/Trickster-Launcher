import { LauncherConfig, Arquivo, GameOptionConfig, PatchVersion, NewsItem } from '../types';

export const DEFAULT_CONFIG: LauncherConfig = {
  windowTitle: 'Trickster Launcher',
  subTitle: 'Trickster Launcher',
  launcherCDN: 'cdn.selenoid.com.br',
  baseNewsURL: 'https://google.com.br',
  websiteLink: 'https://google.com',
  optionExecName: 'Setup.exe',
  isCDNUsingSSL: true,
  isDllInjectEnable: false,
  injectDLLName: 'Trickster.dll',
  updateTimeoutSeconds: 3,
};

export const DEFAULT_OPTIONS: GameOptionConfig = {
  resolution: '1024x768',
  windowed: true,
  colorDepth: '32bit',
  bgmVolume: 80,
  sfxVolume: 85,
  bgmMute: false,
  sfxMute: false,
  sightDistance: 'High',
  effectQuality: 'High',
};

export const INITIAL_PATCH_VERSIONS: PatchVersion[] = [
  {
    version: 1,
    date: '2026-08-10',
    description: 'Initial client build release v1.00',
    files: [
      { FileID: 1, FilePath: 'Splash.exe', FileHash: '8b4cf617a22e6b72d24269d0d3cb1e8b', ToUpdate: false, sizeBytes: 1450000 },
      { FileID: 2, FilePath: 'Trickster.exe', FileHash: 'e2fc714c4727ee9395f324cd2e7f331f', ToUpdate: false, sizeBytes: 4200000 },
      { FileID: 3, FilePath: 'Setup.exe', FileHash: 'c7d1e89b27f3aa01264c8d5a7b11e2f9', ToUpdate: false, sizeBytes: 650000 },
      { FileID: 4, FilePath: 'Trickster.dll', FileHash: '439a01f7c8b25e36a44c9b88f1e29a01', ToUpdate: false, sizeBytes: 320000 },
      { FileID: 5, FilePath: 'data/character.gpk', FileHash: '9a1bc23d4e5f60718293a4b5c6d7e8f0', ToUpdate: false, sizeBytes: 25400000 },
      { FileID: 6, FilePath: 'data/maps/caballa.gpk', FileHash: '5e8b7c2a1d3f4e6b9c8a0d2f4b6e8a1c', ToUpdate: false, sizeBytes: 18200000 },
      { FileID: 7, FilePath: 'data/sound/bgm01.mp3', FileHash: '3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a', ToUpdate: false, sizeBytes: 3100000 },
      { FileID: 8, FilePath: 'data/item/equipment.dat', FileHash: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f', ToUpdate: false, sizeBytes: 890000 },
      { FileID: 9, FilePath: 'data/interface/skin.dat', FileHash: '1a2b3c4d5e6f708192a3b4c5d6e7f8a9', ToUpdate: false, sizeBytes: 1420000 },
    ]
  },
  {
    version: 2,
    date: '2026-09-01',
    description: 'Episode 6 Island of Caballa Expansion Patch',
    files: [
      { FileID: 10, FilePath: 'data/maps/caballa_relics.gpk', FileHash: '2b4c6e8a0f1d3e5b7c9a1d2f3e4a5b6c', ToUpdate: false, sizeBytes: 9400000 },
      { FileID: 11, FilePath: 'data/item/equipment.dat', FileHash: '9f8e7d6c5b4a3b2a1c0d9e8f7a6b5c4d', ToUpdate: false, sizeBytes: 940000 },
      { FileID: 12, FilePath: 'data/quest/quest_db.xml', FileHash: '8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d', ToUpdate: false, sizeBytes: 420000 },
    ]
  }
];

export const DEFAULT_NEWS_ITEMS: NewsItem[] = [
  {
    id: 'news-1',
    tag: 'Event',
    title: 'Drilling Expedition: Caballa Relics Gold Rush',
    date: '2026-09-12',
    content: 'Grab your drills and venture into the depths of Caballa Island! Special mining nodes have spawned with double drop rates for rare artifacts and compound stones.',
  },
  {
    id: 'news-2',
    tag: 'Notice',
    title: 'Server Maintenance & Network Optimization',
    date: '2026-09-10',
    content: 'Routine server patch applied to reduce latency, stabilize party dungeon instances, and enhance anti-cheat validation routines.',
  },
  {
    id: 'news-3',
    tag: 'Update',
    title: 'New Trickster Guardian Skills & Card Battle Balance',
    date: '2026-09-05',
    content: 'Card Battle system v2.4 adjustments: water element cards reworked, buffalo charge cooldown refined, and pet evolution cap raised to tier 5.',
  },
  {
    id: 'news-4',
    tag: 'Notice',
    title: 'Welcome to Trickster Revolution Server!',
    date: '2026-08-20',
    content: 'Experience classic Trickster Online with modern quality of life, fast CDN auto-patching, high-res widescreen options, and dedicated community events.',
  }
];

export const DEFAULT_GAME_SERVER: {
  serverName: string;
  ip: string;
  port: number;
  worldPort: number;
  description: string;
  pingMs: number;
} = {
  serverName: 'Caballa Island (Main / 主服务器)',
  ip: '127.0.0.1',
  port: 21000,
  worldPort: 21001,
  description: 'Trickster Online Login & World Server',
  pingMs: 24,
};

export const DEFAULT_ACCOUNTS = [
  {
    id: 'acc-1',
    username: 'trickster_player',
    password: 'password123',
    nickname: '钻地达人 (Bunny)',
    rememberPass: true,
    autoLogin: true,
    characterSlot: 1,
    lastUsed: 'Today 14:30',
  },
  {
    id: 'acc-2',
    username: 'test_admin',
    password: 'adminpassword',
    nickname: 'GM_Caballa',
    rememberPass: true,
    autoLogin: false,
    characterSlot: 2,
    lastUsed: 'Yesterday',
  },
];

