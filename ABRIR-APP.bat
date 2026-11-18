@echo off
chcp 65001 >nul
title EL PARCHE - Hamburguesas Urbanas
cd /d "%~dp0"

echo.
echo  ============================================
echo    EL PARCHE - Hamburguesas Urbanas
echo  ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [X] No encontre Node.js instalado.
  echo.
  echo      Descargalo gratis en: https://nodejs.org
  echo      Elige la version "LTS", instalala y vuelve a abrir este archivo.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  Instalando dependencias por primera vez...
  echo  Esto puede tardar 1 o 2 minutos. No cierres esta ventana.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo  [X] Fallo la instalacion. Revisa tu conexion a internet.
    echo.
    pause
    exit /b 1
  )
  echo.
  echo  Dependencias instaladas correctamente.
  echo.
)

echo  Arrancando la app...
echo.
echo  Se va a abrir el navegador en: http://localhost:5180
echo  Si no se abre solo, copia esa direccion en Chrome.
echo.
echo  Para APAGAR la app: presiona Ctrl + C en esta ventana.
echo.

start "" cmd /c "timeout /t 9 /nobreak >nul & start "" http://localhost:5180"

call npm run dev

echo.
echo  La app se detuvo.
pause
