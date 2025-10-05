# Simple API Test Script

$nl = [Environment]::NewLine

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NTC Bus Tracker API Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"
$token = $null

# Test 1: Register/Login
Write-Host "${nl}1. User Authentication..." -ForegroundColor Yellow
$authBody = @{ name = "Test Admin"; email = "admin@ntc.lk"; password = "Admin@123"; role = "admin" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $authBody
    $global:token = $result.data.token
    Write-Host "   SUCCESS: Registered successfully" -ForegroundColor Green
}
catch {
    $loginBody = @{ email = "admin@ntc.lk"; password = "Admin@123" } | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
        $global:token = $result.data.token
        Write-Host "   SUCCESS: Logged in successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "   FAILED: Authentication failed" -ForegroundColor Red
        exit 1
    }
}

$headers = @{ "Authorization" = "Bearer $global:token"; "Content-Type" = "application/json" }

# Test 2: Create Route
Write-Host "${nl}2. Creating Route..." -ForegroundColor Yellow
$routeBody = @{ 
    routeNumber       = "001"
    name              = "Colombo-Kandy Express"
    origin            = "Colombo"
    destination       = "Kandy"
    distance          = 115
    estimatedDuration = 180
    stops             = @(
        @{ name = "Kadawatha"; order = 1; coordinates = @{ lat = 7.0081; lng = 79.9520 } },
        @{ name = "Gampaha"; order = 2; coordinates = @{ lat = 7.0916; lng = 79.9999 } },
        @{ name = "Kegalle"; order = 3; coordinates = @{ lat = 7.2523; lng = 80.3436 } },
        @{ name = "Peradeniya"; order = 4; coordinates = @{ lat = 7.2650; lng = 80.5975 } }
    )
    fare              = 350
    status            = "active"
} | ConvertTo-Json -Depth 5
try {
    $route = Invoke-RestMethod -Uri "$baseUrl/routes" -Method POST -Headers $headers -Body $routeBody
    Write-Host "   SUCCESS: Route created - $($route.data.routeNumber)" -ForegroundColor Green
    $global:routeId = $route.data._id
}
catch {
    # If route already exists, fetch it
    try {
        $routes = Invoke-RestMethod -Uri "$baseUrl/routes" -Method GET
        if ($routes.results -gt 0) {
            $global:routeId = $routes.data.routes[0]._id
            Write-Host "   INFO: Using existing route - $($routes.data.routes[0].routeNumber)" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Get All Routes
Write-Host "${nl}3. Getting All Routes..." -ForegroundColor Yellow
try {
    $routes = Invoke-RestMethod -Uri "$baseUrl/routes" -Method GET
    Write-Host "   SUCCESS: Retrieved $($routes.results) routes" -ForegroundColor Green
}
catch {
    Write-Host "   FAILED" -ForegroundColor Red
}

# Test 4: Create Operator
Write-Host "${nl}4. Creating Operator..." -ForegroundColor Yellow
$operatorBody = @{ 
    name               = "NTC Central"
    registrationNumber = "REG001"
    licenseNumber      = "LIC001"
    contactPerson      = @{
        name  = "John Doe"
        phone = "0771234567"
        email = "contact@ntc.lk"
    }
    licenseExpiry      = "2026-12-31"
    status             = "active"
} | ConvertTo-Json -Depth 3
try {
    $operator = Invoke-RestMethod -Uri "$baseUrl/operators" -Method POST -Headers $headers -Body $operatorBody
    Write-Host "   SUCCESS: Operator created - $($operator.data.name)" -ForegroundColor Green
    $global:operatorId = $operator.data._id
}
catch {
    # If operator already exists, fetch it
    try {
        $operators = Invoke-RestMethod -Uri "$baseUrl/operators" -Method GET -Headers $headers
        if ($operators.results -gt 0) {
            $global:operatorId = $operators.data.operators[0]._id
            Write-Host "   INFO: Using existing operator - $($operators.data.operators[0].name)" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Create Bus
Write-Host "${nl}5. Creating Bus..." -ForegroundColor Yellow
if ($global:routeId -and $global:operatorId) {
    $busBody = @{ 
        registrationNumber = "ABC-1234"
        make               = "Ashok Leyland"
        model              = "Viking"
        year               = 2023
        capacity           = 55
        operatorId         = $global:operatorId
        routeId            = $global:routeId
        status             = "active"
        features           = @("AC", "WiFi", "USB Charging")
    } | ConvertTo-Json -Depth 3
    try {
        $bus = Invoke-RestMethod -Uri "$baseUrl/buses" -Method POST -Headers $headers -Body $busBody
        Write-Host "   SUCCESS: Bus created - $($bus.data.registrationNumber)" -ForegroundColor Green
        $global:busId = $bus.data._id
    }
    catch {
        # If bus already exists, fetch it
        try {
            $buses = Invoke-RestMethod -Uri "$baseUrl/buses" -Method GET
            if ($buses.results -gt 0) {
                $global:busId = $buses.data.buses[0]._id
                Write-Host "   INFO: Using existing bus - $($buses.data.buses[0].registrationNumber)" -ForegroundColor Cyan
            }
        }
        catch {
            Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
else {
    Write-Host "   SKIPPED: Missing routeId or operatorId" -ForegroundColor Yellow
}

# Test 6: Create Trip
Write-Host "${nl}6. Creating Trip..." -ForegroundColor Yellow
if ($global:routeId -and $global:busId) {
    $scheduledDep = (Get-Date).AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss")
    $scheduledArr = (Get-Date).AddHours(5).ToString("yyyy-MM-ddTHH:mm:ss")
    $tripBody = @{ tripNumber = "TRIP001"; routeId = $global:routeId; busId = $global:busId; scheduledDepartureTime = $scheduledDep; scheduledArrivalTime = $scheduledArr; fare = 350 } | ConvertTo-Json
    try {
        $trip = Invoke-RestMethod -Uri "$baseUrl/trips" -Method POST -Headers $headers -Body $tripBody
        Write-Host "   SUCCESS: Trip created - $($trip.data.tripNumber)" -ForegroundColor Green
    }
    catch {
        Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "   SKIPPED: Missing routeId or busId" -ForegroundColor Yellow
}

# Test 7: Get All Trips with Pagination
Write-Host "${nl}7. Getting Trips with Pagination..." -ForegroundColor Yellow
try {
    $amp = [char]38
    $uri = "$baseUrl/trips?page=1${amp}limit=10"
    $trips = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "   SUCCESS: Retrieved $($trips.results) trips" -ForegroundColor Green
}
catch {
    Write-Host "   FAILED" -ForegroundColor Red
}

# Test 8: Get Bus Statistics
Write-Host "${nl}8. Getting Bus Statistics..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/buses/stats" -Method GET -Headers $headers
    Write-Host "   SUCCESS: Total buses = $($stats.data.totalBuses)" -ForegroundColor Green
}
catch {
    Write-Host "   FAILED" -ForegroundColor Red
}

Write-Host "${nl}========================================" -ForegroundColor Cyan
Write-Host "All Tests Completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
