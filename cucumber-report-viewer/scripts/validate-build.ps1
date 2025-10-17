#!/usr/bin/env pwsh

Write-Host "Validating build output..." -ForegroundColor Cyan

$DistDir = Join-Path $PSScriptRoot ".." "dist"
$RequiredFiles = @(
    "index.html",
    "manifest.json",
    "img/icons/favicon-16x16.png",
    "img/icons/favicon-32x32.png",
    "img/icons/apple-touch-icon.png"
)

$AllValid = $true

# Check if dist directory exists
if (-not (Test-Path $DistDir)) {
    Write-Host "ERROR: dist directory does not exist" -ForegroundColor Red
    exit 1
}

# Check required files
foreach ($file in $RequiredFiles) {
    $filePath = Join-Path $DistDir $file
    if (-not (Test-Path $filePath)) {
        Write-Host "ERROR: Missing required file: $file" -ForegroundColor Red
        $AllValid = $false
    } else {
        Write-Host "OK: Found: $file" -ForegroundColor Green
    }
}

# Validate manifest.json if it exists
$ManifestPath = Join-Path $DistDir "manifest.json"
if (Test-Path $ManifestPath) {
    try {
        $manifest = Get-Content $ManifestPath | ConvertFrom-Json
        
        # Check required manifest fields
        $RequiredFields = @("name", "short_name", "start_url", "display", "icons")
        foreach ($field in $RequiredFields) {
            if (-not $manifest.$field) {
                Write-Host "ERROR: Missing manifest field: $field" -ForegroundColor Red
                $AllValid = $false
            }
        }
        
        # Check if start_url is correct for GitHub Pages
        if ($manifest.start_url -and $manifest.start_url -notlike "*TestResults*") {
            Write-Host "ERROR: Incorrect start_url in manifest: $($manifest.start_url)" -ForegroundColor Red
            $AllValid = $false
        }
        
        Write-Host "OK: manifest.json is valid" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Invalid manifest.json: $($_.Exception.Message)" -ForegroundColor Red
        $AllValid = $false
    }
}

# Check for CSS and JS bundles
$CssFiles = Get-ChildItem -Path $DistDir -Recurse -Filter "*.css" -File
$JsFiles = Get-ChildItem -Path $DistDir -Recurse -Filter "*.js" -File | Where-Object { $_.Name -notlike "*service-worker*" }

if ($CssFiles.Count -eq 0) {
    Write-Host "ERROR: No CSS bundles found" -ForegroundColor Red
    $AllValid = $false
} else {
    Write-Host "OK: Found $($CssFiles.Count) CSS bundle(s): $($CssFiles.Name -join ', ')" -ForegroundColor Green
}

if ($JsFiles.Count -eq 0) {
    Write-Host "ERROR: No JS bundles found" -ForegroundColor Red
    $AllValid = $false
} else {
    Write-Host "OK: Found $($JsFiles.Count) JS bundle(s): $($JsFiles.Name -join ', ')" -ForegroundColor Green
}

if ($AllValid) {
    Write-Host "Build validation passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Build validation failed!" -ForegroundColor Red
    exit 1
}