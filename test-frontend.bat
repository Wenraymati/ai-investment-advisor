@echo off
echo ========================================
echo SmartProIA - Test Frontend
echo ========================================
echo.
echo ESTADO DE SERVIDORES:
echo ----------------------------------------
echo.
echo Backend (API): http://localhost:3001
echo Frontend (React): http://localhost:3000
echo.
echo ========================================
echo INSTRUCCIONES PARA PROBAR:
echo ========================================
echo.
echo 1. Abre tu navegador en: http://localhost:3000
echo.
echo 2. REGISTRO DE USUARIO:
echo    - Click en "Registrarse"
echo    - Nombre: Test User
echo    - Email: test@example.com
echo    - Password: test123456
echo    - Click "Registrarse Gratis"
echo.
echo 3. Deberia entrar automaticamente al Dashboard
echo.
echo 4. PROBAR CHAT CON IA:
echo    - En el tab "Chat IA"
echo    - Escribe: "Dame un analisis de NVIDIA"
echo    - Presiona "Enviar"
echo    - Espera respuesta de Claude AI (5-10 seg)
echo.
echo 5. PROBAR LIMITES:
echo    - Usuarios FREE: 10 consultas
echo    - Usuarios BASIC: 50 consultas
echo    - Usuarios PREMIUM: Ilimitadas
echo.
echo ========================================
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause > nul
start http://localhost:3000
echo.
echo Navegador abierto!
echo.
echo Para ver logs del backend, revisa la terminal donde corre server.nodb.js
echo.
pause
