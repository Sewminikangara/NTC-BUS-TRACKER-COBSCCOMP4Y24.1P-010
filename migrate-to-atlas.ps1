########################################
# Data Migration Script - Local MongoDB to Atlas
########################################

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Data Migration to MongoDB Atlas" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# MongoDB Atlas Connection String (REPLACE WITH YOUR ACTUAL CONNECTION STRING)
$ATLAS_URI = Read-Host "Enter your MongoDB Atlas connection string"

if ([string]::IsNullOrWhiteSpace($ATLAS_URI)) {
    Write-Host "❌ Connection string cannot be empty!" -ForegroundColor Red
    exit 1
}

Write-Host "`nConnection string received. Starting migration...`n" -ForegroundColor Green

# Collections to migrate
$collections = @("routes", "buses", "trips", "locationupdates", "operators", "users")

# Create exports directory
$exportDir = ".\exports\atlas-migration"
if (-not (Test-Path $exportDir)) {
    New-Item -ItemType Directory -Path $exportDir -Force | Out-Null
    Write-Host "✅ Created export directory: $exportDir" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STEP 1: Exporting from Local MongoDB" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($collection in $collections) {
    Write-Host "Exporting $collection..." -ForegroundColor Yellow
    
    $outputFile = "$exportDir\$collection.json"
    
    try {
        $result = mongoexport --db=ntc-bus-tracker --collection=$collection --out=$outputFile --jsonArray 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $count = (Get-Content $outputFile | ConvertFrom-Json).Count
            Write-Host "   ✅ Exported $count documents from $collection" -ForegroundColor Green
        }
        else {
            Write-Host "   ⚠️  Warning: $result" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "   ❌ Error exporting $collection : $_" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STEP 2: Importing to MongoDB Atlas" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($collection in $collections) {
    $inputFile = "$exportDir\$collection.json"
    
    if (Test-Path $inputFile) {
        Write-Host "Importing $collection..." -ForegroundColor Yellow
        
        try {
            $result = mongoimport --uri="$ATLAS_URI" --collection=$collection --file=$inputFile --jsonArray --drop 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Successfully imported $collection to Atlas" -ForegroundColor Green
            }
            else {
                Write-Host "   ⚠️  Warning: $result" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "   ❌ Error importing $collection : $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "   ⚠️  Skipping $collection (no export file found)" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Migration Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✅ Migration completed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Verify data in MongoDB Atlas dashboard" -ForegroundColor White
Write-Host "2. Test connection from your app with Atlas URI" -ForegroundColor White
Write-Host "3. Deploy to Render with Atlas connection string`n" -ForegroundColor White
