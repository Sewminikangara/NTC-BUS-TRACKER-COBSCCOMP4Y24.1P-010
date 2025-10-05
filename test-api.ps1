# Test API Endpoints Script
# This script tests all the core API endpoints

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "NTC Bus Tracker API Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api"

# Test 1: Register Admin User
Write-Host "1. Testing User Registration..." -ForegroundColor Yellow
try {
    $registerBody = @{
        name     = "Test Admin"
        email    = "admin@ntc.lk"
        password = "Admin@123"
        role     = "admin"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $registerBody
    Write-Host "✓ User registered successfully" -ForegroundColor Green
    $token = $registerResponse.token
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
}
catch {
    Write-Host "✗ Registration failed, trying login..." -ForegroundColor Yellow
    
    # Try login instead
    $loginBody = @{
        email    = "admin@ntc.lk"
        password = "Admin@123"
    } | ConvertTo-Json

    try {
        $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
        $token = $loginResponse.token
        Write-Host "✓ Logged in successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Login also failed - please check server is running" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Test 2: Create Route
Write-Host "2. Testing Route Creation..." -ForegroundColor Yellow
try {
    $routeBody = @{
        routeNumber       = "001"
        origin            = "Colombo"
        destination       = "Kandy"
        distance          = 115
        estimatedDuration = 180
        stops             = @("Kadawatha", "Gampaha", "Ambepussa", "Kegalle", "Mawanella", "Peradeniya")
        fare              = 350
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json"
    }

    $routeResponse = Invoke-RestMethod -Uri "$baseUrl/routes" -Method POST -Headers $headers -Body $routeBody
    Write-Host "✓ Route created successfully" -ForegroundColor Green
    Write-Host "  Route: $($routeResponse.data.routeNumber) - $($routeResponse.data.origin) to $($routeResponse.data.destination)" -ForegroundColor Gray
    $routeId = $routeResponse.data._id
}
catch {
    Write-Host "✗ Route creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Get All Routes
Write-Host "3. Testing Get All Routes..." -ForegroundColor Yellow
try {
    $routesResponse = Invoke-RestMethod -Uri "$baseUrl/routes" -Method GET
    Write-Host "✓ Retrieved routes successfully" -ForegroundColor Green
    Write-Host "  Total routes: $($routesResponse.results)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Get routes failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Create Operator
Write-Host "4. Testing Operator Creation..." -ForegroundColor Yellow
try {
    $operatorBody = @{
        companyName        = "NTC Central"
        registrationNumber = "REG001"
        licenseNumber      = "LIC001"
        contactPerson      = "John Doe"
        contactNumber      = "+94771234567"
        email              = "contact@ntccentral.lk"
        licenseExpiry      = (Get-Date).AddYears(2).ToString("yyyy-MM-dd")
        status             = "active"
    } | ConvertTo-Json

    $operatorResponse = Invoke-RestMethod -Uri "$baseUrl/operators" -Method POST -Headers $headers -Body $operatorBody
    Write-Host "✓ Operator created successfully" -ForegroundColor Green
    Write-Host "  Company: $($operatorResponse.data.companyName)" -ForegroundColor Gray
    $operatorId = $operatorResponse.data._id
}
catch {
    Write-Host "✗ Operator creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Create Bus
Write-Host "5. Testing Bus Creation..." -ForegroundColor Yellow
try {
    $busBody = @{
        registrationNumber = "ABC-1234"
        busType            = "luxury"
        capacity           = 55
        operatorId         = $operatorId
        routeId            = $routeId
        status             = "active"
        features           = @("AC", "WiFi", "USB Charging")
    } | ConvertTo-Json

    $busResponse = Invoke-RestMethod -Uri "$baseUrl/buses" -Method POST -Headers $headers -Body $busBody
    Write-Host "✓ Bus created successfully" -ForegroundColor Green
    Write-Host "  Bus: $($busResponse.data.registrationNumber) - $($busResponse.data.busType)" -ForegroundColor Gray
    $busId = $busResponse.data._id
}
catch {
    Write-Host "✗ Bus creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 6: Create Trip
Write-Host "6. Testing Trip Creation..." -ForegroundColor Yellow
try {
    $tripBody = @{
        tripNumber         = "TRIP001"
        routeId            = $routeId
        busId              = $busId
        scheduledDeparture = (Get-Date).AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss")
        scheduledArrival   = (Get-Date).AddHours(5).ToString("yyyy-MM-ddTHH:mm:ss")
        status             = "scheduled"
        fare               = 350
    } | ConvertTo-Json

    $tripResponse = Invoke-RestMethod -Uri "$baseUrl/trips" -Method POST -Headers $headers -Body $tripBody
    Write-Host "✓ Trip created successfully" -ForegroundColor Green
    Write-Host "  Trip: $($tripResponse.data.tripNumber) - Status: $($tripResponse.data.status)" -ForegroundColor Gray
    $tripId = $tripResponse.data._id
}
catch {
    Write-Host "✗ Trip creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 7: Get All Trips with Pagination
Write-Host "7. Testing Trip Listing with Pagination..." -ForegroundColor Yellow
try {
    $uri = "$baseUrl/trips" + "?page=1" + [char]38 + "limit=10"
    $tripsResponse = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "✓ Retrieved trips successfully" -ForegroundColor Green
    Write-Host "  Total trips: $($tripsResponse.results)" -ForegroundColor Gray
    Write-Host "  Page: $($tripsResponse.pagination.page) of $($tripsResponse.pagination.pages)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Get trips failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 8: Search Routes
Write-Host "8. Testing Route Search..." -ForegroundColor Yellow
try {
    $searchUri = "$baseUrl/routes/search" + "?origin=Colombo" + [char]38 + "destination=Kandy"
    $searchResponse = Invoke-RestMethod -Uri $searchUri -Method GET
    Write-Host "✓ Route search successful" -ForegroundColor Green
    Write-Host "  Found routes: $($searchResponse.results)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Route search failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 9: Get Bus Statistics
Write-Host "9. Testing Bus Statistics..." -ForegroundColor Yellow
try {
    $statsResponse = Invoke-RestMethod -Uri "$baseUrl/buses/stats" -Method GET -Headers $headers
    Write-Host "✓ Retrieved statistics successfully" -ForegroundColor Green
    Write-Host "  Total buses: $($statsResponse.data.totalBuses)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Get statistics failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "API Testing Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
