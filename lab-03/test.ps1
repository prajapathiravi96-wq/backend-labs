# test.ps1 - Automated Test Runner for Lab 3
# Starts lab-03 server, executes comprehensive tests across all endpoints, validates status codes & responses, and shuts down.

$PORT = 3002
$dir = $PSScriptRoot

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Lab 3 - REST API, Search, Filter & Validation Tests   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Ensure any existing test database is clean
if (Test-Path "$dir\books.db") {
    Remove-Item "$dir\books.db" -Force
}

# Start server as a background job
$serverJob = Start-Job -ScriptBlock {
    param($workingDir)
    Set-Location $workingDir
    node app.js
} -ArgumentList $dir

Start-Sleep -Seconds 4

# Run Node test suite
Set-Location $dir
node test-runner.js
$exitCode = $LASTEXITCODE

# Clean up server job
Stop-Job $serverJob
Remove-Job $serverJob

if ($exitCode -eq 0) {
    Write-Host "All tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Tests exited with code $exitCode" -ForegroundColor Red
}
exit $exitCode
