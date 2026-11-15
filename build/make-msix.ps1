# Crea il pacchetto MSIX per il Microsoft Store (non firmato: lo Store lo firma).
# Uso: npm run build:exe   (compila timer.exe senza installer)
#      powershell -File build\make-msix.ps1 -IdentityName "XXXX.SitlessTimer" -Publisher "CN=XXXXXXXX-..." -PublisherDisplayName "Nome editore"
# I tre valori vengono da Partner Center > Gestione prodotto > Identità prodotto.
param(
  [string]$IdentityName = "PLACEHOLDER.SitlessTimer",
  [string]$Publisher = "CN=PLACEHOLDER",
  [string]$PublisherDisplayName = "Gabriele Melendugno"
)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$exe = Join-Path $root "src-tauri\target\release\timer.exe"
if (-not (Test-Path $exe)) { throw "timer.exe non trovato: esegui prima 'npm run build:exe'" }

$version = (Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json).version + ".0"
$stage = Join-Path $root "release\msix-stage"
$out = Join-Path $root "release"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force "$stage\Assets" | Out-Null

Copy-Item $exe $stage
Copy-Item "$PSScriptRoot\appx\*.png" "$stage\Assets"
(Get-Content "$PSScriptRoot\appx\AppxManifest.template.xml" -Raw) `
  -replace "@@IDENTITY_NAME@@", $IdentityName `
  -replace "@@PUBLISHER@@", $Publisher `
  -replace "@@PUBLISHER_DISPLAY_NAME@@", $PublisherDisplayName `
  -replace "@@VERSION@@", $version |
  Set-Content "$stage\AppxManifest.xml" -Encoding utf8

$sdk = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin" -Directory |
  Where-Object { Test-Path "$($_.FullName)\x64\makeappx.exe" } | Sort-Object Name -Descending | Select-Object -First 1
if (-not $sdk) { throw "Windows SDK (makeappx.exe) non trovato" }

$pkg = Join-Path $out "SitlessTimer-$version-x64.msix"
& "$($sdk.FullName)\x64\makeappx.exe" pack /d $stage /p $pkg /o
if ($LASTEXITCODE -ne 0) { throw "makeappx fallito" }
Write-Host "Creato: $pkg"
