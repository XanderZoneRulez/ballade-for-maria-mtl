@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title X-girl Translation Tool

:menu
cls
echo ========================================
echo   X-girl Translation Tool
echo ========================================
echo.
echo Available Commands:
echo.
echo   [d] Decompile Japanese MES and MEC files
echo   [c] Compile English MES and MEC files
echo   [e] Extract Japanese text to JP JSON
echo   [i] Insert English text to EN RKT
echo   [h] Import English MES and MEC files to HDI image
echo   [a] Run all (=i+c+h, Insert, then Compile, then Import to HDI)
echo   [q] Quit
echo.
set /p choice="Enter your choice (d/c/e/i/h/a/q): "

if /i "%choice%"=="d" goto decompress
if /i "%choice%"=="c" goto compress
if /i "%choice%"=="e" goto extract
if /i "%choice%"=="i" goto inject
if /i "%choice%"=="h" goto hdi
if /i "%choice%"=="a" goto all
if /i "%choice%"=="q" goto end
if /i "%choice%"=="0" goto end

echo.
echo Invalid choice! Please try again.
pause
goto menu

:decompress
echo.
echo ========================================
echo   Decompiling Japanese MES Files
echo ========================================
echo.
bun src/decompile.ts
echo.
pause
goto menu

:compress
echo.
echo ========================================
echo   Compiling English MES Files
echo ========================================
echo.
bun src/compile.ts
echo.
pause
goto menu

:extract
echo.
echo ========================================
echo   Extracting Japanese Text
echo ========================================
echo.
bun src/extract.ts
echo.
pause
goto menu

:inject
echo.
echo ========================================
echo   Inserting English Text
echo ========================================
echo.
bun src/insert.ts
echo.
pause
goto menu

:hdi
echo.
echo ========================================
echo   Importing MES Files to HDI Image
echo ========================================
echo.
bun src/hdi.ts
echo.
pause
goto menu

:all
echo.
echo ========================================
echo   Running All Commands
echo   (Insert + Compile + HDI Import)
echo ========================================
echo.
bun all
echo.
pause
goto menu

:end
cls
echo.
echo ========================================
echo   Thank you for using!
echo ========================================
echo.
timeout /t 2 >nul
exit
