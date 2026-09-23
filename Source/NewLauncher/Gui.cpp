#include "Gui.h"
#include "Helper.h"
#include "Config.h"
#include "Language.h"
#include "imgui.h"
#include "backends/imgui_impl_win32.h"
#include "backends/imgui_impl_dx9.h"
#include <shellapi.h>

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
            return HTCAPTION;
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
        style.WindowRounding = 4.0f;
        style.FrameRounding = 3.0f;
        style.ScrollbarRounding = 3.0f;
        style.WindowBorderSize = 0.0f;

        ImGui_ImplWin32_Init(window);
        ImGui_ImplDX9_Init(d3ddev);
    }

    void DestroyImGui()
    {
        ImGui_ImplDX9_Shutdown();
        ImGui_ImplWin32_Shutdown();
        ImGui::DestroyContext();
    }

    void LoadResources()
    {
        // Start background updater check
        g_Helper.FileCheckUpdate();
    }

    void InitWebView(HWND /*hwnd*/)
    {
        // Safe fallback - WebView2 initialization if runtime available
    }

    void BeginRender()
    {
        ImGui_ImplDX9_NewFrame();
        ImGui_ImplWin32_NewFrame();
        ImGui::NewFrame();
    }

    void Render()
    {
        ImGui::SetNextWindowPos(ImVec2(0, 0));
        ImGui::SetNextWindowSize(ImVec2(538, 564));
        ImGuiWindowFlags flags = ImGuiWindowFlags_NoTitleBar | ImGuiWindowFlags_NoResize |
                                 ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoCollapse |
                                 ImGuiWindowFlags_NoBringToFrontOnFocus;

        ImGui::Begin("TricksterMainLauncher", nullptr, flags);

        // Header
        ImGui::PushStyleColor(ImGuiCol_Text, ImVec4(0.95f, 0.75f, 0.25f, 1.0f));
        ImGui::SetWindowFontScale(1.2f);
        ImGui::Text("%s", config::SubTitle.c_str());
        ImGui::SetWindowFontScale(1.0f);
        ImGui::PopStyleColor();

        ImGui::Separator();
        ImGui::Spacing();

        // Server Info
        ImGui::TextColored(ImVec4(0.4f, 0.8f, 1.0f, 1.0f), "Server: %s:%d (CDN: %s)",
            config::ServerIP.c_str(), config::ServerPort, config::LauncherCDN.c_str());

        ImGui::Spacing();
        ImGui::Spacing();

        // Status string
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

        ImGui::Text("Status: %s", currentStatus.c_str());
        if (!currentSpeed.empty())
        {
            ImGui::SameLine(400);
            ImGui::TextColored(ImVec4(0.3f, 0.9f, 0.4f, 1.0f), "%s", currentSpeed.c_str());
        }

        // Progress bars
        float fileProg = g_iFileProgress.load();
        float totalProg = g_iTotalProgress.load();

        ImGui::ProgressBar(fileProg, ImVec2(520, 16), "");
        ImGui::ProgressBar(totalProg, ImVec2(520, 20), "");

        ImGui::Spacing();
        ImGui::Separator();
        ImGui::Spacing();

        // Buttons
        bool canStart = g_Helper.isWorkerDone || !g_Helper.isMaintenance;
        if (canStart)
        {
            ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.85f, 0.65f, 0.1f, 1.0f));
            ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.95f, 0.75f, 0.2f, 1.0f));
            ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4(0.75f, 0.55f, 0.05f, 1.0f));
        }
        else
        {
            ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.3f, 0.3f, 0.3f, 1.0f));
            ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.3f, 0.3f, 0.3f, 1.0f));
            ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4(0.3f, 0.3f, 0.3f, 1.0f));
        }

        if (ImGui::Button("Game Start (Enter)", ImVec2(160, 42)))
        {
            g_Helper.ClickPlayButton();
        }
        ImGui::PopStyleColor(3);

        ImGui::SameLine();
        if (ImGui::Button("Check Files", ImVec2(110, 42)))
        {
            g_Helper.CheckWorker(true);
        }

        ImGui::SameLine();
        if (ImGui::Button("Options", ImVec2(110, 42)))
        {
            ShellExecuteA(nullptr, "open", config::OptionExecName.c_str(), nullptr, nullptr, SW_SHOWNORMAL);
        }

        ImGui::SameLine();
        if (ImGui::Button("Exit", ImVec2(100, 42)))
        {
            isRunning = false;
        }

        ImGui::End();
        ImGui::EndFrame();
    }

    void EndRender()
    {
        if (d3ddev)
        {
            d3ddev->Clear(0, nullptr, D3DCLEAR_TARGET | D3DCLEAR_ZBUFFER, D3DCOLOR_RGBA(20, 20, 24, 255), 1.0f, 0);
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
