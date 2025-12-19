@echo off
echo Killing process on port 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do taskkill /F /PID %%a
echo Done!
pause
