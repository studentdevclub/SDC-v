@echo off
setlocal enabledelayedexpansion
title SDC - Student Developer Club Platform

:: Ensure script runs from the project root directory
cd /d "%~dp0"

echo ========================================================
echo        Student Developer Club (SDC) - Launcher         
echo ========================================================
echo.

:: 1. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH.
    echo Please install Node.js ^(v18+^) from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check for npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found in your PATH.
    echo.
    pause
    exit /b 1
)

:: 3. Check for .env file
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] .env file not found. Creating .env from .env.example...
        copy ".env.example" ".env" >nul
        echo [INFO] Created .env file.
    ) else (
        echo [WARNING] Neither .env nor .env.example was found.
    )
    echo.
)

:: 4. Check for node_modules
if not exist "node_modules\" (
    echo [INFO] node_modules directory not found. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
    echo.
)

:: 5. Launch Backend Server in a dedicated window
echo [1/2] Starting Express API Server on http://localhost:4000 ...
start "SDC Backend Server (Port 4000)" cmd /k "npm run server:dev"

:: 6. Launch Frontend Dev Server in the current window
echo [2/2] Starting Vite Frontend Server on http://localhost:5173 ...
echo.
echo ========================================================
echo  SDC Platform Services:
echo  - Backend API:  http://localhost:4000
echo  - Frontend App: http://localhost:5173
echo ========================================================
echo.

call npm run dev
