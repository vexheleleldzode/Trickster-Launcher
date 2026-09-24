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

extern IMGUI_IMPL_API LRESULT ImGui_ImplWin32_WndProcHandler(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);

namespace gui
{
    HWND window = nullptr;
    bool isRunning = true;
    LPDIRECT3D9 d3d = nullptr;
    LPDIRECT3DDEVICE9 d3ddev = nullptr;
    D3DPRESENT_PARAMETERS d3dpp = {};

    std::mutex g_FileStringMutex;
    std::string g_FileString = "Initializing...";
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

    // Active notice / news tab
    int g_iNewsTab = 0; // 0: Notices, 1: Events, 2: Patch Notes, 3: Server Info

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
            // Allow dragging only within the top title bar area (height 26px)
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

        ImGui::StyleColorsDark();
        ImGuiStyle& style = ImGui::GetStyle();
        style.WindowRounding = 0.0f;
        style.FrameRounding = 2.0f;
        style.ScrollbarRounding = 2.0f;
        style.WindowBorderSize = 0.0f;
        style.WindowPadding = ImVec2(0, 0);

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

    // Helper: Find resource file from multiple potential locations
    static std::string FindResourcePath(const std::string& relPath)
    {
        // 1. Direct relative check
        if (std::filesystem::exists(relPath))
            return relPath;

        // 2. Relative to current EXE directory
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
        // Load main backgrounds and brand logo
        g_pTexBg = LoadTexture("bg.png");
        g_pTexLogo = LoadTexture("logo.png");

        // Game Start Button
        g_pTexGameNormal = LoadTexture("normal/game.png");
        g_pTexGameHover = LoadTexture("hover/game.png");
        g_pTexGamePressed = LoadTexture("pressed/game.png");

        // Check Files Button
        g_pTexCheckNormal = LoadTexture("normal/check.png");
        g_pTexCheckHover = LoadTexture("hover/check.png");
        g_pTexCheckPressed = LoadTexture("pressed/check.png");

        // Option Button
        g_pTexOptionNormal = LoadTexture("normal/option.png");
        g_pTexOptionHover = LoadTexture("hover/option.png");
        g_pTexOptionPressed = LoadTexture("pressed/option.png");

        // Exit Button
        g_pTexExitNormal = LoadTexture("normal/exit.png");
        g_pTexExitHover = LoadTexture("hover/exit.png");
        g_pTexExitPressed = LoadTexture("pressed/exit.png");

        // Start background updater check
        g_Helper.FileCheckUpdate();
    }

    void InitWebView(HWND /*hwnd*/)
    {
        // Safe WebView2 initialization
    }

    void BeginRender()
    {
        ImGui_ImplDX9_NewFrame();
        ImGui_ImplWin32_NewFrame();
        ImGui::NewFrame();
    }

    // Interactive button using custom 3-state textures
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
            // Clean fallback in case texture file is absent
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

        // 1. Draw Authentic Background Image (538x564)
        if (g_pTexBg)
        {
            drawList->AddImage((ImTextureID)g_pTexBg, ImVec2(0, 0), ImVec2(538, 564));
        }
        else
        {
            // Dark stylized game gradient fallback
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

        // 3. Embedded News / Notices Window Container (x: 19, y: 32, w: 503, h: 343)
        const ImVec2 newsPos(19.0f, 32.0f);
        const ImVec2 newsSize(503.0f, 343.0f);
        drawList->AddRectFilled(newsPos, ImVec2(newsPos.x + newsSize.x, newsPos.y + newsSize.y), IM_COL32(12, 14, 20, 235), 4.0f);
        drawList->AddRect(newsPos, ImVec2(newsPos.x + newsSize.x, newsPos.y + newsSize.y), IM_COL32(55, 60, 75, 200), 4.0f);

        // News Header Tab Bar (height: 28px)
        drawList->AddRectFilled(newsPos, ImVec2(newsPos.x + newsSize.x, newsPos.y + 28), IM_COL32(20, 24, 35, 255), 4.0f, ImDrawFlags_RoundCornersTop);
        drawList->AddLine(ImVec2(newsPos.x, newsPos.y + 28), ImVec2(newsPos.x + newsSize.x, newsPos.y + 28), IM_COL32(45, 50, 65, 255));

        const char* tabs[] = { "公告 (Notices)", "活动 (Events)", "版本说明 (Patch Notes)", "服务器状态 (Server)" };
        float tabX = newsPos.x + 10.0f;
        for (int i = 0; i < 4; i++)
        {
            ImVec2 tSize = ImGui::CalcTextSize(tabs[i]);
            ImVec2 bPos(tabX, newsPos.y + 4.0f);
            ImGui::SetCursorScreenPos(bPos);
            char tabId[32];
            snprintf(tabId, sizeof(tabId), "##newstab_%d", i);
            if (ImGui::InvisibleButton(tabId, ImVec2(tSize.x + 12.0f, 20.0f)))
            {
                g_iNewsTab = i;
            }
            bool tHover = ImGui::IsItemHovered();
            bool tActive = (g_iNewsTab == i);

            if (tActive)
            {
                drawList->AddLine(ImVec2(bPos.x + 2, bPos.y + 22), ImVec2(bPos.x + tSize.x + 10, bPos.y + 22), IM_COL32(245, 185, 45, 255), 2.5f);
                drawList->AddText(ImVec2(bPos.x + 6, bPos.y + 3), IM_COL32(245, 195, 60, 255), tabs[i]);
            }
            else
            {
                drawList->AddText(ImVec2(bPos.x + 6, bPos.y + 3), tHover ? IM_COL32(220, 220, 230, 255) : IM_COL32(140, 145, 160, 255), tabs[i]);
            }
            tabX += tSize.x + 18.0f;
        }

        // News Content Body Area
        ImVec2 contentPos(newsPos.x + 12.0f, newsPos.y + 36.0f);

        // Maintenance Banner
        if (g_Helper.isMaintenance)
        {
            drawList->AddRectFilled(contentPos, ImVec2(contentPos.x + 479.0f, contentPos.y + 38.0f), IM_COL32(65, 35, 15, 240), 3.0f);
            drawList->AddRect(contentPos, ImVec2(contentPos.x + 479.0f, contentPos.y + 38.0f), IM_COL32(210, 130, 40, 255), 3.0f);
            drawList->AddText(ImVec2(contentPos.x + 8.0f, contentPos.y + 5.0f), IM_COL32(255, 200, 80, 255), "[注意] 服务器维护中 (Server Under Maintenance)");
            drawList->AddText(ImVec2(contentPos.x + 8.0f, contentPos.y + 20.0f), IM_COL32(210, 210, 210, 240), "游戏服务器正在例行维护，请关注官网与交流群最新公告！");
            contentPos.y += 46.0f;
        }

        // Tab Content
        if (g_iNewsTab == 0)
        {
            drawList->AddText(ImVec2(contentPos.x, contentPos.y), IM_COL32(245, 190, 50, 255), "欢迎来到 Trickster Online 经典怀旧服！");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 20), IM_COL32(190, 195, 205, 255), "• 游戏登录器全面升级：内置防超时极速启动，卡更新自动放行。");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 38), IM_COL32(190, 195, 205, 255), "• 掉线自动重连补丁已部署，全面支持高分辨率窗口缩放。");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 56), IM_COL32(190, 195, 205, 255), "• 请妥善保管好个人账号与密码，切勿使用非法第三方脚本。");
        }
        else if (g_iNewsTab == 1)
        {
            drawList->AddText(ImVec2(contentPos.x, contentPos.y), IM_COL32(245, 190, 50, 255), "★ 本周精彩线上活动预告");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 20), IM_COL32(190, 195, 205, 255), "• 全服双倍经验 & 钻地掉率翻倍狂欢周末进行中！");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 38), IM_COL32(190, 195, 205, 255), "• 卡巴拉岛新春庆典集字兑换稀有宠物活动即将开启。");
        }
        else if (g_iNewsTab == 2)
        {
            drawList->AddText(ImVec2(contentPos.x, contentPos.y), IM_COL32(245, 190, 50, 255), "当前补丁更新日志 (Version Details):");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 20), IM_COL32(190, 195, 205, 255), "• 客户端优化：解决 Direct3D9 纹理加载卡顿问题。");
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 38), IM_COL32(190, 195, 205, 255), "• 提升文件校验并发度，MD5 对比耗时缩减 80%。");
        }
        else
        {
            drawList->AddText(ImVec2(contentPos.x, contentPos.y), IM_COL32(245, 190, 50, 255), "当前连接游戏服务器信息:");
            char srvBuf[128];
            snprintf(srvBuf, sizeof(srvBuf), "• 目标服务器地址: %s:%d", config::ServerIP.c_str(), config::ServerPort);
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 20), IM_COL32(190, 195, 205, 255), srvBuf);
            snprintf(srvBuf, sizeof(srvBuf), "• CDN 补丁镜像源: %s", config::LauncherCDN.c_str());
            drawList->AddText(ImVec2(contentPos.x, contentPos.y + 38), IM_COL32(190, 195, 205, 255), srvBuf);
        }

        // News Bottom Status Line (inside container, y: newsPos.y + newsSize.y - 24)
        float botY = newsPos.y + newsSize.y - 22.0f;
        drawList->AddLine(ImVec2(newsPos.x, botY - 4), ImVec2(newsPos.x + newsSize.x, botY - 4), IM_COL32(35, 40, 52, 255));
        drawList->AddText(ImVec2(newsPos.x + 10, botY), IM_COL32(120, 130, 150, 255), "CDN: HTTPS / SSL • DLL Inject: Enabled");
        drawList->AddText(ImVec2(newsPos.x + newsSize.x - 130, botY), IM_COL32(220, 175, 40, 255), "Official Website >>");

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

        // 5. Dual Progress Bars (Matching Authentic Trickster Layout)
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

        // 8. Bottom Server Quick Info Bar (x: 202, y: 466, w: 320, h: 71)
        ImVec2 barPos(202.0f, 468.0f);
        ImVec2 barSize(315.0f, 66.0f);
        drawList->AddRectFilled(barPos, ImVec2(barPos.x + barSize.x, barPos.y + barSize.y), IM_COL32(15, 18, 26, 230), 4.0f);
        drawList->AddRect(barPos, ImVec2(barPos.x + barSize.x, barPos.y + barSize.y), IM_COL32(65, 75, 95, 200), 4.0f);

        // Server Status line
        drawList->AddText(ImVec2(barPos.x + 10, barPos.y + 8), IM_COL32(245, 190, 45, 255), "★ 游戏服务器 (Game Server)");
        char srvDetail[128];
        snprintf(srvDetail, sizeof(srvDetail), "IP: %s  Port: %d", config::ServerIP.c_str(), config::ServerPort);
        drawList->AddText(ImVec2(barPos.x + 10, barPos.y + 26), IM_COL32(210, 215, 225, 255), srvDetail);

        drawList->AddText(ImVec2(barPos.x + 10, barPos.y + 44), IM_COL32(130, 220, 150, 255), "● 在线连接正常  |  回车键快速启动游戏");

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
