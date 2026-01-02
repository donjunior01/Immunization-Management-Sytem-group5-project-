# Maven Diagnostic Script
# This script captures Maven configuration and plugin resolution information

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
$runId = "maven-diagnosis"

# Hypothesis A: Plugin version missing - check if version is in effective POM
Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "A" -location "diagnose_maven.ps1:check-plugin-version" -message "Checking Spring Boot plugin version in effective POM" -data @{}

try {
    $effectivePom = & mvn help:effective-pom -q 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pluginVersion = Select-String -InputObject $effectivePom -Pattern "spring-boot-maven-plugin" -Context 0,5 | Select-Object -First 1
        Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "A" -location "diagnose_maven.ps1:plugin-version-result" -message "Plugin found in effective POM" -data @{found=$true; context=$pluginVersion.ToString()}
    } else {
        Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "A" -location "diagnose_maven.ps1:effective-pom-failed" -message "Failed to generate effective POM" -data @{error=$effectivePom}
    }
} catch {
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "A" -location "diagnose_maven.ps1:effective-pom-exception" -message "Exception generating effective POM" -data @{error=$_.Exception.Message}
}

# Hypothesis B: Parent POM resolution issue - check if parent can be resolved
Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "B" -location "diagnose_maven.ps1:check-parent-pom" -message "Checking if Spring Boot parent POM can be resolved" -data @{}

try {
    $dependencyTree = & mvn dependency:tree -Dincludes=org.springframework.boot:spring-boot-starter-parent -q 2>&1
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "B" -location "diagnose_maven.ps1:parent-pom-result" -message "Parent POM resolution check" -data @{exitCode=$LASTEXITCODE; output=$dependencyTree}
} catch {
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "B" -location "diagnose_maven.ps1:parent-pom-exception" -message "Exception checking parent POM" -data @{error=$_.Exception.Message}
}

# Hypothesis C: Maven repository access issue - check repository connectivity
Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "C" -location "diagnose_maven.ps1:check-repository-access" -message "Checking Maven repository access" -data @{}

try {
    $settings = & mvn help:effective-settings -q 2>&1
    $repositories = Select-String -InputObject $settings -Pattern "repository" -Context 2,2
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "C" -location "diagnose_maven.ps1:repository-config" -message "Maven repository configuration" -data @{repositories=$repositories.ToString()}
} catch {
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "C" -location "diagnose_maven.ps1:repository-exception" -message "Exception checking repository config" -data @{error=$_.Exception.Message}
}

# Hypothesis D: Plugin groupId not in pluginGroups - check Maven settings
Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "D" -location "diagnose_maven.ps1:check-plugin-groups" -message "Checking Maven pluginGroups configuration" -data @{}

try {
    $settings = & mvn help:effective-settings -q 2>&1
    $pluginGroups = Select-String -InputObject $settings -Pattern "pluginGroups" -Context 0,10
    $hasSpringBootGroup = $pluginGroups -match "org.springframework.boot"
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "D" -location "diagnose_maven.ps1:plugin-groups-result" -message "Plugin groups check" -data @{hasSpringBootGroup=$hasSpringBootGroup; pluginGroups=$pluginGroups.ToString()}
} catch {
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "D" -location "diagnose_maven.ps1:plugin-groups-exception" -message "Exception checking plugin groups" -data @{error=$_.Exception.Message}
}

# Hypothesis E: Working directory issue - verify we're in the right directory
Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "E" -location "diagnose_maven.ps1:check-working-directory" -message "Checking working directory and pom.xml location" -data @{}

$currentDir = Get-Location
$pomExists = Test-Path "pom.xml"
Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "E" -location "diagnose_maven.ps1:directory-result" -message "Working directory check" -data @{currentDirectory=$currentDir.Path; pomExists=$pomExists}

# Check Maven version
Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "E" -location "diagnose_maven.ps1:check-maven-version" -message "Checking Maven version" -data @{}

try {
    $mavenVersion = & mvn -version 2>&1
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "E" -location "diagnose_maven.ps1:maven-version-result" -message "Maven version info" -data @{version=$mavenVersion}
} catch {
    Write-DebugLog -sessionId $sessionId -runId $runId -hypothesisId "E" -location "diagnose_maven.ps1:maven-version-exception" -message "Exception checking Maven version" -data @{error=$_.Exception.Message}
}

Write-Host "Diagnostic complete. Check debug.log for results."

