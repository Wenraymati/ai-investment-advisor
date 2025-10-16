@echo off
echo ========================================
echo SmartProIA - Test Local
echo ========================================
echo.

echo Iniciando backend en puerto 3001...
echo.
echo IMPORTANTE:
echo - Asegurate que .env esta configurado
echo - Presiona Ctrl+C para detener el servidor
echo.
echo URL Backend: http://localhost:3001
echo URL Frontend: http://localhost:3000 (iniciar en otra terminal)
echo.
pause

node server.complete.js
