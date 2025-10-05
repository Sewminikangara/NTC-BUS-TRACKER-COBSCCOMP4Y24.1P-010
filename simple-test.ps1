# Simple API Test Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NTC Bus Tracker API Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"
$token = $null

# Test 1: Register/Login
Write-Host "`n1. User Authentication..." -ForegroundColor Yellow
$authBody = @{ name="Test Admin"; email="admin@ntc.lk"; password="Admin@123"; role="admin" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $authBody
    $token = $result.token
    Write-Host "   ✓ Registered successfully" -ForegroundColor Green
} catch {
    $loginBody = @{ email="admin@ntc.lk"; password="Admin@123" } | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $result.token
    Write-Host "   ✓ Logged in successfully" -ForegroundColor Green
}

$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

# Test 2: Create Route
Write-Host "`n2. Creating Route..." -ForegroundColor Yellow
$routeBody = @{ routeNumber="001"; origin="Colombo"; destination="Kandy"; distance=115; estimatedDuration=180; stops=@("Kadawatha","Gampaha"); fare=350 } | ConvertTo-Json
try {
    $route = Invoke-RestMethod -Uri "$baseUrl/routes" -Method POST -Headers $headers -Body $routeBody
    Write-Host "   ✓ Route created: $($route.data.routeNumber)" -ForegroundColor Green
    $routeId = $route.data._id
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get All Routes
Write-Host "`n3. Getting All Routes..." -ForegroundColor Yellow
try {
    $routes = Invoke-RestMethod -Uri "$baseUrl/routes" -Method GET
    Write-Host "   ✓ Retrieved $($routes.results) routes" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed" -ForegroundColor Red
}

# Test 4: Create Operator
Write-Host "`n4. Creating Operator..." -ForegroundColor Yellow
$operatorBody = @{ companyName="NTC Central"; registrationNumber="REG001"; licenseNumber="LIC001"; contactPerson="John Doe"; contactNumber="+94771234567"; email="contact@ntc.lk"; licenseExpiry="2026-12-31"; status="active" } | ConvertTo-Json
try {
    $operator = Invoke-RestMethod -Uri "$baseUrl/operators" -Method POST -Headers $headers -Body $operatorBody
    Write-Host "   ✓ Operator created: $($operator.data.companyName)" -ForegroundColor Green
    $operatorId = $operator.data._id
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Create Bus
Write-Host "`n5. Creating Bus..." -ForegroundColor Yellow
$busBody = @{ registrationNumber="ABC-1234"; busType="luxury"; capacity=55; operatorId=$operatorId; routeId=$routeId; status="active"; features=@("AC","WiFi") } | ConvertTo-Json
try {
    $bus = Invoke-RestMethod -Uri "$baseUrl/buses" -Method POST -Headers $headers -Body $busBody
    Write-Host "   ✓ Bus created: $($bus.data.registrationNumber)" -ForegroundColor Green
    $busId = $bus.data._id
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Create Trip
Write-Host "`n6. Creating Trip..." -ForegroundColor Yellow
$scheduledDep = (Get-Date).AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss")
$scheduledArr = (Get-Date).AddHours(5).ToString("yyyy-MM-ddTHH:mm:ss")
$tripBody = @{ tripNumber="TRIP001"; routeId=$routeId; busId=$busId; scheduledDeparture=$scheduledDep; scheduledArrival=$scheduledArr; status="scheduled"; fare=350 } | ConvertTo-Json
try {
    $trip = Invoke-RestMethod -Uri "$baseUrl/trips" -Method POST -Headers $headers -Body $tripBody
    Write-Host "   ✓ Trip created: $($trip.data.tripNumber)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Get All Trips with Pagination
Write-Host "`n7. Getting Trips with Pagination..." -ForegroundColor Yellow
try {
    $uri = "$baseUrl/trips" + "?page=1" + [char]38 + "limit=10"
    $trips = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "   ✓ Retrieved $($trips.results) trips (Page $($trips.pagination.page))" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed" -ForegroundColor Red
}

# Test 8: Get Bus Statistics
Write-Host "`n8. Getting Bus Statistics..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/buses/stats" -Method GET -Headers $headers
    Write-Host "   ✓ Total buses: $($stats.data.totalBuses)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All Tests Completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
