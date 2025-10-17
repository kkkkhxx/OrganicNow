# 🚀 Auto-Start Deployment Webhook
# สำหรับเริ่ม webhook server อัตโนมัติพร้อมกับ OrganicNow

param(
    [switch]$StartWebhook = $false
)

Write-Host "🚀 Starting OrganicNow with Auto-Deployment Support..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# ตั้งค่า environment variables
if (-not $env:DEPLOYMENT_WEBHOOK_TOKEN) {
    $env:DEPLOYMENT_WEBHOOK_TOKEN = "OrganicNow-Deploy-2024-Secret-Default"
    Write-Host "⚠️  Using default webhook token. Set DEPLOYMENT_WEBHOOK_TOKEN for production." -ForegroundColor Yellow
}

# เริ่ม OrganicNow development environment
Write-Host "🔧 Starting OrganicNow development environment..." -ForegroundColor Yellow
try {
    & ".\start_organicnow.ps1"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ OrganicNow started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start OrganicNow. Check the logs above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error starting OrganicNow: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# เริ่ม Deployment Webhook Server (ถ้าต้องการ)
if ($StartWebhook) {
    Write-Host ""
    Write-Host "🎯 Starting Deployment Webhook Server..." -ForegroundColor Cyan
    
    # เช็คว่า port 9000 ว่างไหม
    try {
        $portCheck = Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue
        if ($portCheck) {
            Write-Host "⚠️  Port 9000 is already in use. Stopping existing process..." -ForegroundColor Yellow
            $processes = Get-Process | Where-Object { 
                $_.ProcessName -eq "powershell" -and 
                $_.CommandLine -like "*deploy-webhook.ps1*" 
            } 2>$null
            
            if ($processes) {
                $processes | ForEach-Object { Stop-Process -Id $_.Id -Force }
                Start-Sleep -Seconds 3
            }
        }
    } catch {
        # Port check failed, probably means it's available
    }
    
    # เริ่ม webhook server ใน background
    $webhookJob = Start-Job -ScriptBlock {
        param($workingDir, $token)
        Set-Location $workingDir
        $env:DEPLOYMENT_WEBHOOK_TOKEN = $token
        & ".\deploy-webhook.ps1" -Port 9000
    } -ArgumentList $PWD, $env:DEPLOYMENT_WEBHOOK_TOKEN
    
    Start-Sleep -Seconds 2
    
    # เช็คว่า webhook server เริ่มแล้วหรือยัง
    try {
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:9000/health" -Method GET -TimeoutSec 5
        if ($healthCheck.status -eq "healthy") {
            Write-Host "✅ Deployment Webhook Server started successfully" -ForegroundColor Green
            Write-Host "   URL: http://localhost:9000" -ForegroundColor Gray
            Write-Host "   Health: http://localhost:9000/health" -ForegroundColor Gray
            Write-Host "   Deploy: POST http://localhost:9000/deploy" -ForegroundColor Gray
        }
    } catch {
        Write-Host "⚠️  Webhook server may be starting. Check manually with:" -ForegroundColor Yellow
        Write-Host "   curl http://localhost:9000/health" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8080/api" -ForegroundColor White
if ($StartWebhook) {
    Write-Host "   Webhook Server: http://localhost:9000" -ForegroundColor White
}
Write-Host ""
Write-Host "🔧 Next Steps for CI/CD:" -ForegroundColor Cyan
if (-not $StartWebhook) {
    Write-Host "   1. Start webhook server: .\start_with_webhook.ps1 -StartWebhook" -ForegroundColor Gray
} else {
    Write-Host "   1. ✅ Webhook server is running" -ForegroundColor Green
}
Write-Host "   2. Configure GitHub Secrets (see DEPLOYMENT_SETUP.md)" -ForegroundColor Gray
Write-Host "   3. Push to main branch to trigger CI/CD" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   - Setup Guide: DEPLOYMENT_SETUP.md" -ForegroundColor Gray
Write-Host "   - CI/CD Pipeline: .github/workflows/ci.yml" -ForegroundColor Gray
Write-Host ""

if ($StartWebhook) {
    Write-Host "🔄 Webhook Server Job ID: $($webhookJob.Id)" -ForegroundColor Yellow
    Write-Host "   To stop: Stop-Job $($webhookJob.Id); Remove-Job $($webhookJob.Id)" -ForegroundColor Gray
    Write-Host ""
    
    # แสดง webhook server logs ใน background
    Write-Host "📊 Webhook Server Logs (Ctrl+C to stop monitoring):" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Gray
    
    try {
        while ($true) {
            $jobOutput = Receive-Job -Job $webhookJob -Keep
            if ($jobOutput) {
                Write-Host $jobOutput -ForegroundColor Gray
            }
            Start-Sleep -Seconds 1
            
            # เช็คว่า job ยังทำงานอยู่ไหม
            if ($webhookJob.State -ne "Running") {
                Write-Host "❌ Webhook server stopped unexpectedly" -ForegroundColor Red
                break
            }
        }
    } catch {
        Write-Host "🛑 Monitoring stopped" -ForegroundColor Yellow
    }
}

Write-Host "🎯 Ready for automated deployments! 🚀" -ForegroundColor Green