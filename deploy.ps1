# 🚀 OrganicNow Deployment Script
# สำหรับ Manual Deploy หลังจาก CI/CD build images เรียบร้อยแล้ว

Write-Host "🚀 Starting OrganicNow Deployment..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# ตรวจสอบ Minikube status
Write-Host "🔍 Checking Minikube status..." -ForegroundColor Yellow
$minikubeStatus = minikube status --format='{{.Host}}'
if ($minikubeStatus -ne "Running") {
    Write-Host "❌ Minikube is not running. Please start Minikube first:" -ForegroundColor Red
    Write-Host "   minikube start" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Minikube is running" -ForegroundColor Green

# ตรวจสอบ kubectl context
Write-Host "🔍 Checking kubectl context..." -ForegroundColor Yellow
$currentContext = kubectl config current-context
if ($currentContext -ne "minikube") {
    Write-Host "❌ kubectl context is not set to minikube" -ForegroundColor Red
    Write-Host "   Current context: $currentContext" -ForegroundColor Yellow
    Write-Host "   Setting context to minikube..." -ForegroundColor Yellow
    kubectl config use-context minikube
}
Write-Host "✅ kubectl context is set to minikube" -ForegroundColor Green

# สร้าง namespace (ถ้ายังไม่มี)
Write-Host "🔧 Creating/checking namespace..." -ForegroundColor Yellow
kubectl create namespace organicnow --dry-run=client -o yaml | kubectl apply -f -
Write-Host "✅ Namespace 'organicnow' ready" -ForegroundColor Green

# Pull latest images จาก GitHub Container Registry
Write-Host "📦 Pulling latest images from GitHub Container Registry..." -ForegroundColor Yellow
Write-Host "   - Frontend: ghcr.io/kkkkhxx/organicnow-frontend:latest" -ForegroundColor Gray
Write-Host "   - Backend: ghcr.io/kkkkhxx/organicnow-backend:latest" -ForegroundColor Gray

# ใช้ minikube image pull สำหรับ local registry
minikube image pull ghcr.io/kkkkhxx/organicnow-frontend:latest
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Could not pull frontend image. Make sure it exists in registry." -ForegroundColor Yellow
}

minikube image pull ghcr.io/kkkkhxx/organicnow-backend:latest
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Could not pull backend image. Make sure it exists in registry." -ForegroundColor Yellow
}
Write-Host "✅ Images pulled successfully" -ForegroundColor Green

# Apply Kubernetes manifests
Write-Host "🔄 Applying Kubernetes deployments..." -ForegroundColor Yellow

# 0. Database secrets first
Write-Host "   🔐 Applying database secrets..." -ForegroundColor Gray
kubectl apply -f db-secret.yaml -n organicnow

# 1. Database first
Write-Host "   📊 Deploying database..." -ForegroundColor Gray
kubectl apply -f postgres-pvc.yaml -n organicnow
kubectl apply -f postgres-deployment.yaml -n organicnow

# 2. Backend
Write-Host "   🔧 Deploying backend..." -ForegroundColor Gray
kubectl apply -f backend-deployment.yaml -n organicnow

# 3. Frontend
Write-Host "   🎨 Deploying frontend..." -ForegroundColor Gray
kubectl apply -f frontend-deployment.yaml -n organicnow

# 4. Ingress
Write-Host "   🌐 Applying ingress rules..." -ForegroundColor Gray
kubectl apply -f ingress-api.yaml -n organicnow
kubectl apply -f ingress-web.yaml -n organicnow

Write-Host "✅ All manifests applied" -ForegroundColor Green

# Wait for deployments to be ready
Write-Host "⏳ Waiting for deployments to be ready..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

# Wait for database
Write-Host "   📊 Waiting for database..." -ForegroundColor Gray
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s -n organicnow

# Wait for backend
Write-Host "   🔧 Waiting for backend..." -ForegroundColor Gray
kubectl rollout status deployment/organicnow-backend --timeout=300s -n organicnow

# Wait for frontend
Write-Host "   🎨 Waiting for frontend..." -ForegroundColor Gray
kubectl rollout status deployment/organicnow-frontend --timeout=300s -n organicnow

Write-Host "✅ All deployments are ready!" -ForegroundColor Green

# Stop existing port-forward if running
Write-Host "🔄 Managing port-forward..." -ForegroundColor Yellow
$portForwardProcesses = Get-Process | Where-Object { 
    $_.ProcessName -eq "kubectl" -and $_.CommandLine -like "*port-forward*8080*" 
} 2>$null

if ($portForwardProcesses) {
    Write-Host "   🛑 Stopping existing port-forward processes..." -ForegroundColor Gray
    $portForwardProcesses | ForEach-Object { Stop-Process -Id $_.Id -Force }
    Start-Sleep -Seconds 3
}

# Start new port-forward in background
Write-Host "   ▶️  Starting new port-forward..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80 --address 0.0.0.0" -WindowStyle Minimized

# Get local IP for LAN access
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*" } | 
    Where-Object { $_.IPAddress -match '^192\.168\.|^10\.|^172\.' } | 
    Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "   Local:  http://localhost:8080" -ForegroundColor White
if ($localIP) {
    Write-Host "   LAN:    http://$localIP:8080" -ForegroundColor White
}
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Cyan
Write-Host "   kubectl get pods -n organicnow           # Check pod status" -ForegroundColor Gray
Write-Host "   kubectl logs -f deployment/organicnow-backend -n organicnow  # Backend logs" -ForegroundColor Gray
Write-Host "   kubectl logs -f deployment/organicnow-frontend -n organicnow # Frontend logs" -ForegroundColor Gray
Write-Host "   kubectl describe ingress -n organicnow   # Check ingress status" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 To redeploy after code changes:" -ForegroundColor Cyan
Write-Host "   1. git push origin main  (triggers CI/CD)" -ForegroundColor Gray
Write-Host "   2. ./deploy.ps1          (deploys latest images)" -ForegroundColor Gray
Write-Host ""