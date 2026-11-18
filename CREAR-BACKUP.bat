@echo off
chcp 65001 >nul
title EL PARCHE - Crear copia de seguridad
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\backup.ps1"

echo  Presiona cualquier tecla para cerrar...
pause >nul
