# 🚀 OrganicNow CI/CD Workflow

## 📋 Overview
การใช้งาน CI/CD ด้วย GitHub Actions + Manual Deploy บน Minikube

## 🔄 Workflow Process

### 1. **Development & Push**
```bash
# Make changes to code
git add .
git commit -m "Add new feature"
git push origin main  # 🎯 Triggers CI/CD
```

### 2. **CI/CD Pipeline (Automatic)**
GitHub Actions จะทำงานอัตโนมัติ:
- ✅ Run Backend Tests (with PostgreSQL)
- ✅ Run E2E Tests (with Cypress)
- ✅ Build & Push Frontend Image → `ghcr.io/kkkkhxx/organicnow-frontend:latest`
- ✅ Build & Push Backend Image → `ghcr.io/kkkkhxx/organicnow-backend:latest`

### 3. **Manual Deploy (When Ready)**
```powershell
# Deploy latest images to Minikube
./deploy.ps1
```

## 🎯 Benefits

### ✅ **Automated Quality Assurance**
- Tests ทุกครั้งก่อน build images
- ไม่มี broken code ใน production images

### ✅ **Version Control**
- Images tagged with Git SHA และ `:latest`
- Rollback ได้ง่ายด้วย previous tags

### ✅ **Manual Control**
- Deploy เมื่อพร้อมแล้ว
- ไม่ deploy อัตโนมัติที่อาจทำให้ service down

### ✅ **Local Development**
- ยังใช้ `docker-compose up` สำหรับ development ได้
- Production deploy แยกออกมา

## 🛠️ Setup Requirements

### Prerequisites:
- [x] Minikube running
- [x] kubectl configured
- [x] NGINX Ingress enabled
- [x] GitHub repository public (สำหรับ GitHub Container Registry)

### First-time Setup:
```powershell
# 1. เปิด Minikube
minikube start

# 2. เปิด Ingress
minikube addons enable ingress

# 3. Deploy ครั้งแรก
./deploy.ps1
```

## 📊 Monitoring

### Check Deployment Status:
```bash
kubectl get pods -n organicnow
kubectl get deployments -n organicnow
kubectl get services -n organicnow
kubectl get ingress -n organicnow
```

### View Logs:
```bash
# Backend logs
kubectl logs -f deployment/organicnow-backend -n organicnow

# Frontend logs  
kubectl logs -f deployment/organicnow-frontend -n organicnow

# Database logs
kubectl logs -f deployment/postgres -n organicnow
```

## 🌐 Access URLs

- **Local**: http://localhost:8080
- **LAN**: http://[your-ip]:8080

## 🔧 Troubleshooting

### Common Issues:

#### **1. Images not pulling**
```bash
# Check if images exist
docker search ghcr.io/kkkkhxx/organicnow-frontend

# Manual pull
minikube image pull ghcr.io/kkkkhxx/organicnow-frontend:latest
```

#### **2. Port-forward not working**
```bash
# Check running processes
Get-Process | Where-Object ProcessName -eq "kubectl"

# Restart port-forward
pkill -f "kubectl port-forward"
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80 --address 0.0.0.0
```

#### **3. Pods not starting**
```bash
# Describe pod issues
kubectl describe pod [pod-name] -n organicnow

# Check events
kubectl get events -n organicnow --sort-by=.metadata.creationTimestamp
```

## 🔄 Update Process

### For Code Changes:
1. `git push origin main` → Images built automatically
2. `./deploy.ps1` → Deploy new images

### For Infrastructure Changes:
1. Update `*.yaml` files
2. `./deploy.ps1` → Apply changes

## 📈 Next Steps (Optional)

- **Auto Deploy**: Setup self-hosted GitHub runner
- **Production**: Deploy to real Kubernetes cluster  
- **Monitoring**: Add Prometheus + Grafana
- **Security**: Add image scanning in CI/CD