#include "Language.h"

namespace lang
{
    Dictionary Languages = {
        {"launcher_filelist_building", "Building file list..."},
        {"splash_check", "Checking: "},
        {"launcher_worker_complete", "Ready to start game"},
        {"launcher_worker_downloading", "Downloading"},
        {"launcher_worker_maintenance", "Server is currently under maintenance"},
        {"btn_game_start", "Start Game"},
        {"btn_check_files", "Check Files"},
        {"btn_options", "Options"},
        {"btn_exit", "Exit"}
    };

    std::string GetString(const std::string& key) noexcept
    {
        auto it = Languages.find(key);
        if (it != Languages.end())
            return it->second;
        return key;
    }
}
