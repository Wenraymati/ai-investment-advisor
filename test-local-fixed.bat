@echo off
echo ========================================
echo SmartProIA - Test Local (FIXED)
echo ========================================
echo.

echo Verificando archivo .env...
if not exist .env (
    echo ERROR: Archivo .env no encontrado
    echo.
    echo Copiando desde port.env.txt...
    if exist port.env.txt (
        copy port.env.txt .env
        echo ✓ Archivo .env creado desde port.env.txt
    ) else (
        echo ERROR: Tampoco existe port.env.txt
        echo Por favor crea el archivo .env manualmente
        pause
        exit /b 1
    )
) else (
    echo ✓ Archivo .env existe
)
echo.

echo Contenido de .env:
echo ----------------------------------------
type .env
echo ----------------------------------------
echo.

echo Verificando Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js no instalado
    pause
    exit /b 1
)
echo ✓ Node.js instalado
echo.

echo ========================================
echo Iniciando Backend en puerto 3001...
echo ========================================
echo.
echo Logs del servidor:
echo ----------------------------------------
echo.

node server.complete.js
