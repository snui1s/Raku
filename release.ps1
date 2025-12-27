# Raku Release Script (PowerShell)
# Usage: .\release.ps1

Write-Host "Raku Release Script" -ForegroundColor Cyan

# 1. Load .env file and extract key/password
$privateKey = ""
$password = ""
if (Test-Path ".env") {
    Write-Host "Loading .env file..." -ForegroundColor Yellow
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'TAURI_SIGNING_PRIVATE_KEY="([^"]+)"') {
        $privateKey = $matches[1]
    }
    if ($envContent -match 'TAURI_SIGNING_PRIVATE_KEY_PASSWORD="([^"]*)"') {
        $password = $matches[1]
    }
}

if (-not $privateKey) {
    Write-Host "Error: TAURI_SIGNING_PRIVATE_KEY not found in .env file" -ForegroundColor Red
    exit 1
}
Write-Host "Private Key loaded: Yes" -ForegroundColor Green
Write-Host "Password loaded: Yes" -ForegroundColor Green

# 2. Read version from package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$version = $packageJson.version
Write-Host "Version: $version" -ForegroundColor Cyan

# 3. Sync version to tauri.conf.json
$tauriConfPath = "src-tauri\tauri.conf.json"
$tauriConf = Get-Content $tauriConfPath | ConvertFrom-Json
if ($tauriConf.version -ne $version) {
    Write-Host "Syncing tauri.conf.json version to $version" -ForegroundColor Yellow
    $tauriConf.version = $version
    $tauriConf | ConvertTo-Json -Depth 10 | Set-Content $tauriConfPath
}

# 4. Build (without relying on env vars for signing)
Write-Host "Building application..." -ForegroundColor Cyan
bun tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}

# 5. Sign the exe manually using the signer command
$exeName = "Raku_" + $version + "_x64-setup.exe"
$exePath = "src-tauri\target\release\bundle\nsis\" + $exeName

Write-Host "Signing $exeName..." -ForegroundColor Cyan
bun tauri signer sign --private-key $privateKey --password $password $exePath
if ($LASTEXITCODE -ne 0) {
    Write-Host "Signing failed" -ForegroundColor Red
    exit 1
}
Write-Host "Signed successfully!" -ForegroundColor Green

# 6. Check for signature file
$sigPath = $exePath + ".sig"
if (-not (Test-Path $sigPath)) {
    Write-Host "Signature file not found at: $sigPath" -ForegroundColor Red
    exit 1
}

# 7. Read signature and generate update.json
$signature = Get-Content $sigPath -Raw
$updateData = @{
    version = $version
    notes = "Release v" + $version
    pub_date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    platforms = @{
        "windows-x86_64" = @{
            signature = $signature.Trim()
            url = "https://github.com/snui1s/raku/releases/download/v" + $version + "/" + $exeName
        }
    }
}
$updateData | ConvertTo-Json -Depth 10 | Set-Content "update.json"
Write-Host "update.json generated!" -ForegroundColor Green

# 8. Done
Write-Host ""
Write-Host "---------------------------------------------------" -ForegroundColor Gray
Write-Host "DONE! Next steps:" -ForegroundColor Green
Write-Host "1. Push update.json to GitHub"
Write-Host "2. Create a Release on GitHub and upload the .exe and .sig files"
