#pragma once
#include <windows.h>
#include <d3d9.h>
#include <string>
#include <atomic>
#include <mutex>

class Helper;

namespace gui
{
    extern HWND window;
    extern bool isRunning;
    extern LPDIRECT3D9 d3d;
    extern LPDIRECT3DDEVICE9 d3ddev;

    // Mutexes and strings accessed by Helper.cpp
    extern std::mutex g_FileStringMutex;
    extern std::string g_FileString;
    extern std::mutex g_SpeedStringMutex;
    extern std::string g_SpeedString;
    extern std::atomic<float> g_iFileProgress;
    extern std::atomic<float> g_iTotalProgress;

    bool copyAndRunSelf();
    void CreateHWindow(const wchar_t* title);
    void DestroyHWindow();
    bool CreateDevice();
    void DestroyDevice();
    void CreateImGui();
    void DestroyImGui();
    void LoadResources();
    void InitWebView(HWND hwnd);
    void BeginRender();
    void Render();
    void EndRender();
}
