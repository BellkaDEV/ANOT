@echo off
setlocal EnableExtensions
title ANOT - Backend + Expo

set "PROJECT=C:\Users\User\ANOT"
set "BACKEND=%PROJECT%\backend"
set "MOBILE=%PROJECT%\mobile"

if not exist "%BACKEND%\artisan" (
  echo ERRO: backend nao encontrado em %BACKEND%
  pause
  exit /b 1
)

if not exist "%MOBILE%\package.json" (
  echo ERRO: mobile nao encontrado em %MOBILE%
  pause
  exit /b 1
)

for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1 -ExpandProperty IPAddress); if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Ethernet' -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1 -ExpandProperty IPAddress) }; $ip"`) do set "LAN_IP=%%I"

if not defined LAN_IP (
  echo ERRO: nao encontrei uma interface Wi-Fi/Ethernet fisica ativa.
  pause
  exit /b 1
)

echo Configurando acesso local do ANOT no Firewall do Windows...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$rules = @('ANOT API 8000','ANOT Expo 8081'); $missing = $rules | Where-Object { -not (Get-NetFirewallRule -DisplayName $_ -ErrorAction SilentlyContinue) }; if ($missing) { $args = '-NoProfile -ExecutionPolicy Bypass -Command "New-NetFirewallRule -DisplayName ''ANOT API 8000'' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000 -Profile Private,Public; New-NetFirewallRule -DisplayName ''ANOT Expo 8081'' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081 -Profile Private,Public"'; Start-Process powershell -Verb RunAs -Wait -ArgumentList $args }"

echo.
echo Encerrando processos anteriores do ANOT...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$project = [regex]::Escape('%PROJECT%'); $processes = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -and $_.CommandLine -match $project -and (($_.CommandLine -match 'artisan serve') -or ($_.CommandLine -match 'expo start')) }; foreach ($process in $processes) { Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue }"

for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(8000,8081); Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique"`) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Get-CimInstance Win32_Process -Filter 'ProcessId=%%I' -ErrorAction SilentlyContinue; if ($p -and $p.CommandLine -and ($p.CommandLine -match 'C:\\Users\\User\\ANOT')) { Stop-Process -Id %%I -Force -ErrorAction SilentlyContinue }"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$envPath = '%MOBILE%\.env'; Set-Content -LiteralPath $envPath -Value ('EXPO_PUBLIC_API_URL=http://%LAN_IP%:8000') -Encoding ascii"

echo.
echo API:   http://%LAN_IP%:8000
echo Expo:  porta 8081 (Metro)
echo.

start "ANOT - Backend 8000" powershell -NoProfile -NoExit -Command "Set-Location -LiteralPath '%BACKEND%'; php artisan serve --host=0.0.0.0 --port=8000"

timeout /t 3 /nobreak >nul

echo Verificando disponibilidade da API antes de iniciar o Expo...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok = $false; 1..15 | ForEach-Object { try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://%LAN_IP%:8000/health' -TimeoutSec 2; if ($response.StatusCode -eq 200) { $ok = $true; break } } catch {}; Start-Sleep -Seconds 1 }; if (-not $ok) { Write-Error 'A API nao respondeu em http://%LAN_IP%:8000/health'; exit 1 }"
if errorlevel 1 (
  echo ERRO: o backend nao respondeu. O Expo nao sera iniciado.
  pause
  exit /b 1
)

start "ANOT - Expo 8081" powershell -NoProfile -NoExit -Command "Set-Location -LiteralPath '%MOBILE%'; npx.cmd expo start --lan --port 8081 --clear"

echo.
echo ANOT iniciado.
echo Para abrir a versao web, pressione W na janela do Expo.
echo Para usar celular, escaneie o QR Code exibido pelo Expo.
echo.
pause
