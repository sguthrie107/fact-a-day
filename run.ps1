# run.ps1 — PowerShell launcher for fact-a-day research paper generator
# Usage:  .\run.ps1
# Requires: Node.js, GEMINI_API_KEY environment variable

$ErrorActionPreference = "Stop"

# Check Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed. Download it from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check for API key
if (-not $env:GEMINI_API_KEY) {
    Write-Host "ERROR: GEMINI_API_KEY is not set." -ForegroundColor Red
    Write-Host 'Set it with:  $env:GEMINI_API_KEY = "AIza..."' -ForegroundColor Yellow
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "$PSScriptRoot\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    Push-Location $PSScriptRoot
    npm install
    Pop-Location
}

# Run the generator
node "$PSScriptRoot\research-paper.js"
