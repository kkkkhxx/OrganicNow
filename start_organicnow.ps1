# Write-Host "🚀 Starting Docker + Minikube + Port Forward..." -ForegroundColor Cyan
# Start-Process "Docker Desktop"
# Start-Sleep -Seconds 10
# minikube start
# Start-Sleep -Seconds 10
# Start-Process powershell -ArgumentList "kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80 --address 0.0.0.0"
# Write-Host "✅ OrganicNow running at http://127.0.0.1:8080" -ForegroundColor Green
Write-Host "🚀 Starting Docker + Minikube + Port Forward..." -ForegroundColor Cyan

# 1) เปิด Docker Desktop (ตรวจว่ามีอยู่จริงก่อน)
$dockerPath = "$Env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerPath) {
    Start-Process $dockerPath
    Write-Host "🐳 Docker Desktop starting..." -ForegroundColor Yellow
} else {
    Write-Host "❌ Docker Desktop not found! Please open it manually." -ForegroundColor Red
}

# 2) รอให้ Docker ขึ้นก่อน
Start-Sleep -Seconds 15

# 3) สั่ง start Minikube
Write-Host "📦 Starting Minikube cluster..." -ForegroundColor Yellow
minikube start --driver=docker

# 4) รอให้ cluster พร้อม
Start-Sleep -Seconds 10

# 5) เปิดพอร์ต 8080 จาก ingress controller ให้คนอื่นใน LAN เข้าได้
Write-Host "🔗 Starting Port-Forward to 8080..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80 --address 0.0.0.0"

# 6) แสดง IP จริงใน LAN (เผื่อแชร์ให้เพื่อนเปิดจากมือถือ)
$ip = (Get-NetIPAddress -AddressFamily IPv4 `
       | Where-Object { $_.InterfaceAlias -like "Wi-Fi*" -and $_.IPAddress -match '^192\.168\.' } `
       | Select-Object -ExpandProperty IPAddress)
Write-Host "✅ OrganicNow running at: http://127.0.0.1:8080 (local)" -ForegroundColor Green
if ($ip) {
    Write-Host "🌐 Access from other devices in LAN: http://$ip:8080" -ForegroundColor Green
} else {
    Write-Host "⚠️ Could not detect Wi-Fi IP automatically." -ForegroundColor Yellow
}
