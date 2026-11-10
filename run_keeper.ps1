$ErrorActionPreference = 'Stop'

# Navigate to Keeper folder
$KeeperDir = $PSScriptRoot

Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "        STARTING WINDMILL KEEPER NODE ON YOUR MACHINE           " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow

# 1. Setup .env file
$EnvFile = Join-Path $KeeperDir ".env"
$ExampleEnvFile = Join-Path $KeeperDir ".env.example"

if (-not (Test-Path $EnvFile)) {
    Write-Host "[1/3] Creating .env file from .env.example..." -ForegroundColor Cyan
    Copy-Item $ExampleEnvFile $EnvFile
    Write-Host "[OK] Created $EnvFile" -ForegroundColor Green
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
    Write-Host "[OK] Dependencies installed successfully." -ForegroundColor Green
} else {
    Write-Host "[2/3] Dependencies already installed." -ForegroundColor Green
}

# 3. Check config variables
$EnvContent = @(Get-Content $EnvFile)

function Get-EnvValue {
    param(
        [string]$Name,
        [string[]]$Lines
    )

    foreach ($Line in $Lines) {
        if ($Line -match "^\s*$Name\s*=\s*(.*)$") {
            return $Matches[1].Trim()
        }
    }

    return ""
}

$RpcUrl = Get-EnvValue -Name "RPC_URL" -Lines $EnvContent
$PrivateKey = Get-EnvValue -Name "PRIVATE_KEY" -Lines $EnvContent
$ContractAddress = Get-EnvValue -Name "CONTRACT_ADDRESS" -Lines $EnvContent

$ConfigErrors = @()

if ([string]::IsNullOrWhiteSpace($RpcUrl)) {
    $ConfigErrors += "RPC_URL is missing."
}

if ($PrivateKey -notmatch '^0x[0-9a-fA-F]{64}$') {
    $ConfigErrors += "PRIVATE_KEY must be 0x followed by exactly 64 hexadecimal characters."
}

if ([string]::IsNullOrWhiteSpace($ContractAddress)) {
    $ConfigErrors += "CONTRACT_ADDRESS is missing."
}

if ($ConfigErrors.Count -gt 0) {
    Write-Host "[3/3] Invalid keeper configuration:" -ForegroundColor Red
    foreach ($ConfigError in $ConfigErrors) {
        Write-Host "  - $ConfigError" -ForegroundColor Yellow
    }
    Write-Host "Edit $EnvFile and run the keeper again." -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Yellow
    exit 1
}

Write-Host "[3/3] Config variables are valid." -ForegroundColor Green

# 4. Launch Keeper
Write-Host "Starting the keeper runner loop..." -ForegroundColor Yellow
Push-Location $KeeperDir
node src/index.js
Pop-Location

