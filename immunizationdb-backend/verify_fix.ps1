# Verification script to test if Spring Boot plugin is now resolvable

$logPath = "c:\Users\THE TECHNOLOGUE\Documents\INGE-4-ISI-2025-2026\SEMESTER-1\Mobile Development\Project\medConnect\Immunization-Management-Sytem-group5-project-\.cursor\debug.log"

function Write-DebugLog {
    param($sessionId, $runId, $hypothesisId, $location, $message, $data)
    $logEntry = @{
        sessionId = $sessionId
        runId = $runId
        hypothesisId = $hypothesisId
        location = $location
        message = $message
        timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        data = $data
    } | ConvertTo-Json -Compress
    Add-Content -Path $logPath -Value $logEntry
}

$sessionId = "debug-session"
$runId = "post-fix-verification"

# Test 1: Try to resolve the plugin using the prefix
Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "VERIFY" -location "verify_fix.ps1:test-plugin-prefix" -message "Testing spring-boot:help goal" -data @{}

try {
    $result = & mvn spring-boot:help -q 2>&1
    $exitCode = $LASTEXITCODE
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "VERIFY" -location "verify_fix.ps1:plugin-prefix-result" -message "Plugin prefix test result" -data @{exitCode=$exitCode; success=($exitCode -eq 0); output=$result}
    
    if ($exitCode -eq 0) {
        Write-Host "SUCCESS: Spring Boot plugin is now resolvable!" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Plugin still not resolvable. Error:" -ForegroundColor Red
        Write-Host $result
    }
} catch {
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "VERIFY" -location "verify_fix.ps1:plugin-prefix-exception" -message "Exception testing plugin prefix" -data @{error=$_.Exception.Message}
    Write-Host "Exception occurred: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check if plugin is in effective POM
Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "VERIFY" -location "verify_fix.ps1:check-effective-pom" -message "Checking plugin in effective POM" -data @{}

try {
    $effectivePom = & mvn help:effective-pom -q 2>&1 | Out-String
    if ($effectivePom -match "spring-boot-maven-plugin") {
        $versionMatch = if ($effectivePom -match "spring-boot-maven-plugin.*?<version>([^<]+)</version>") { $matches[1] } else { "not found" }
        Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "VERIFY" -location "verify_fix.ps1:effective-pom-result" -message "Plugin found in effective POM" -data @{found=$true; version=$versionMatch}
        Write-Host "Plugin found in effective POM with version: $versionMatch" -ForegroundColor Green
    } else {
        Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "VERIFY" -location "verify_fix.ps1:effective-pom-result" -message "Plugin NOT found in effective POM" -data @{found=$false}
        Write-Host "WARNING: Plugin not found in effective POM" -ForegroundColor Yellow
    }
} catch {
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "VERIFY" -location "verify_fix.ps1:effective-pom-exception" -message "Exception checking effective POM" -data @{error=$_.Exception.Message}
}

Write-Host "`nVerification complete. Check debug.log for detailed results."

