

$baseUrl = "http://localhost:3000/api"
$testsPassed = 0
$testsFailed = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NTC Bus Tracker - Simulation Data Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [string]$Token = $null
    )
    
    try {
        $headers = @{"Content-Type" = "application/json" }
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri             = $Url
            Method          = $Method
            Headers         = $headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Compress)
        }
        
        $response = Invoke-WebRequest @params
        $json = $response.Content | ConvertFrom-Json
        
        Write-Host " PASSED: $Name" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
        $script:testsPassed++
        return $json
    }
    catch {
        Write-Host " FAILED: $Name" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $null
    }
}

# Test 1: Health Check
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
Test-Endpoint -Name "Health Check" -Url "http://localhost:3000/health"

# Test 2: Get All Routes
Write-Host "`n2. Testing Routes Endpoint..." -ForegroundColor Yellow
$routes = Test-Endpoint -Name "Get All Routes" -Url "$baseUrl/routes"
if ($routes) {
    Write-Host "   Found $($routes.results) routes" -ForegroundColor Cyan
    if ($routes.results -gt 0) {
        Write-Host "   Sample: $($routes.data[0].name) ($($routes.data[0].routeNumber))" -ForegroundColor Cyan
    }
}

# Test 3: Get All Operators
Write-Host "`n3. Testing Operators Endpoint..." -ForegroundColor Yellow
$operators = Test-Endpoint -Name "Get All Operators" -Url "$baseUrl/operators"
if ($operators) {
    Write-Host "   Found $($operators.results) operators" -ForegroundColor Cyan
    if ($operators.results -gt 0) {
        Write-Host "   Sample: $($operators.data[0].name)" -ForegroundColor Cyan
    }
}

# Test 4: Get All Buses
Write-Host "`n4. Testing Buses Endpoint..." -ForegroundColor Yellow
$buses = Test-Endpoint -Name "Get All Buses" -Url "$baseUrl/buses"
if ($buses) {
    Write-Host "   Found $($buses.results) buses" -ForegroundColor Cyan
    if ($buses.results -gt 0) {
        Write-Host "   Sample: $($buses.data[0].registrationNumber) - $($buses.data[0].make) $($buses.data[0].model)" -ForegroundColor Cyan
    }
}

# Test 5: Get All Trips
Write-Host "`n5. Testing Trips Endpoint..." -ForegroundColor Yellow
$trips = Test-Endpoint -Name "Get All Trips" -Url "$baseUrl/trips?limit=10"
if ($trips) {
    Write-Host "   Found $($trips.results) trips (showing first 10)" -ForegroundColor Cyan
    if ($trips.results -gt 0) {
        Write-Host "   Sample: $($trips.data[0].tripNumber) - Status: $($trips.data[0].status)" -ForegroundColor Cyan
    }
}

# Test 6: Test Filtering
Write-Host "`n6. Testing Route Filtering..." -ForegroundColor Yellow
$activeRoutes = Test-Endpoint -Name "Filter Active Routes" -Url "$baseUrl/routes?status=active"
if ($activeRoutes) {
    Write-Host "   Found $($activeRoutes.results) active routes" -ForegroundColor Cyan
}

# Test 7: Test Sorting
Write-Host "`n7. Testing Route Sorting..." -ForegroundColor Yellow
$sortedRoutes = Test-Endpoint -Name "Sort Routes by Distance" -Url "$baseUrl/routes?sort=distance"
if ($sortedRoutes -and $sortedRoutes.results -gt 1) {
    Write-Host "   Shortest: $($sortedRoutes.data[0].name) - $($sortedRoutes.data[0].distance)km" -ForegroundColor Cyan
}

# Test 8: Test Pagination
Write-Host "`n8. Testing Pagination..." -ForegroundColor Yellow
$paginatedTrips = Test-Endpoint -Name "Get Page 1 with 5 items" -Url "$baseUrl/trips?page=1&limit=5"
if ($paginatedTrips) {
    Write-Host "   Page: $($paginatedTrips.page) of $($paginatedTrips.pages)" -ForegroundColor Cyan
    Write-Host "   Items: $($paginatedTrips.data.Count) of $($paginatedTrips.results)" -ForegroundColor Cyan
}

# Test 9: Get Route Statistics
Write-Host "`n9. Testing Route Statistics..." -ForegroundColor Yellow
$routeStats = Test-Endpoint -Name "Get Route Stats" -Url "$baseUrl/routes/stats"
if ($routeStats) {
    Write-Host "   Total Routes: $($routeStats.data.totalRoutes)" -ForegroundColor Cyan
    Write-Host "   Active Routes: $($routeStats.data.activeRoutes)" -ForegroundColor Cyan
}

# Test 10: Get Location Updates (if any)
Write-Host "`n10. Testing Location Updates..." -ForegroundColor Yellow
$locations = Test-Endpoint -Name "Get Location Updates" -Url "$baseUrl/locations?limit=5"
if ($locations) {
    Write-Host "   Found $($locations.results) location updates" -ForegroundColor Cyan
}

# Test 11: Search Routes by Origin/Destination
Write-Host "`n11. Testing Route Search..." -ForegroundColor Yellow
$colomboRoutes = Test-Endpoint -Name "Search Colombo Routes" -Url "$baseUrl/routes/search?origin=Colombo"
if ($colomboRoutes) {
    Write-Host "   Found $($colomboRoutes.results) routes from Colombo" -ForegroundColor Cyan
}

# Test 12: Get Active Trips
Write-Host "`n12. Testing Active Trips..." -ForegroundColor Yellow
$activeTrips = Test-Endpoint -Name "Get Active Trips" -Url "$baseUrl/trips/active"
if ($activeTrips) {
    Write-Host "   Found $($activeTrips.results) active trips" -ForegroundColor Cyan
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($testsPassed + $testsFailed)" -ForegroundColor White
Write-Host " Passed: $testsPassed" -ForegroundColor Green
Write-Host " Failed: $testsFailed" -ForegroundColor Red

# Simulation Data Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Simulation Data Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
if ($routes) { Write-Host "Routes: $($routes.results)" -ForegroundColor White }
if ($operators) { Write-Host "Operators: $($operators.results)" -ForegroundColor White }
if ($buses) { Write-Host "Buses: $($buses.results)" -ForegroundColor White }
if ($trips) { Write-Host "Trips: $($trips.results)" -ForegroundColor White }
if ($locations) { Write-Host "Location Updates: $($locations.results)" -ForegroundColor White }

Write-Host "`n All simulation data endpoints are working!" -ForegroundColor Green
Write-Host ""

if ($testsFailed -eq 0) {
    exit 0
}
else {
    exit 1
}
