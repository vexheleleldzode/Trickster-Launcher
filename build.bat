@echo off
setlocal enabledelayedexpansion

echo ===============================================================
echo       Trickster Online Launcher - One-Click Auto Build
echo ===============================================================
echo.

:: Check for vswhere to find MSBuild
set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
if not exist "!VSWHERE!" (
    echo [ERROR] Visual Studio installer / vswhere not found.
    echo Please install Visual Studio 2022 or Build Tools.
    pause
    exit /b 1
)

for /f "usebackq tokens=*" %%i in (`"!VSWHERE!" -latest -requires Microsoft.Component.MSBuild -find MSBuild\**\Bin\MSBuild.exe`) do (
    set "MSBUILD=%%i"
)

if not exist "!MSBUILD!" (
    echo [ERROR] MSBuild.exe was not found.
    pause
    exit /b 1
)

echo [OK] Found MSBuild: "!MSBUILD!"
echo.

:: Restore NuGet Packages if nuget is available
where nuget >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Restoring NuGet Packages...
    nuget restore Source\NewLauncher\packages.config -PackagesDirectory packages
) else (
    echo [WARN] nuget.exe not found in PATH, skipping explicit restore (MSBuild will attempt).
)

echo.
echo [INFO] Compiling TricksterLauncher.sln (Release ^| Win32)...
"!MSBUILD!" TricksterLauncher.sln /p:Configuration=Release /p:Platform=Win32 /m /verbosity:minimal

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Check compiler logs above.
    pause
    exit /b %errorlevel%
)

echo.
echo ===============================================================
echo [SUCCESS] Build completed successfully!
echo Executables generated at:
echo   - Output\Trickster Launcher\Splash.exe
echo   - Output\FileListGen\FileListGen.exe
echo ===============================================================
echo.
pause
