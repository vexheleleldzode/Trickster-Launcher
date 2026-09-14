export type LanguageKey =
  | 'splash_check'
  | 'launcher_worker_complete'
  | 'launcher_worker_maintenance'
  | 'launcher_worker_downloading'
  | 'launcher_game_start'
  | 'launcher_options'
  | 'launcher_exit'
  | 'launcher_verify'
  | 'launcher_site_desc'
  | 'launcher_site_click'
  | 'launcher_update_launch_fail'
  | 'launcher_update_download_fail'
  | 'launcher_update_check_fail'
  | 'launcher_filelist_building'
  | 'launcher_setup_fail'
  | 'launcher_copy_fail'
  | 'launcher_update_timeout'
  | 'launcher_server_config'
  | 'launcher_account_login'
  | 'launcher_offline_ready';

export const LANGUAGES: Record<string, Record<LanguageKey, string>> = {
  zh: {
    splash_check: '正在校验文件: ',
    launcher_worker_complete: '补丁更新完成，可启动游戏！',
    launcher_worker_maintenance: '服务器维护中！',
    launcher_worker_downloading: '正在下载更新文件...',
    launcher_game_start: '进入游戏',
    launcher_options: '设置',
    launcher_exit: '退出',
    launcher_verify: '完整校验',
    launcher_site_desc: '您可以访问我们的官方网站',
    launcher_site_click: '点击此处',
    launcher_update_launch_fail: '启动更新程序失败。',
    launcher_update_download_fail: '下载更新文件失败。',
    launcher_update_check_fail: '检查更新失败。',
    launcher_filelist_building: '正在连接更新服务器并生成更新列表...',
    launcher_setup_fail: '无法打开游戏设置！',
    launcher_copy_fail: '启动登录器失败！',
    launcher_update_timeout: '更新服务器连接超时！已自动转为离线模式，不影响进入游戏。',
    launcher_server_config: '配置服务器',
    launcher_account_login: '账号管理 / 自动登录',
    launcher_offline_ready: '更新服离线模式 (就绪，可直接进入游戏)',
  },
  en: {
    splash_check: 'Verifying file: ',
    launcher_worker_complete: 'Update complete!',
    launcher_worker_maintenance: 'In Maintenance!',
    launcher_worker_downloading: 'Downloading',
    launcher_game_start: 'GAME START',
    launcher_options: 'OPTION',
    launcher_exit: 'EXIT',
    launcher_verify: 'CHECK FILES',
    launcher_site_desc: 'You can visit our website by',
    launcher_site_click: 'CLICKING HERE',
    launcher_update_launch_fail: 'Failed to launch the updated launcher.',
    launcher_update_download_fail: 'Failed to download the updated launcher.',
    launcher_update_check_fail: 'Failed to check for launcher updates.',
    launcher_filelist_building: 'Creating update list...',
    launcher_setup_fail: 'Failed to open trickster settings!',
    launcher_copy_fail: 'Failed to open the launcher!',
    launcher_update_timeout: 'Update server connection timed out! Switched to offline mode; game can still be launched.',
    launcher_server_config: 'Server Settings',
    launcher_account_login: 'Accounts & Auto-Login',
    launcher_offline_ready: 'Offline Mode (Ready to play)',
  },
  pt: {
    splash_check: 'Verificando arquivo: ',
    launcher_worker_complete: 'Atualização concluída!',
    launcher_worker_maintenance: 'Em Manutenção!',
    launcher_worker_downloading: 'Baixando',
    launcher_game_start: 'INICIAR JOGO',
    launcher_options: 'OPÇÕES',
    launcher_exit: 'SAIR',
    launcher_verify: 'VERIFICAR',
    launcher_site_desc: 'Você pode visitar o site oficial',
    launcher_site_click: 'CLICANDO AQUI',
    launcher_update_launch_fail: 'Falha ao iniciar o inicializador atualizado.',
    launcher_update_download_fail: 'Falha ao baixar o inicializador atualizado.',
    launcher_update_check_fail: 'Falha ao checar por atualizações.',
    launcher_filelist_building: 'Criando lista de atualização...',
    launcher_setup_fail: 'Falha ao abrir configurações do Trickster!',
    launcher_copy_fail: 'Falha ao executar o inicializador!',
    launcher_update_timeout: 'Tempo limite do servidor de atualização esgotado! Modo offline ativado; jogo liberado.',
    launcher_server_config: 'Configurar Servidor',
    launcher_account_login: 'Contas e Login Automático',
    launcher_offline_ready: 'Modo Offline (Pronto para jogar)',
  }
};

