########################################
# NTC Bus Tracker - Production Test Script
# Tests API deployed on cloud hosting
########################################

param(
    [string]$BaseUrl = "https://your-app.onrender.com"
)

$apiUrl = "$BaseUrl/api"
$testsPassed = 0
$testsFailed = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Production API Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Gray

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET"
    )
    
    try {
        Write-Host "Testing: $Name..." -ForegroundColor Yellow -NoNewline
        $response = Invoke-WebRequest -Uri $Url -Method $Method -UseBasicParsing -TimeoutSec 30
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  PASS ($($response.StatusCode))" -ForegroundColor Green
            $script:testsPassed++
            return $true
        }
        else {
            Write-Host "   Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
            $script:testsFailed++
            return $false
        }
    }
    catch {
        Write-Host "  FAIL" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

# Test 1: Health Check
Write-Host "`n1. Health Check" -ForegroundColor Cyan
Test-Endpoint -Name "Health Endpoint" -Url "$BaseUrl/health"

# Test 2: API Root
Write-Host "`n2. API Root" -ForegroundColor Cyan
Test-Endpoint -Name "API Root" -Url "$BaseUrl/"

# Test 3: Routes
Write-Host "`n3. Routes API" -ForegroundColor Cyan
$routesWorking = Test-Endpoint -Name "Get All Routes" -Url "$apiUrl/routes"
if ($routesWorking) {
    try {
        $response = Invoke-WebRequest -Uri "$apiUrl/routes" -UseBasicParsing
        $json = $response.Content | ConvertFrom-Json
        Write-Host "   Found $($json.results) routes" -ForegroundColor Gray
        if ($json._links) {
            Write-Host "    HATEOAS links present" -ForegroundColor Green
        }
    }
    catch { }
}

# Test 4: Buses
Write-Host "`n4. Buses API" -ForegroundColor Cyan
$busesWorking = Test-Endpoint -Name "Get All Buses" -Url "$apiUrl/buses"
if ($busesWorking) {
    try {
        $response = Invoke-WebRequest -Uri "$apiUrl/buses" -UseBasicParsing
        $json = $response.Content | ConvertFrom-Json
        Write-Host "   Found $($json.results) buses" -ForegroundColor Gray
    }
    catch { }
}

# Test 5: Trips
Write-Host "`n5. Trips API" -ForegroundColor Cyan
$tripsWorking = Test-Endpoint -Name "Get All Trips" -Url "$apiUrl/trips"
if ($tripsWorking) {
    try {
        $response = Invoke-WebRequest -Uri "$apiUrl/trips" -UseBasicParsing
        $json = $response.Content | ConvertFrom-Json
        Write-Host "   Found $($json.results) trips" -ForegroundColor Gray
    }
    catch { }
}

# Test 6: Operators
Write-Host "`n6. Operators API" -ForegroundColor Cyan
$operatorsWorking = Test-Endpoint -Name "Get All Operators" -Url "$apiUrl/operators"
if ($operatorsWorking) {
    try {
        $response = Invoke-WebRequest -Uri "$apiUrl/operators" -UseBasicParsing
        $json = $response.Content | ConvertFrom-Json
        Write-Host "   Found $($json.results) operators" -ForegroundColor Gray
    }
    catch { }
}

# Test 7: HTTPS/SSL
Write-Host "`n7. Security" -ForegroundColor Cyan
if ($BaseUrl -like "https://*") {
    Write-Host "    HTTPS enabled" -ForegroundColor Green
    $testsPassed++
}
else {
    Write-Host "     Using HTTP (not secure)" -ForegroundColor Yellow
}

# Test 8: Response Headers
Write-Host "`n8. Response Headers" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$apiUrl/routes" -UseBasicParsing
    $hasETag = $response.Headers.ContainsKey('ETag')
    $hasLastModified = $response.Headers.ContainsKey('Last-Modified')
    $hasCacheControl = $response.Headers.ContainsKey('Cache-Control')
    
    if ($hasETag) {
        Write-Host "    ETag header present" -ForegroundColor Green
    }
    if ($hasLastModified) {
        Write-Host "    Last-Modified header present" -ForegroundColor Green
    }
    if ($hasCacheControl) {
        Write-Host "    Cache-Control header present" -ForegroundColor Green
    }
    
    if ($hasETag -and $hasLastModified) {
        $testsPassed++
    }
    else {
        $testsFailed++
    }
}
catch {
    Write-Host "    Could not check headers" -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($testsPassed + $testsFailed)" -ForegroundColor White
Write-Host " Passed: $testsPassed" -ForegroundColor Green
Write-Host " Failed: $testsFailed" -ForegroundColor Red

$passRate = if (($testsPassed + $testsFailed) -gt 0) {
    [math]::Round(($testsPassed / ($testsPassed + $testsFailed)) * 100, 1)
}
else { 0 }

Write-Host "`nPass Rate: $passRate%" -ForegroundColor $(
    if ($passRate -ge 80) { 'Green' } 
    elseif ($passRate -ge 60) { 'Yellow' } 
    else { 'Red' }
)

if ($testsFailed -eq 0) {
    Write-Host "`n All tests passed! Production API is working perfectly!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "`n  Some tests failed. Please check the errors above." -ForegroundColor Yellow
    exit 1
}
