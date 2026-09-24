#pragma execution_character_set("utf-8")
#include "Gui.h"
#include "Helper.h"
#include "Config.h"
#include "Language.h"
#include "imgui.h"
#include "backends/imgui_impl_win32.h"
#include "backends/imgui_impl_dx9.h"
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#include <shellapi.h>
#include <filesystem>
#include <vector>
#include <string>

extern IMGUI_IMPL_API LRESULT ImGui_ImplWin32_WndProcHandler(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);

namespace gui
{
    HWND window = nullptr;
    bool isRunning = true;
    LPDIRECT3D9 d3d = nullptr;
    LPDIRECT3DDEVICE9 d3ddev = nullptr;
    D3DPRESENT_PARAMETERS d3dpp = {};

    std::mutex g_FileStringMutex;
    std::string g_FileString = "Ready to start game";
    std::mutex g_SpeedStringMutex;
    std::string g_SpeedString = "";
    std::atomic<float> g_iFileProgress{ 0.0f };
    std::atomic<float> g_iTotalProgress{ 0.0f };

    Helper g_Helper;

    // Textures for Authentic UI
    LPDIRECT3DTEXTURE9 g_pTexBg = nullptr;
    LPDIRECT3DTEXTURE9 g_pTexLogo = nullptr;

    // Action button textures
    LPDIRECT3DTEXTURE9 g_pTexGameNormal = nullptr;
    LPDIRECT3DTEXTURE9 g_pTexGameHover = nullptr;
    LPDIRECT3DTEXTURE9 g_pTexGamePressed = nullptr;

    LPDIRECT3DTEXTURE9 g_pTexCheckNormal = nullptr;
    LPDIRECT3DTEXTURE9 g_pTexCheckHover = nullptr;
    LPDIRECT3DTEXTURE9 g_pTexCheckPressed = nullptr;

    LPDIRECT3DTEXTURE9 g_pTexOptionNormal = nullptr;
    LPDIRECT3DTEXTURE9 g_pTexOptionHover = nullptr;
    LPDIRECT3DTEXTURE9 g_pTexOptionPressed = nullptr;

    LPDIRECT3DTEXTURE9 g_pTexExitNormal = nullptr;
    LPDIRECT3DTEXTURE9 g_pTexExitHover = nullptr;
    LPDIRECT3DTEXTURE9 g_pTexExitPressed = nullptr;

    // Active tab in central area
    // 0: 公告 (Notices), 1: 活动 (Events), 2: 服务器设置 (Server Config), 3: 账号与自动登录 (Accounts)
    int g_iNewsTab = 0;

    // -------------------------------------------------------------
    // Config and Account Data Management
    // -------------------------------------------------------------
    struct AccountRecord
    {
        std::string username;
        std::string password;
        std::string note;
    };

    static char s_serverIPBuf[64] = "127.0.0.1";
    static int  s_serverPort = 21000;
    static int  s_worldPort = 21001;
    static char s_cdnBuf[128] = "cdn.selenoid.com.br";
    static bool s_isCDNUsingSSL = true;

    static char s_accountUserBuf[64] = "";
    static char s_accountPassBuf[64] = "";
    static bool s_rememberPass = true;
    static bool s_autoLogin = false;
    static bool s_showPassword = false;

    static std::vector<AccountRecord> s_savedAccounts;
    static std::string s_serverStatusMsg = "";
    static std::string s_accountStatusMsg = "";

    static std::string GetConfigIniPath()
    {
        wchar_t exePathW[MAX_PATH];
        GetModuleFileNameW(NULL, exePathW, MAX_PATH);
        std::filesystem::path p(exePathW);
        return (p.parent_path() / "LauncherConfig.ini").string();
    }

    static void LoadLauncherConfig()
    {
        std::string ini = GetConfigIniPath();
        if (!std::filesystem::exists(ini))
        {
            snprintf(s_serverIPBuf, sizeof(s_serverIPBuf), "%s", config::ServerIP.c_str());
            s_serverPort = config::ServerPort;
            s_worldPort = config::WorldPort;
            snprintf(s_cdnBuf, sizeof(s_cdnBuf), "%s", config::LauncherCDN.c_str());
            s_isCDNUsingSSL = config::IsCDNUsingSSL;
            return;
        }

        GetPrivateProfileStringA("Server", "IP", config::ServerIP.c_str(), s_serverIPBuf, sizeof(s_serverIPBuf), ini.c_str());
        config::ServerIP = s_serverIPBuf;

        s_serverPort = GetPrivateProfileIntA("Server", "Port", config::ServerPort, ini.c_str());
        config::ServerPort = s_serverPort;

        s_worldPort = GetPrivateProfileIntA("Server", "WorldPort", config::WorldPort, ini.c_str());
        config::WorldPort = s_worldPort;

        GetPrivateProfileStringA("Server", "CDN", config::LauncherCDN.c_str(), s_cdnBuf, sizeof(s_cdnBuf), ini.c_str());
        config::LauncherCDN = s_cdnBuf;

        s_isCDNUsingSSL = (GetPrivateProfileIntA("Server", "SSL", config::IsCDNUsingSSL ? 1 : 0, ini.c_str()) != 0);
        config::IsCDNUsingSSL = s_isCDNUsingSSL;

        // Current account
        GetPrivateProfileStringA("Account", "Username", "", s_accountUserBuf, sizeof(s_accountUserBuf), ini.c_str());
        GetPrivateProfileStringA("Account", "Password", "", s_accountPassBuf, sizeof(s_accountPassBuf), ini.c_str());
        s_rememberPass = (GetPrivateProfileIntA("Account", "Remember", 1, ini.c_str()) != 0);
        s_autoLogin = (GetPrivateProfileIntA("Account", "AutoLogin", 0, ini.c_str()) != 0);

        // Account list
        int count = GetPrivateProfileIntA("Accounts", "Count", 0, ini.c_str());
        s_savedAccounts.clear();
        for (int i = 0; i < count; i++)
        {
            char kU[32], kP[32], kN[32];
            snprintf(kU, sizeof(kU), "User_%d", i);
            snprintf(kP, sizeof(kP), "Pass_%d", i);
            snprintf(kN, sizeof(kN), "Note_%d", i);

            char u[64] = { 0 }, p[64] = { 0 }, n[64] = { 0 };
            GetPrivateProfileStringA("Accounts", kU, "", u, sizeof(u), ini.c_str());
            GetPrivateProfileStringA("Accounts", kP, "", p, sizeof(p), ini.c_str());
            GetPrivateProfileStringA("Accounts", kN, "", n, sizeof(n), ini.c_str());

            if (strlen(u) > 0)
            {
                s_savedAccounts.push_back({ u, p, strlen(n) > 0 ? n : "已保存" });
            }
        }

        if (s_savedAccounts.empty() && strlen(s_accountUserBuf) > 0)
        {
            s_savedAccounts.push_back({ s_accountUserBuf, s_accountPassBuf, "默认账号" });
        }
    }

    static void SaveLauncherConfig()
    {
        std::string ini = GetConfigIniPath();

        // Save server
        WritePrivateProfileStringA("Server", "IP", s_serverIPBuf, ini.c_str());
        config::ServerIP = s_serverIPBuf;

        char pBuf[16], wpBuf[16];
        snprintf(pBuf, sizeof(pBuf), "%d", s_serverPort);
        snprintf(wpBuf, sizeof(wpBuf), "%d", s_worldPort);
        WritePrivateProfileStringA("Server", "Port", pBuf, ini.c_str());
        config::ServerPort = s_serverPort;
        WritePrivateProfileStringA("Server", "WorldPort", wpBuf, ini.c_str());
        config::WorldPort = s_worldPort;

        WritePrivateProfileStringA("Server", "CDN", s_cdnBuf, ini.c_str());
        config::LauncherCDN = s_cdnBuf;

        WritePrivateProfileStringA("Server", "SSL", s_isCDNUsingSSL ? "1" : "0", ini.c_str());
        config::IsCDNUsingSSL = s_isCDNUsingSSL;

        // Save active account
        WritePrivateProfileStringA("Account", "Username", s_accountUserBuf, ini.c_str());
        WritePrivateProfileStringA("Account", "Password", s_rememberPass ? s_accountPassBuf : "", ini.c_str());
        WritePrivateProfileStringA("Account", "Remember", s_rememberPass ? "1" : "0", ini.c_str());
        WritePrivateProfileStringA("Account", "AutoLogin", s_autoLogin ? "1" : "0", ini.c_str());

        // Save accounts list
        char cBuf[16];
        snprintf(cBuf, sizeof(cBuf), "%d", (int)s_savedAccounts.size());
        WritePrivateProfileStringA("Accounts", "Count", cBuf, ini.c_str());

        for (size_t i = 0; i < s_savedAccounts.size(); i++)
        {
            char kU[32], kP[32], kN[32];
            snprintf(kU, sizeof(kU), "User_%d", (int)i);
            snprintf(kP, sizeof(kP), "Pass_%d", (int)i);
            snprintf(kN, sizeof(kN), "Note_%d", (int)i);

            WritePrivateProfileStringA("Accounts", kU, s_savedAccounts[i].username.c_str(), ini.c_str());
            WritePrivateProfileStringA("Accounts", kP, s_savedAccounts[i].password.c_str(), ini.c_str());
            WritePrivateProfileStringA("Accounts", kN, s_savedAccounts[i].note.c_str(), ini.c_str());
        }
    }

    LRESULT WINAPI WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
    {
        if (ImGui_ImplWin32_WndProcHandler(hWnd, msg, wParam, lParam))
            return true;

        switch (msg)
        {
        case WM_SIZE:
            if (d3ddev != nullptr && wParam != SIZE_MINIMIZED)
            {
                d3dpp.BackBufferWidth = LOWORD(lParam);
                d3dpp.BackBufferHeight = HIWORD(lParam);
                ImGui_ImplDX9_InvalidateDeviceObjects();
                HRESULT hr = d3ddev->Reset(&d3dpp);
                if (hr == D3DERR_INVALIDCALL)
                    IM_ASSERT(0);
                ImGui_ImplDX9_CreateDeviceObjects();
            }
            return 0;
        case WM_SYSCOMMAND:
            if ((wParam & 0xfff0) == SC_KEYMENU)
                return 0;
            break;
        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
        case WM_NCHITTEST:
        {
            POINT pt = { LOWORD(lParam), HIWORD(lParam) };
            ScreenToClient(hWnd, &pt);
            if (pt.y >= 0 && pt.y <= 26 && pt.x < 480)
                return HTCAPTION;
            return HTCLIENT;
        }
        }
        return DefWindowProcW(hWnd, msg, wParam, lParam);
    }

    bool copyAndRunSelf()
    {
        return false;
    }

    void CreateHWindow(const wchar_t* title)
    {
        WNDCLASSEXW wc = {
            sizeof(WNDCLASSEXW),
            CS_CLASSDC,
            WndProc,
            0L,
            0L,
            GetModuleHandle(nullptr),
            nullptr,
            nullptr,
            nullptr,
            nullptr,
            L"TricksterLauncherClass",
            nullptr
        };
        RegisterClassExW(&wc);

        const int width = 538;
        const int height = 564;
        const int screenX = (GetSystemMetrics(SM_CXSCREEN) - width) / 2;
        const int screenY = (GetSystemMetrics(SM_CYSCREEN) - height) / 2;

        window = CreateWindowExW(
            WS_EX_APPWINDOW,
            wc.lpszClassName,
            title,
            WS_POPUP | WS_VISIBLE,
            screenX, screenY, width, height,
            nullptr, nullptr, wc.hInstance, nullptr
        );
    }

    void DestroyHWindow()
    {
        if (window)
        {
            DestroyWindow(window);
            UnregisterClassW(L"TricksterLauncherClass", GetModuleHandle(nullptr));
            window = nullptr;
        }
    }

    bool CreateDevice()
    {
        d3d = Direct3DCreate9(D3D_SDK_VERSION);
        if (!d3d) return false;

        ZeroMemory(&d3dpp, sizeof(d3dpp));
        d3dpp.Windowed = TRUE;
        d3dpp.SwapEffect = D3DSWAPEFFECT_DISCARD;
        d3dpp.BackBufferFormat = D3DFMT_UNKNOWN;
        d3dpp.EnableAutoDepthStencil = TRUE;
        d3dpp.AutoDepthStencilFormat = D3DFMT_D16;
        d3dpp.PresentationInterval = D3DPRESENT_INTERVAL_ONE;

        if (FAILED(d3d->CreateDevice(
            D3DADAPTER_DEFAULT,
            D3DDEVTYPE_HAL,
            window,
            D3DCREATE_HARDWARE_VERTEXPROCESSING,
            &d3dpp,
            &d3ddev)))
        {
            if (FAILED(d3d->CreateDevice(
                D3DADAPTER_DEFAULT,
                D3DDEVTYPE_HAL,
                window,
                D3DCREATE_SOFTWARE_VERTEXPROCESSING,
                &d3dpp,
                &d3ddev)))
            {
                return false;
            }
        }
        return true;
    }

    void DestroyDevice()
    {
        auto safeRelease = [](LPDIRECT3DTEXTURE9& tex) {
            if (tex) { tex->Release(); tex = nullptr; }
        };
        safeRelease(g_pTexBg);
        safeRelease(g_pTexLogo);
        safeRelease(g_pTexGameNormal);
        safeRelease(g_pTexGameHover);
        safeRelease(g_pTexGamePressed);
        safeRelease(g_pTexCheckNormal);
        safeRelease(g_pTexCheckHover);
        safeRelease(g_pTexCheckPressed);
        safeRelease(g_pTexOptionNormal);
        safeRelease(g_pTexOptionHover);
        safeRelease(g_pTexOptionPressed);
        safeRelease(g_pTexExitNormal);
        safeRelease(g_pTexExitHover);
        safeRelease(g_pTexExitPressed);

        if (d3ddev) { d3ddev->Release(); d3ddev = nullptr; }
        if (d3d) { d3d->Release(); d3d = nullptr; }
    }

    void CreateImGui()
    {
        IMGUI_CHECKVERSION();
        ImGui::CreateContext();
        ImGuiIO& io = ImGui::GetIO();
        io.IniFilename = nullptr; // Disable imgui.ini

        // -------------------------------------------------------------
        // Load High-Quality Chinese Font from Windows Fonts Directory
        // -------------------------------------------------------------
        char winDir[MAX_PATH] = { 0 };
        GetWindowsDirectoryA(winDir, MAX_PATH);
        std::string fontsDir = (strlen(winDir) > 0) ? (std::string(winDir) + "\\Fonts\\") : "C:\\Windows\\Fonts\\";

        std::vector<std::string> fontCandidates = {
            fontsDir + "msyh.ttc",   // 微软雅黑 (Microsoft YaHei)
            fontsDir + "msyhl.ttc",  // 微软雅黑 Light
            fontsDir + "simsun.ttc", // 宋体 (SimSun)
            fontsDir + "simhei.ttf", // 黑体 (SimHei)
            fontsDir + "segoeui.ttf",
            "C:\\Windows\\Fonts\\msyh.ttc",
            "C:\\Windows\\Fonts\\simsun.ttc",
            "resources\\font.ttf"
        };

        ImFontConfig fontConfig;
        fontConfig.FontDataOwnedByAtlas = false;
        fontConfig.PixelSnapH = true;
        fontConfig.OversampleH = 1;
        fontConfig.OversampleV = 1;

        bool fontLoaded = false;
        for (const auto& fpath : fontCandidates)
        {
            if (std::filesystem::exists(fpath))
            {
                io.Fonts->AddFontFromFileTTF(fpath.c_str(), 14.0f, &fontConfig, io.Fonts->GetGlyphRangesChineseSimplifiedCommon());
                fontLoaded = true;
                break;
            }
        }
        if (!fontLoaded)
        {
            io.Fonts->AddFontDefault();
        }

        ImGui::StyleColorsDark();
        ImGuiStyle& style = ImGui::GetStyle();
        style.WindowRounding = 4.0f;
        style.FrameRounding = 3.0f;
        style.ScrollbarRounding = 3.0f;
        style.WindowBorderSize = 0.0f;
        style.WindowPadding = ImVec2(8, 8);
        style.ItemSpacing = ImVec2(6, 6);

        // Dark glass aesthetic colors
        style.Colors[ImGuiCol_FrameBg] = ImVec4(0.12f, 0.15f, 0.22f, 0.85f);
        style.Colors[ImGuiCol_FrameBgHovered] = ImVec4(0.20f, 0.26f, 0.38f, 0.95f);
        style.Colors[ImGuiCol_FrameBgActive] = ImVec4(0.25f, 0.32f, 0.46f, 1.0f);
        style.Colors[ImGuiCol_Button] = ImVec4(0.18f, 0.42f, 0.68f, 0.90f);
        style.Colors[ImGuiCol_ButtonHovered] = ImVec4(0.26f, 0.54f, 0.85f, 1.0f);
        style.Colors[ImGuiCol_ButtonActive] = ImVec4(0.14f, 0.34f, 0.58f, 1.0f);
        style.Colors[ImGuiCol_CheckMark] = ImVec4(0.35f, 0.85f, 0.95f, 1.0f);

        ImGui_ImplWin32_Init(window);
        ImGui_ImplDX9_Init(d3ddev);
    }

    void DestroyImGui()
    {
        ImGui_ImplDX9_Shutdown();
        ImGui_ImplWin32_Shutdown();
        ImGui::DestroyContext();
    }

    static std::string WideToUtf8(const std::wstring& wstr)
    {
        if (wstr.empty()) return "";
        int size = WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), nullptr, 0, nullptr, nullptr);
        std::string str(size, 0);
        WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), &str[0], size, nullptr, nullptr);
        return str;
    }

    static std::string FindResourcePath(const std::string& relPath)
    {
        if (std::filesystem::exists(relPath))
            return relPath;

        wchar_t exePathW[MAX_PATH];
        GetModuleFileNameW(NULL, exePathW, MAX_PATH);
        std::filesystem::path exeDir = std::filesystem::path(exePathW).parent_path();

        std::vector<std::filesystem::path> candidates = {
            exeDir / relPath,
            exeDir / "resources" / relPath,
            exeDir / "Resources" / relPath,
            std::filesystem::path("resources") / relPath,
            std::filesystem::path("Resources") / relPath,
            std::filesystem::path("public") / "resources" / relPath,
            std::filesystem::path("..") / "Resources" / relPath,
            std::filesystem::path("..") / "public" / "resources" / relPath
        };

        for (const auto& p : candidates)
        {
            if (std::filesystem::exists(p))
                return p.string();
        }

        return relPath;
    }

    static LPDIRECT3DTEXTURE9 LoadTexture(const std::string& path)
    {
        std::string resolved = FindResourcePath(path);
        int width = 0, height = 0, channels = 0;
        unsigned char* data = stbi_load(resolved.c_str(), &width, &height, &channels, 4);
        if (!data || !d3ddev)
        {
            return nullptr;
        }

        LPDIRECT3DTEXTURE9 texture = nullptr;
        HRESULT hr = d3ddev->CreateTexture(
            width, height, 1, 0,
            D3DFMT_A8R8G8B8, D3DPOOL_MANAGED,
            &texture, nullptr
        );

        if (FAILED(hr))
        {
            stbi_image_free(data);
            return nullptr;
        }

        D3DLOCKED_RECT rect;
        if (SUCCEEDED(texture->LockRect(0, &rect, nullptr, 0)))
        {
            unsigned char* dest = (unsigned char*)rect.pBits;
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    int srcIdx = (y * width + x) * 4;
                    int dstIdx = y * rect.Pitch + x * 4;
                    dest[dstIdx + 0] = data[srcIdx + 2]; // Blue
                    dest[dstIdx + 1] = data[srcIdx + 1]; // Green
                    dest[dstIdx + 2] = data[srcIdx + 0]; // Red
                    dest[dstIdx + 3] = data[srcIdx + 3]; // Alpha
                }
            }
            texture->UnlockRect(0);
        }

        stbi_image_free(data);
        return texture;
    }

    void LoadResources()
    {
        // 1. Load user configuration from disk
        LoadLauncherConfig();

        // 2. Load background and logo
        g_pTexBg = LoadTexture("bg.png");
        g_pTexLogo = LoadTexture("logo.png");

        // 3. Load Action Button Textures
        g_pTexGameNormal = LoadTexture("normal/game.png");
        g_pTexGameHover = LoadTexture("hover/game.png");
        g_pTexGamePressed = LoadTexture("pressed/game.png");

        g_pTexCheckNormal = LoadTexture("normal/check.png");
        g_pTexCheckHover = LoadTexture("hover/check.png");
        g_pTexCheckPressed = LoadTexture("pressed/check.png");

        g_pTexOptionNormal = LoadTexture("normal/option.png");
        g_pTexOptionHover = LoadTexture("hover/option.png");
        g_pTexOptionPressed = LoadTexture("pressed/option.png");

        g_pTexExitNormal = LoadTexture("normal/exit.png");
        g_pTexExitHover = LoadTexture("hover/exit.png");
        g_pTexExitPressed = LoadTexture("pressed/exit.png");

        // 4. Start background file check updater
        g_Helper.FileCheckUpdate();
    }

    void InitWebView(HWND /*hwnd*/)
    {
    }

    void BeginRender()
    {
        ImGui_ImplDX9_NewFrame();
        ImGui_ImplWin32_NewFrame();
        ImGui::NewFrame();
    }

    static bool DrawCustomImageButton(
        const char* str_id,
        ImVec2 pos,
        ImVec2 size,
        LPDIRECT3DTEXTURE9 normalTex,
        LPDIRECT3DTEXTURE9 hoverTex,
        LPDIRECT3DTEXTURE9 pressedTex,
        bool disabled = false)
    {
        ImGui::SetCursorScreenPos(pos);
        bool clicked = false;
        if (!disabled)
        {
            clicked = ImGui::InvisibleButton(str_id, size);
        }
        else
        {
            ImGui::Dummy(size);
        }

        bool isHovered = !disabled && ImGui::IsItemHovered();
        bool isActive = !disabled && ImGui::IsItemActive();

        LPDIRECT3DTEXTURE9 activeTex = normalTex;
        if (disabled)
        {
            activeTex = normalTex;
        }
        else if (isActive && pressedTex)
        {
            activeTex = pressedTex;
        }
        else if (isHovered && hoverTex)
        {
            activeTex = hoverTex;
        }

        ImDrawList* drawList = ImGui::GetWindowDrawList();
        ImU32 tint = disabled ? IM_COL32(140, 140, 140, 160) : IM_COL32(255, 255, 255, 255);

        if (activeTex)
        {
            drawList->AddImage(
                (ImTextureID)activeTex,
                pos,
                ImVec2(pos.x + size.x, pos.y + size.y),
                ImVec2(0, 0),
                ImVec2(1, 1),
                tint
            );
        }
        else
        {
            ImU32 bgCol = disabled ? IM_COL32(50, 50, 50, 200) : (isActive ? IM_COL32(180, 130, 20, 255) : (isHovered ? IM_COL32(220, 170, 30, 255) : IM_COL32(190, 140, 25, 255)));
            drawList->AddRectFilled(pos, ImVec2(pos.x + size.x, pos.y + size.y), bgCol, 3.0f);
            drawList->AddText(ImVec2(pos.x + 8, pos.y + (size.y - 14) * 0.5f), IM_COL32(255, 255, 255, 255), str_id);
        }

        return clicked;
    }

    void Render()
    {
        ImGui::SetNextWindowPos(ImVec2(0, 0));
        ImGui::SetNextWindowSize(ImVec2(538, 564));
        ImGuiWindowFlags flags = ImGuiWindowFlags_NoTitleBar | ImGuiWindowFlags_NoResize |
                                 ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoCollapse |
                                 ImGuiWindowFlags_NoBringToFrontOnFocus | ImGuiWindowFlags_NoBackground;

        ImGui::Begin("TricksterMainLauncher", nullptr, nullptr, flags);
        ImDrawList* drawList = ImGui::GetWindowDrawList();

        // 1. Draw Background Image (538x564)
        if (g_pTexBg)
        {
            drawList->AddImage((ImTextureID)g_pTexBg, ImVec2(0, 0), ImVec2(538, 564));
        }
        else
        {
            drawList->AddRectFilledMultiColor(
                ImVec2(0, 0), ImVec2(538, 564),
                IM_COL32(18, 22, 34, 255), IM_COL32(18, 22, 34, 255),
                IM_COL32(10, 12, 18, 255), IM_COL32(10, 12, 18, 255)
            );
        }

        // 2. Custom Title Bar Area (x: 0..538, y: 0..24)
        std::string winTitle = WideToUtf8(config::WindowTitle);
        drawList->AddText(ImVec2(12, 5), IM_COL32(220, 220, 220, 255), winTitle.c_str());
        drawList->AddText(ImVec2(340, 5), IM_COL32(180, 180, 190, 200), config::SubTitle.c_str());

        // Minimize & Close buttons
        ImGui::SetCursorScreenPos(ImVec2(494, 3));
        if (ImGui::InvisibleButton("##title_min", ImVec2(18, 18)))
        {
            ShowWindow(window, SW_MINIMIZE);
        }
        bool minHover = ImGui::IsItemHovered();
        drawList->AddRectFilled(ImVec2(494, 3), ImVec2(512, 21), minHover ? IM_COL32(80, 80, 90, 220) : IM_COL32(40, 40, 50, 160), 2.0f);
        drawList->AddLine(ImVec2(498, 13), ImVec2(508, 13), IM_COL32(230, 230, 230, 255), 1.5f);

        ImGui::SetCursorScreenPos(ImVec2(515, 3));
        if (ImGui::InvisibleButton("##title_close", ImVec2(18, 18)))
        {
            isRunning = false;
        }
        bool closeHover = ImGui::IsItemHovered();
        drawList->AddRectFilled(ImVec2(515, 3), ImVec2(533, 21), closeHover ? IM_COL32(200, 40, 40, 220) : IM_COL32(40, 40, 50, 160), 2.0f);
        drawList->AddLine(ImVec2(520, 8), ImVec2(528, 16), IM_COL32(230, 230, 230, 255), 1.5f);
        drawList->AddLine(ImVec2(528, 8), ImVec2(520, 16), IM_COL32(230, 230, 230, 255), 1.5f);

        // 3. Central Content / News / Settings Area (x: 19, y: 32, w: 503, h: 343)
        const ImVec2 newsPos(19.0f, 32.0f);
        const ImVec2 newsSize(503.0f, 343.0f);
        drawList->AddRectFilled(newsPos, ImVec2(newsPos.x + newsSize.x, newsPos.y + newsSize.y), IM_COL32(12, 14, 20, 235), 4.0f);
        drawList->AddRect(newsPos, ImVec2(newsPos.x + newsSize.x, newsPos.y + newsSize.y), IM_COL32(55, 60, 75, 200), 4.0f);

        // Header Tab Bar
        drawList->AddRectFilled(newsPos, ImVec2(newsPos.x + newsSize.x, newsPos.y + 28), IM_COL32(20, 24, 35, 255), 4.0f, ImDrawFlags_RoundCornersTop);
        drawList->AddLine(ImVec2(newsPos.x, newsPos.y + 28), ImVec2(newsPos.x + newsSize.x, newsPos.y + 28), IM_COL32(45, 50, 65, 255));

        const char* tabs[] = {
            "公告 (Notices)",
            "活动 (Events)",
            "⚙ 服务器设置 (Server)",
            "👤 账号管理 (Accounts)"
        };

        float tabX = newsPos.x + 8.0f;
        for (int i = 0; i < 4; i++)
        {
            ImVec2 tSize = ImGui::CalcTextSize(tabs[i]);
            ImVec2 bPos(tabX, newsPos.y + 4.0f);
            ImGui::SetCursorScreenPos(bPos);
            char tabId[32];
            snprintf(tabId, sizeof(tabId), "##tab_nav_%d", i);
            if (ImGui::InvisibleButton(tabId, ImVec2(tSize.x + 10.0f, 20.0f)))
            {
                g_iNewsTab = i;
            }
            bool tHover = ImGui::IsItemHovered();
            bool tActive = (g_iNewsTab == i);

            if (tActive)
            {
                drawList->AddLine(ImVec2(bPos.x + 2, bPos.y + 22), ImVec2(bPos.x + tSize.x + 8, bPos.y + 22), IM_COL32(245, 185, 45, 255), 2.5f);
                drawList->AddText(ImVec2(bPos.x + 4, bPos.y + 3), IM_COL32(245, 195, 60, 255), tabs[i]);
            }
            else
            {
                drawList->AddText(ImVec2(bPos.x + 4, bPos.y + 3), tHover ? IM_COL32(220, 220, 230, 255) : IM_COL32(140, 145, 160, 255), tabs[i]);
            }
            tabX += tSize.x + 14.0f;
        }

        // News Content Body Area
        ImVec2 contentPos(newsPos.x + 12.0f, newsPos.y + 34.0f);

        // Maintenance Alert Banner
        if (g_Helper.isMaintenance)
        {
            drawList->AddRectFilled(contentPos, ImVec2(contentPos.x + 479.0f, contentPos.y + 36.0f), IM_COL32(65, 35, 15, 240), 3.0f);
            drawList->AddRect(contentPos, ImVec2(contentPos.x + 479.0f, contentPos.y + 36.0f), IM_COL32(210, 130, 40, 255), 3.0f);
            drawList->AddText(ImVec2(contentPos.x + 8.0f, contentPos.y + 4.0f), IM_COL32(255, 200, 80, 255), "[注意] 服务器维护中 (Server Under Maintenance)");
            drawList->AddText(ImVec2(contentPos.x + 8.0f, contentPos.y + 19.0f), IM_COL32(210, 210, 210, 240), "游戏服务器正在例行维护，请关注官网与交流群最新公告！");
            contentPos.y += 42.0f;
        }

        // -------------------------------------------------------------
        // TAB 0: 公告 (Notices)
        // -------------------------------------------------------------
        if (g_iNewsTab == 0)
        {
            drawList->AddText(ImVec2(contentPos.x, contentPos.y), IM_COL32(245, 190, 50, 255), "欢迎来到 Trickster Online 经典怀旧服！");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 22), IM_COL32(195, 200, 210, 255), "• 游戏登录器全面升级：内置多服务器配置与账号密码管理。");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 42), IM_COL32(195, 200, 210, 255), "• 点击上方【⚙ 服务器设置】可随时修改游戏服务器IP与端口。");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 62), IM_COL32(195, 200, 210, 255), "• 点击上方【👤 账号管理】可保存多账号密码，一键免密启动。");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 82), IM_COL32(195, 200, 210, 255), "• 卡巴拉岛冒险已经开启，请遵守公平游戏守则，祝游戏愉快！");
        }
        // -------------------------------------------------------------
        // TAB 1: 活动 (Events)
        // -------------------------------------------------------------
        else if (g_iNewsTab == 1)
        {
            drawList->AddText(ImVec2(contentPos.x, contentPos.y), IM_COL32(245, 190, 50, 255), "★ 本周精彩线上活动预告");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 22), IM_COL32(195, 200, 210, 255), "• 全服双倍经验 & 钻地掉率翻倍狂欢周末进行中！");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 42), IM_COL32(195, 200, 210, 255), "• 卡巴拉岛新春庆典集字兑换稀有宠物活动即将开启。");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 62), IM_COL32(195, 200, 210, 255), "• 新人入驻礼包：前往官网输入口令即可领取专属钻头与时装。");
        }
        // -------------------------------------------------------------
        // TAB 2: 服务器设置 (Server Config)
        // -------------------------------------------------------------
        else if (g_iNewsTab == 2)
        {
            ImGui::SetCursorScreenPos(ImVec2(newsPos.x + 14, newsPos.y + 34));
            ImGui::BeginChild("ServerSettingsChild", ImVec2(475, 275), false);

            ImGui::TextColored(ImVec4(0.96f, 0.76f, 0.22f, 1.0f), "★ 游戏服务器连接配置 (Game Server Settings)");
            ImGui::Separator();
            ImGui::Spacing();

            ImGui::PushItemWidth(260.0f);
            ImGui::InputText("服务器 IP / 域名 (Server IP)", s_serverIPBuf, sizeof(s_serverIPBuf));
            ImGui::InputInt("登录端口 (Login Port)", &s_serverPort);
            ImGui::InputInt("世界端口 (World Port)", &s_worldPort);
            ImGui::InputText("CDN 补丁网址 (CDN Host)", s_cdnBuf, sizeof(s_cdnBuf));
            ImGui::PopItemWidth();

            ImGui::Checkbox("使用 HTTPS / SSL 安全连接", &s_isCDNUsingSSL);
            ImGui::Spacing();

            if (ImGui::Button(" 💾 保存并应用设置 ", ImVec2(140, 26)))
            {
                SaveLauncherConfig();
                s_serverStatusMsg = "✔ 服务器配置已保存到本地并立即生效！";
            }
            ImGui::SameLine();
            if (ImGui::Button(" 🔄 恢复默认设置 ", ImVec2(120, 26)))
            {
                snprintf(s_serverIPBuf, sizeof(s_serverIPBuf), "127.0.0.1");
                s_serverPort = 21000;
                s_worldPort = 21001;
                snprintf(s_cdnBuf, sizeof(s_cdnBuf), "cdn.selenoid.com.br");
                s_isCDNUsingSSL = true;
                SaveLauncherConfig();
                s_serverStatusMsg = "✔ 已重置为默认配置 (127.0.0.1:21000)！";
            }

            if (!s_serverStatusMsg.empty())
            {
                ImGui::Spacing();
                ImGui::TextColored(ImVec4(0.35f, 0.95f, 0.45f, 1.0f), "%s", s_serverStatusMsg.c_str());
            }

            ImGui::EndChild();
        }
        // -------------------------------------------------------------
        // TAB 3: 账号与自动登录管理 (Accounts & Credentials)
        // -------------------------------------------------------------
        else if (g_iNewsTab == 3)
        {
            ImGui::SetCursorScreenPos(ImVec2(newsPos.x + 14, newsPos.y + 34));
            ImGui::BeginChild("AccountSettingsChild", ImVec2(475, 275), false);

            ImGui::TextColored(ImVec4(0.96f, 0.76f, 0.22f, 1.0f), "★ 游戏账号与自动登录管理 (Accounts & Credentials)");
            ImGui::Separator();
            ImGui::Spacing();

            ImGui::PushItemWidth(220.0f);
            ImGui::InputText("游戏账号 (Username)", s_accountUserBuf, sizeof(s_accountUserBuf));

            if (s_showPassword)
            {
                ImGui::InputText("游戏密码 (Password)", s_accountPassBuf, sizeof(s_accountPassBuf));
            }
            else
            {
                ImGui::InputText("游戏密码 (Password)", s_accountPassBuf, sizeof(s_accountPassBuf), ImGuiInputTextFlags_Password);
            }
            ImGui::PopItemWidth();

            ImGui::SameLine();
            ImGui::Checkbox("显示密码", &s_showPassword);

            ImGui::Checkbox("记住密码", &s_rememberPass);
            ImGui::SameLine();
            ImGui::Checkbox("自动免密登录", &s_autoLogin);

            ImGui::Spacing();
            if (ImGui::Button(" 💾 保存当前账号 ", ImVec2(130, 26)))
            {
                if (strlen(s_accountUserBuf) > 0)
                {
                    // Check if already in list
                    bool found = false;
                    for (auto& acc : s_savedAccounts)
                    {
                        if (acc.username == s_accountUserBuf)
                        {
                            acc.password = s_accountPassBuf;
                            acc.note = "最近登录";
                            found = true;
                            break;
                        }
                    }
                    if (!found)
                    {
                        s_savedAccounts.push_back({ s_accountUserBuf, s_accountPassBuf, "常用账号" });
                    }
                    SaveLauncherConfig();
                    s_accountStatusMsg = "✔ 账号密码已保存到本地配置！";
                }
                else
                {
                    s_accountStatusMsg = "⚠ 账号不能为空！";
                }
            }

            ImGui::SameLine();
            if (ImGui::Button(" 🚀 快速启动进入游戏 ", ImVec2(150, 26)))
            {
                if (strlen(s_accountUserBuf) > 0)
                {
                    SaveLauncherConfig();
                }
                g_Helper.ClickPlayButton();
            }

            if (!s_accountStatusMsg.empty())
            {
                ImGui::Spacing();
                ImGui::TextColored(ImVec4(0.35f, 0.95f, 0.45f, 1.0f), "%s", s_accountStatusMsg.c_str());
            }

            // Saved accounts list
            ImGui::Spacing();
            ImGui::Separator();
            ImGui::TextColored(ImVec4(0.7f, 0.8f, 0.95f, 1.0f), "已保存账号快捷列表 (点击快速切换):");

            for (size_t i = 0; i < s_savedAccounts.size(); i++)
            {
                ImGui::PushID((int)i);
                ImGui::Text("• %s", s_savedAccounts[i].username.c_str());
                ImGui::SameLine(180);
                if (ImGui::SmallButton("选择"))
                {
                    snprintf(s_accountUserBuf, sizeof(s_accountUserBuf), "%s", s_savedAccounts[i].username.c_str());
                    snprintf(s_accountPassBuf, sizeof(s_accountPassBuf), "%s", s_savedAccounts[i].password.c_str());
                    s_accountStatusMsg = "已载入账号: " + s_savedAccounts[i].username;
                }
                ImGui::SameLine(230);
                if (ImGui::SmallButton("以此账号启动"))
                {
                    snprintf(s_accountUserBuf, sizeof(s_accountUserBuf), "%s", s_savedAccounts[i].username.c_str());
                    snprintf(s_accountPassBuf, sizeof(s_accountPassBuf), "%s", s_savedAccounts[i].password.c_str());
                    SaveLauncherConfig();
                    g_Helper.ClickPlayButton();
                }
                ImGui::SameLine(330);
                if (ImGui::SmallButton("删除"))
                {
                    s_savedAccounts.erase(s_savedAccounts.begin() + i);
                    SaveLauncherConfig();
                    ImGui::PopID();
                    break;
                }
                ImGui::PopID();
            }

            ImGui::EndChild();
        }

        // News Bottom Status Line (inside container)
        float botY = newsPos.y + newsSize.y - 22.0f;
        drawList->AddLine(ImVec2(newsPos.x, botY - 4), ImVec2(newsPos.x + newsSize.x, botY - 4), IM_COL32(35, 40, 52, 255));
        char cdnInfoBuf[128];
        snprintf(cdnInfoBuf, sizeof(cdnInfoBuf), "CDN: %s • DLL 注入: %s",
            config::IsCDNUsingSSL ? "HTTPS/SSL" : "HTTP",
            config::IsDllInjectEnable ? config::InjectDLLName.c_str() : "未启用");
        drawList->AddText(ImVec2(newsPos.x + 10, botY), IM_COL32(140, 150, 170, 255), cdnInfoBuf);

        // Clickable Official Website link
        ImGui::SetCursorScreenPos(ImVec2(newsPos.x + newsSize.x - 130, botY - 2));
        if (ImGui::InvisibleButton("##official_web", ImVec2(120, 18)))
        {
            ShellExecuteA(nullptr, "open", config::WebsiteLink.c_str(), nullptr, nullptr, SW_SHOWNORMAL);
        }
        bool webHover = ImGui::IsItemHovered();
        drawList->AddText(
            ImVec2(newsPos.x + newsSize.x - 130, botY),
            webHover ? IM_COL32(255, 215, 80, 255) : IM_COL32(230, 180, 45, 255),
            "访问官方网站 >>"
        );

        // 4. Status String & Speed (x: 23, y: 379, w: 492)
        std::string currentStatus;
        {
            std::lock_guard<std::mutex> lock(g_FileStringMutex);
            currentStatus = g_FileString;
        }
        std::string currentSpeed;
        {
            std::lock_guard<std::mutex> lock(g_SpeedStringMutex);
            currentSpeed = g_SpeedString;
        }

        drawList->AddText(ImVec2(24.0f, 378.0f), IM_COL32(240, 240, 245, 255), currentStatus.c_str());
        if (!currentSpeed.empty())
        {
            ImVec2 speedSize = ImGui::CalcTextSize(currentSpeed.c_str());
            drawList->AddText(ImVec2(24.0f + 362.0f - speedSize.x, 378.0f), IM_COL32(90, 235, 130, 255), currentSpeed.c_str());
        }

        // 5. Dual Progress Bars (Authentic Trickster Layout)
        float fileProg = g_iFileProgress.load();
        if (fileProg < 0.0f) fileProg = 0.0f;
        if (fileProg > 1.0f) fileProg = 1.0f;

        float totalProg = g_iTotalProgress.load();
        if (totalProg < 0.0f) totalProg = 0.0f;
        if (totalProg > 1.0f) totalProg = 1.0f;

        // File Progress Bar: x: 24, y: 399, w: 362, h: 7 (White)
        drawList->AddRectFilled(ImVec2(24, 399), ImVec2(24 + 362, 399 + 7), IM_COL32(18, 20, 26, 230), 1.0f);
        if (fileProg > 0.0f)
        {
            drawList->AddRectFilled(ImVec2(24, 399), ImVec2(24 + (362.0f * fileProg), 399 + 7), IM_COL32(255, 255, 255, 255), 1.0f);
        }
        drawList->AddRect(ImVec2(24, 399), ImVec2(24 + 362, 399 + 7), IM_COL32(60, 65, 80, 200), 1.0f);

        // Total Progress Bar: x: 24, y: 412, w: 362, h: 12 (Cyan #85F2FE)
        drawList->AddRectFilled(ImVec2(24, 412), ImVec2(24 + 362, 412 + 12), IM_COL32(18, 20, 26, 230), 1.0f);
        if (totalProg > 0.0f)
        {
            drawList->AddRectFilled(ImVec2(24, 412), ImVec2(24 + (362.0f * totalProg), 412 + 12), IM_COL32(133, 242, 254, 255), 1.0f);
        }
        drawList->AddRect(ImVec2(24, 412), ImVec2(24 + 362, 412 + 12), IM_COL32(60, 65, 80, 200), 1.0f);

        // 6. Action Buttons with authentic PNG texture skins
        bool isGameLocked = (!g_Helper.isWorkerDone) || g_Helper.isMaintenance;
        bool isOtherLocked = !g_Helper.isWorkerDone;

        // Check Files: x: 23, y: 432, w: 113, h: 27
        if (DrawCustomImageButton(
            "Check Files",
            ImVec2(23, 432),
            ImVec2(113, 27),
            g_pTexCheckNormal,
            g_pTexCheckHover,
            g_pTexCheckPressed,
            isOtherLocked))
        {
            g_Helper.CheckWorker(true);
        }

        // Option: x: 150, y: 432, w: 113, h: 27
        if (DrawCustomImageButton(
            "Option",
            ImVec2(150, 432),
            ImVec2(113, 27),
            g_pTexOptionNormal,
            g_pTexOptionHover,
            g_pTexOptionPressed,
            isOtherLocked))
        {
            ShellExecuteA(nullptr, "open", config::OptionExecName.c_str(), nullptr, nullptr, SW_SHOWNORMAL);
        }

        // Exit: x: 274, y: 432, w: 113, h: 27
        if (DrawCustomImageButton(
            "Exit",
            ImVec2(274, 432),
            ImVec2(113, 27),
            g_pTexExitNormal,
            g_pTexExitHover,
            g_pTexExitPressed,
            false))
        {
            isRunning = false;
        }

        // Big Game Start Button: x: 399, y: 398, w: 118, h: 61
        if (DrawCustomImageButton(
            "Game Start",
            ImVec2(399, 398),
            ImVec2(118, 61),
            g_pTexGameNormal,
            g_pTexGameHover,
            g_pTexGamePressed,
            isGameLocked))
        {
            g_Helper.ClickPlayButton();
        }

        // 7. Authentic Trickster Logo: x: 11, y: 466, w: 185, h: 71
        if (g_pTexLogo)
        {
            drawList->AddImage(
                (ImTextureID)g_pTexLogo,
                ImVec2(11, 466),
                ImVec2(11 + 185, 466 + 71)
            );
        }

        // 8. Bottom Server Quick Info Bar with interactive buttons (x: 202, y: 468, w: 315, h: 66)
        ImVec2 barPos(202.0f, 468.0f);
        ImVec2 barSize(315.0f, 66.0f);
        drawList->AddRectFilled(barPos, ImVec2(barPos.x + barSize.x, barPos.y + barSize.y), IM_COL32(15, 18, 26, 235), 4.0f);
        drawList->AddRect(barPos, ImVec2(barPos.x + barSize.x, barPos.y + barSize.y), IM_COL32(65, 75, 95, 200), 4.0f);

        // Server IP & Port info
        char srvTitle[128];
        snprintf(srvTitle, sizeof(srvTitle), "★ 服务器: %s:%d", config::ServerIP.c_str(), config::ServerPort);
        drawList->AddText(ImVec2(barPos.x + 8, barPos.y + 6), IM_COL32(245, 195, 55, 255), srvTitle);

        // Active account info
        char accInfo[128];
        if (strlen(s_accountUserBuf) > 0)
        {
            snprintf(accInfo, sizeof(accInfo), "当前账号: %s", s_accountUserBuf);
        }
        else
        {
            snprintf(accInfo, sizeof(accInfo), "当前账号: (未绑定，点击右侧设置)");
        }
        drawList->AddText(ImVec2(barPos.x + 8, barPos.y + 24), IM_COL32(195, 205, 220, 255), accInfo);

        // Status indicator
        drawList->AddText(ImVec2(barPos.x + 8, barPos.y + 44), IM_COL32(120, 225, 140, 255), "● 在线连接正常  |  回车键启动游戏");

        // Action Buttons inside Quick Bar
        // Button 1: [⚙ 设置服务器] -> Switches to Tab 2
        ImGui::SetCursorScreenPos(ImVec2(barPos.x + barSize.x - 100, barPos.y + 6));
        if (ImGui::Button("⚙ 设置服务器", ImVec2(92, 22)))
        {
            g_iNewsTab = 2; // Switch to Server Config tab
        }

        // Button 2: [👤 账号管理] -> Switches to Tab 3
        ImGui::SetCursorScreenPos(ImVec2(barPos.x + barSize.x - 100, barPos.y + 34));
        if (ImGui::Button("👤 账号管理", ImVec2(92, 22)))
        {
            g_iNewsTab = 3; // Switch to Account Manager tab
        }

        ImGui::End();
        ImGui::EndFrame();
    }

    void EndRender()
    {
        if (d3ddev)
        {
            d3ddev->Clear(0, nullptr, D3DCLEAR_TARGET | D3DCLEAR_ZBUFFER, D3DCOLOR_RGBA(15, 18, 26, 255), 1.0f, 0);
            if (SUCCEEDED(d3ddev->BeginScene()))
            {
                ImGui::Render();
                ImGui_ImplDX9_RenderDrawData(ImGui::GetDrawData());
                d3ddev->EndScene();
            }
            HRESULT result = d3ddev->Present(nullptr, nullptr, nullptr, nullptr);
            if (result == D3DERR_DEVICELOST && d3ddev->TestCooperativeLevel() == D3DERR_DEVICENOTRESET)
            {
                ImGui_ImplDX9_InvalidateDeviceObjects();
                d3ddev->Reset(&d3dpp);
                ImGui_ImplDX9_CreateDeviceObjects();
            }
        }
    }
}
