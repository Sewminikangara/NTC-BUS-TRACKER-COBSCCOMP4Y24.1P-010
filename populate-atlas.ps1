# Populate MongoDB Atlas with Simulation Data
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MongoDB Atlas Data Population" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Atlas connection string
$ATLAS_URI = "mongodb+srv://ntc-admin:rB169XhIAcDQj1Jf@ntc-bus-tracker-cluster.k53xc9c.mongodb.net/ntc-bus-tracker?retryWrites=true&w=majority"

Write-Host "Connection configured for Atlas cluster" -ForegroundColor Green
Write-Host "Database: ntc-bus-tracker`n" -ForegroundColor Gray

# Create .env content
$envContent = @"
NODE_ENV=production
PORT=3000
MONGODB_URI=$ATLAS_URI
JWT_SECRET=ntc-bus-tracker-super-secret-jwt-key-production-2024
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=*
LOG_LEVEL=info
API_VERSION=v1
"@

# Write .env file
$envContent | Out-File -FilePath ".env" -Encoding ASCII -Force
Write-Host ".env file updated with Atlas connection`n" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Generating Simulation Data on Atlas" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Run data generation
node .\scripts\generateSimulationData.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "SUCCESS - Atlas Database Populated!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "Data created:" -ForegroundColor White
    Write-Host "  - 6 Bus Routes" -ForegroundColor Cyan
    Write-Host "  - 27 Buses" -ForegroundColor Cyan
    Write-Host "  - 5 Operators" -ForegroundColor Cyan
    Write-Host "  - 210 Trips" -ForegroundColor Cyan
    Write-Host "  - Location Updates" -ForegroundColor Cyan
    
    Write-Host "`nNext: Deploy to Render`n" -ForegroundColor Yellow
}
else {
    Write-Host "`nError generating data. Check messages above.`n" -ForegroundColor Red
}
