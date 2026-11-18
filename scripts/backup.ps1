# Crea un ZIP con todo lo importante del proyecto.
# Excluye node_modules y dist porque se regeneran con:
#   npm install  ->  node_modules
#   npm run build ->  dist

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$excluir = @('node_modules', 'dist', '.git', '.vite')

$fecha = Get-Date -Format 'yyyy-MM-dd'
$nombre = "ELPARCHE-backup-$fecha.zip"

$escritorio = [Environment]::GetFolderPath('Desktop')
$destino = Join-Path $escritorio $nombre

Write-Host ''
Write-Host '  Empaquetando el proyecto...' -ForegroundColor Cyan
Write-Host ''

$items = Get-ChildItem -Path $root -Force | Where-Object { $excluir -notcontains $_.Name }

if (-not $items) {
  Write-Host '  [X] No se encontro nada para empaquetar.' -ForegroundColor Red
  exit 1
}

if (Test-Path -LiteralPath $destino) {
  Remove-Item -LiteralPath $destino -Force
}

Compress-Archive -Path $items.FullName -DestinationPath $destino -CompressionLevel Optimal

$info = Get-Item -LiteralPath $destino
$mb = [math]::Round($info.Length / 1MB, 2)

Write-Host '  ==================================================' -ForegroundColor Green
Write-Host '    COPIA DE SEGURIDAD LISTA' -ForegroundColor Green
Write-Host '  ==================================================' -ForegroundColor Green
Write-Host ''
Write-Host "  Archivo: $destino"
Write-Host "  Tamano : $mb MB"
Write-Host ''
Write-Host '  Contenido incluido:'
foreach ($i in $items) {
  Write-Host "    - $($i.Name)"
}
Write-Host ''
Write-Host '  NO incluido (se regenera solo):'
Write-Host '    - node_modules   (npm install)'
Write-Host '    - dist           (npm run build)'
Write-Host ''
Write-Host '  COMO RESTAURARLO EN OTRO PC:'
Write-Host '    1. Descomprime el ZIP'
Write-Host '    2. Abre una terminal en esa carpeta'
Write-Host '    3. npm install'
Write-Host '    4. npm run dev'
Write-Host ''
