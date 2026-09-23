#pragma once
#include <string>

namespace config
{
    extern std::wstring WindowTitle;
    extern std::string SubTitle;
    extern std::string LauncherCDN;
    extern std::wstring BaseNewsURL;
    extern std::string WebsiteLink;
    extern std::string OptionExecName;
    extern bool IsCDNUsingSSL;
    extern int UpdateTimeoutSeconds;
    extern bool IsDllInjectEnable;
    extern std::string InjectDLLName;
    extern std::string ServerIP;
    extern int ServerPort;
    extern int WorldPort;
}
