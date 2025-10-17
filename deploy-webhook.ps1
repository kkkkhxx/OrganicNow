# 🎯 OrganicNow Deployment Webhook Server
# สำหรับรับ webhook จาก GitHub Actions และ trigger deployment อัตโนมัติ

param(
    [int]$Port = 9000,
    [string]$Token = $env:DEPLOYMENT_WEBHOOK_TOKEN
)

if (-not $Token) {
    Write-Host "❌ Error: DEPLOYMENT_WEBHOOK_TOKEN environment variable is required" -ForegroundColor Red
    Write-Host "   Set it with: `$env:DEPLOYMENT_WEBHOOK_TOKEN = 'your-secret-token'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🎯 Starting OrganicNow Deployment Webhook Server..." -ForegroundColor Cyan
Write-Host "   Port: $Port" -ForegroundColor Gray
Write-Host "   Token: $($Token.Substring(0,8))..." -ForegroundColor Gray
Write-Host "======================================" -ForegroundColor Cyan

# สร้าง HTTP Listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$Port/")

try {
    $listener.Start()
    Write-Host "✅ Webhook server started at http://localhost:$Port" -ForegroundColor Green
    Write-Host "🔄 Waiting for deployment requests..." -ForegroundColor Yellow
    Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""

    while ($listener.IsListening) {
        # รอรับ request
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] 📨 Received $($request.HttpMethod) $($request.Url.AbsolutePath)" -ForegroundColor Cyan
        
        try {
            # ตรวจสอบ method และ path
            if ($request.HttpMethod -eq "POST" -and $request.Url.AbsolutePath -eq "/deploy") {
                
                # อ่าน request body
                $reader = New-Object System.IO.StreamReader($request.InputStream)
                $requestBody = $reader.ReadToEnd()
                $reader.Close()
                
                # Parse JSON
                $payload = $requestBody | ConvertFrom-Json -ErrorAction SilentlyContinue
                
                if (-not $payload) {
                    throw "Invalid JSON payload"
                }
                
                # ตรวจสอบ authorization
                $authHeader = $request.Headers["Authorization"]
                if (-not $authHeader -or $authHeader -ne "Bearer $Token") {
                    throw "Invalid authorization token"
                }
                
                # ตรวจสอบ payload
                if ($payload.event -ne "deploy") {
                    throw "Invalid event type: $($payload.event)"
                }
                
                Write-Host "✅ Valid deployment request received" -ForegroundColor Green
                Write-Host "   Repository: $($payload.repository)" -ForegroundColor Gray
                Write-Host "   Ref: $($payload.ref)" -ForegroundColor Gray
                Write-Host "   SHA: $($payload.sha)" -ForegroundColor Gray
                Write-Host "   Frontend Image: $($payload.images.frontend)" -ForegroundColor Gray
                Write-Host "   Backend Image: $($payload.images.backend)" -ForegroundColor Gray
                Write-Host ""
                
                # Response success ก่อน - เพื่อไม่ให้ GitHub Actions รอนาน
                $response.StatusCode = 200
                $response.ContentType = "application/json"
                $responseJson = @{
                    status = "accepted"
                    message = "Deployment started"
                    timestamp = $timestamp
                } | ConvertTo-Json
                
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseJson)
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                $response.Close()
                
                Write-Host "🚀 Starting deployment process..." -ForegroundColor Yellow
                
                # เรียกใช้ deployment script
                try {
                    $deployResult = & ".\deploy.ps1" 2>&1
                    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
                    Write-Host $deployResult -ForegroundColor Gray
                } catch {
                    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
                    Write-Host $deployResult -ForegroundColor Gray
                }
                
                Write-Host ""
                Write-Host "🔄 Ready for next deployment..." -ForegroundColor Yellow
                continue
            }
            
            # Health check endpoint
            if ($request.HttpMethod -eq "GET" -and $request.Url.AbsolutePath -eq "/health") {
                $response.StatusCode = 200
                $response.ContentType = "application/json"
                $healthJson = @{
                    status = "healthy"
                    service = "organicnow-deployment-webhook"
                    timestamp = $timestamp
                } | ConvertTo-Json
                
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($healthJson)
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                Write-Host "✅ Health check OK" -ForegroundColor Green
            }
            # Invalid endpoint
            else {
                $response.StatusCode = 404
                $response.ContentType = "application/json"
                $errorJson = @{
                    error = "Not Found"
                    message = "Valid endpoints: POST /deploy, GET /health"
                } | ConvertTo-Json
                
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorJson)
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                Write-Host "❌ 404 Not Found: $($request.Url.AbsolutePath)" -ForegroundColor Red
            }
            
        } catch {
            # Error handling
            Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
            
            $response.StatusCode = 400
            $response.ContentType = "application/json"
            $errorJson = @{
                error = "Bad Request"
                message = $_.Exception.Message
                timestamp = $timestamp
            } | ConvertTo-Json
            
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorJson)
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } finally {
            if ($response -and -not $response.OutputStream.CanRead) {
                $response.Close()
            }
        }
    }
} catch {
    Write-Host "❌ Server error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($listener) {
        $listener.Stop()
        Write-Host "🛑 Webhook server stopped" -ForegroundColor Yellow
    }
}