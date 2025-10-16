@echo off
echo ========================================
echo SmartProIA - Setup Script
echo ========================================
echo.

echo Verificando Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js no instalado
    echo Descarga desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js instalado

echo.
echo Verificando npm...
npm --version
if errorlevel 1 (
    echo ERROR: npm no instalado
    pause
    exit /b 1
)
echo ✓ npm instalado

echo.
echo ========================================
echo Paso 1: Instalando dependencias backend
echo ========================================
call npm install
if errorlevel 1 (
    echo ERROR: Fallo al instalar dependencias backend
    pause
    exit /b 1
)
echo ✓ Dependencias backend instaladas

echo.
echo ========================================
echo Paso 2: Instalando dependencias frontend
echo ========================================
cd frontend
if not exist package.json (
    echo ERROR: No existe frontend/package.json
    echo Creando package.json basico...
    echo {"name":"smartproia-frontend","version":"1.0.0","dependencies":{"react":"^18.2.0","react-dom":"^18.2.0","react-scripts":"5.0.1","lucide-react":"^0.263.1"},"scripts":{"start":"react-scripts start","build":"react-scripts build","test":"react-scripts test"}} > package.json
)
call npm install
if errorlevel 1 (
    echo ERROR: Fallo al instalar dependencias frontend
    pause
    exit /b 1
)
cd ..
echo ✓ Dependencias frontend instaladas

echo.
echo ========================================
echo Paso 3: Verificando archivo .env
echo ========================================
if not exist .env (
    echo Creando .env desde .env.example...
    copy .env.example .env
    echo.
    echo ⚠️ IMPORTANTE: Edita .env con tus valores reales
    echo Especialmente:
    echo   - ANTHROPIC_API_KEY
    echo   - JWT_SECRET
    echo   - STRIPE_SECRET_KEY
    echo.
    notepad .env
)
echo ✓ Archivo .env existe

echo.
echo ========================================
echo ✓ Setup completado!
echo ========================================
echo.
echo Proximos pasos:
echo 1. Edita .env con tus API keys reales
echo 2. Ejecuta: npm start  (para backend local)
echo 3. Ejecuta: cd frontend ^&^& npm start  (para frontend local)
echo.
echo Para deploy en produccion:
echo 4. Sigue DEPLOYMENT_GUIDE.md
echo.
pause
