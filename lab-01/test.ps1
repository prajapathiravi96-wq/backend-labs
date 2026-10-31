# test.ps1 — Lab 1 self-validation script
# Usage: powershell -ExecutionPolicy Bypass -File test.ps1
# Starts the server, tests all routes, prints results, then stops the server.

$PORT = 3000
$BASE = "http://localhost:$PORT"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Lab 1 - Route Validation Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Start the server as a background job
$serverJob = Start-Job -ScriptBlock {
    Set-Location c:\backend-labs\lab-01
    node server.js
}
Start-Sleep -Seconds 2   # give server time to boot

$results = @()

function Test-Route {
    param (
        [string]$Method,
        [string]$Path,
        [int]$ExpectedStatus
    )
    $uri = "$using:BASE$Path"
    try {
        $response = Invoke-WebRequest -Uri $uri -Method $Method -ErrorAction Stop
        $status = $response.StatusCode
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
    }
    $pass = ($status -eq $ExpectedStatus)
    [PSCustomObject]@{
        Method         = $Method
        Path           = $Path
        ExpectedStatus = $ExpectedStatus
        ActualStatus   = $status
        Result         = if ($pass) { "PASS" } else { "FAIL" }
    }
}

$results += Test-Route -Method GET -Path "/"         -ExpectedStatus 200
$results += Test-Route -Method GET -Path "/about"    -ExpectedStatus 200
$results += Test-Route -Method GET -Path "/time"     -ExpectedStatus 200
$results += Test-Route -Method GET -Path "/notfound" -ExpectedStatus 404

# Stop the server
Stop-Job $serverJob
Remove-Job $serverJob

# Print table
Write-Host ""
Write-Host "Results:" -ForegroundColor Yellow
$results | Format-Table -AutoSize

$failCount = ($results | Where-Object { $_.Result -eq "FAIL" }).Count
if ($failCount -eq 0) {
    Write-Host "All routes passed!" -ForegroundColor Green
} else {
    Write-Host "$failCount route(s) failed." -ForegroundColor Red
    exit 1
}

