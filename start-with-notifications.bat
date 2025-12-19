@echo off
cls
echo ============================================================
echo    Dubai Nest Hub - Start with Chatbot Notifications
echo ============================================================
echo.
echo This script will:
echo   1. Start the backend API (with Slack and Email)
echo   2. Start the frontend dev server
echo.
echo IMPORTANT: Keep this window open!
echo Both servers will run in the background.
echo.
echo ============================================================
echo.

echo [1/3] Checking backend dependencies...
cd truenester-chatbot-api
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
) else (
    echo Backend dependencies already installed.
)

echo.
echo [2/3] Starting backend API on port 4000...
echo Backend logs will appear below:
echo.
start "Backend API (Port 4000)" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo [3/3] Starting frontend on port 8080...
cd ..
start "Frontend Dev Server (Port 8080)" cmd /k "npm run dev"

echo.
echo ============================================================
echo    Servers Starting...
echo ============================================================
echo.
echo Backend API:     http://localhost:4000/api
echo Frontend:        http://localhost:8080
echo Admin Panel:     http://localhost:8080/admin/conversations
echo.
echo Notifications configured:
echo   - Slack webhook: ACTIVE
echo   - Email:         info@truenester.com, truenester4u@gmail.com
echo.
echo ============================================================
echo.
echo To test chatbot notifications:
echo   1. Open http://localhost:8080
echo   2. Click chatbot widget (bottom-right)
echo   3. Complete conversation and submit details
echo   4. Check Slack and email for notifications!
echo.
echo Or run: node test-chatbot-notifications.js
echo.
echo Press any key to close this window...
pause >nul
