$ErrorActionPreference = 'Stop'

# Navigate to Keeper folder
$KeeperDir = $PSScriptRoot

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "        STARTING WINDMILL KEEPER NODE ON YOUR MACHINE           " -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Yellow

# 1. Setup .env file
$EnvFile = Join-Path $KeeperDir ".env"
$ExampleEnvFile = Join-Path $KeeperDir ".env.example"

if (-not (Test-Path $EnvFile)) {
    Write-Host "[1/3] Creating .env file from .env.example..." -ForegroundColor Cyan
    Copy-Item $ExampleEnvFile $EnvFile
    Write-Host "✔ Created $EnvFile" -ForegroundColor Green
} else {
    Write-Host "[1/3] Found existing .env file." -ForegroundColor Green
}

# 2. Setup Dependencies
$NodeModules = Join-Path $KeeperDir "node_modules"
if (-not (Test-Path $NodeModules)) {
    Write-Host "[2/3] Installing keeper dependencies..." -ForegroundColor Cyan
    Push-Location $KeeperDir
    npm install
    Pop-Location
    Write-Host "✔ Dependencies installed successfully." -ForegroundColor Green
} else {
    Write-Host "[2/3] Dependencies already installed." -ForegroundColor Green
}

# 3. Check config variables
$EnvContent = Get-Content $EnvFile
$HasPk = $EnvContent | Select-String -Pattern "PRIVATE_KEY=0x"
$HasContract = $EnvContent | Select-String -Pattern "CONTRACT_ADDRESS=0x"

if (-not $HasPk -or -not $HasContract) {
    Write-Host "[3/3] CONFIGURATION REQUIREMENT ALERT:" -ForegroundColor Red
    Write-Host "Please edit this file: $EnvFile" -ForegroundColor Yellow
    Write-Host "Ensure the following values are set:" -ForegroundColor Yellow
    Write-Host "  - RPC_URL= (E.g. your Sepolia/Base RPC)" -ForegroundColor Yellow
    Write-Host "  - PRIVATE_KEY= (Your keeper wallet private key starting with 0x)" -ForegroundColor Yellow
    Write-Host "  - CONTRACT_ADDRESS= (The deployed WindmillExchange address)" -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Read-Host "Press ENTER to continue or exit and run again once configured"
} else {
    Write-Host "[3/3] Config variables are configured." -ForegroundColor Green
}

# 4. Launch Keeper
Write-Host "Starting the keeper runner loop..." -ForegroundColor Yellow
Push-Location $KeeperDir
node src/index.js
Pop-Location
