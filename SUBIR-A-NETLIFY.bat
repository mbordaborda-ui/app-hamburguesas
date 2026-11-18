@echo off
chcp 65001 >nul
title EL PARCHE - Preparar para Netlify
cd /d "%~dp0"

echo.
echo  ==================================================
echo    EL PARCHE - Preparar despliegue en Netlify
echo  ==================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [X] Falta Node.js.
  echo      Descargalo en https://nodejs.org ^(version LTS^)
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  Instalando dependencias por primera vez...
  echo  Esto puede tardar 1 o 2 minutos.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo  [X] Fallo la instalacion. Revisa tu conexion a internet.
    echo.
    pause
    exit /b 1
  )
)

echo  Compilando la app para produccion...
echo.
call npm run build
if errorlevel 1 (
  echo.
  echo  [X] Fallo la compilacion. Copia el error de arriba y mandalo.
  echo.
  pause
  exit /b 1
)

echo.
echo  ==================================================
echo    COMPILACION LISTA
echo  ==================================================
echo.
echo   PASOS:
echo.
echo   1. Se acaba de abrir la carpeta "dist"
echo   2. Se acaba de abrir https://app.netlify.com/drop
echo   3. Arrastra la CARPETA "dist" COMPLETA a esa pagina
echo      ^(no los archivos sueltos, la carpeta^)
echo   4. Espera 10-20 segundos. Te dara una URL.
echo   5. Abre esa URL en tu celular. Listo.
echo.
echo   Si te pide crear cuenta: es gratis, con Google o GitHub.
echo   Luego en "Site configuration" puedes cambiarle el nombre.
echo.

start "" "%CD%\dist"
start "" "https://app.netlify.com/drop"

echo  Ventana abierta. Puedes cerrarla cuando termines de subir.
echo.
pause
