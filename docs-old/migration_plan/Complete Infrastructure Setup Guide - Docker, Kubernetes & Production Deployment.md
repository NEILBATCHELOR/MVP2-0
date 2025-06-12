Complete Infrastructure Setup Guide - Docker, Kubernetes & Production Deployment.md

# 🚀 Complete Infrastructure Setup Guide - Docker, Kubernetes & Production Deployment

## 📋 Overview

Your Chain Capital project includes **complete production-ready infrastructure**! Here's how to use all the Docker, Kubernetes, and deployment components that are already built into your project.

---

## 🐳 Docker Setup & Usage

### **What's Already Built**

Your project includes:
- ✅ Multi-stage Dockerfiles for frontend and backend
- ✅ Complete docker-compose.yml with all services
- ✅ NGINX configuration for production
- ✅ Health checks and monitoring setup
- ✅ Redis and PostgreSQL services

### **Step 1: Basic Docker Setup**

```bash
# Navigate to project root
cd /Users/neilbatchelor/chain-capital-production

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
code .env
```

**Edit `.env` file:**
```bash
# Database Configuration
POSTGRES_DB=chain_capital
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_postgres_password
DATABASE_URL=postgresql://postgres:your_secure_postgres_password@database:5432/chain_capital

# Redis Configuration
REDIS_PASSWORD=your_secure_redis_password

# Supabase (use your actual credentials)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security
JWT_SECRET=your_very_long_jwt_secret_minimum_32_characters_long

# Monitoring (optional)
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin_password
```

### **Step 2: Start with Docker Compose**

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**This starts:**
- **Frontend**: http://localhost:5173 (React app via NGINX)
- **Backend**: http://localhost:3001 (Node.js API)
- **Database**: PostgreSQL on port 5432
- **Redis**: On port 6379
- **API Docs**: http://localhost:3001/api/docs

### **Step 3: Optional Monitoring Stack**

```bash
# Start with monitoring (Prometheus + Grafana)
docker-compose --profile monitoring up -d

# Access monitoring
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

### **Step 4: Production-like Setup with NGINX**

```bash
# Start with NGINX reverse proxy
docker-compose --profile production up -d

# Access via NGINX: http://localhost
```

---

## ☸️ Kubernetes Deployment

### **What's Already Built**

Your project includes complete Helm charts with:
- ✅ Frontend and backend deployments
- ✅ Services, ingress, and load balancing
- ✅ Horizontal Pod Autoscaling (HPA)
- ✅ Health checks and monitoring
- ✅ ConfigMaps and Secrets management
- ✅ Production-ready security settings

### **Prerequisites for Kubernetes**

```bash
# Install kubectl (if not already installed)
brew install kubectl

# Install Helm
brew install helm

# Verify installations
kubectl version --client
helm version
```

### **Step 1: Local Kubernetes (Docker Desktop)**

1. **Enable Kubernetes in Docker Desktop:**
   - Open Docker Desktop
   - Go to Settings → Kubernetes
   - Check "Enable Kubernetes"
   - Click "Apply & Restart"

2. **Verify Kubernetes is running:**
```bash
kubectl cluster-info
kubectl get nodes
```

### **Step 2: Deploy with Helm**

```bash
# Navigate to project root
cd /Users/neilbatchelor/chain-capital-production

# Create namespace
kubectl create namespace chain-capital

# Install/upgrade with Helm
helm upgrade --install chain-capital ./infra/helm/chain-capital \
  --namespace chain-capital \
  --set backend.env.SUPABASE_URL="https://your-project-id.supabase.co" \
  --set backend.env.SUPABASE_ANON_KEY="your_anon_key" \
  --set secrets.supabase.serviceRoleKey="your_service_role_key" \
  --set secrets.jwt.secret="your_jwt_secret"
```

### **Step 3: Access Your Application**

```bash
# Get service information
kubectl get services -n chain-capital

# Port forward to access locally
kubectl port-forward -n chain-capital service/chain-capital-frontend 8080:80
kubectl port-forward -n chain-capital service/chain-capital-backend 8081:3001

# Access at:
# Frontend: http://localhost:8080
# Backend: http://localhost:8081
# API Docs: http://localhost:8081/api/docs
```

### **Step 4: Monitor Your Deployment**

```bash
# Check pod status
kubectl get pods -n chain-capital

# View logs
kubectl logs -f -n chain-capital deployment/chain-capital-backend

# Check horizontal pod autoscaler
kubectl get hpa -n chain-capital

# Describe deployment for troubleshooting
kubectl describe deployment chain-capital-backend -n chain-capital
```

---

## 🌐 Production Cloud Deployment

### **Option 1: AWS EKS**

```bash
# Install eksctl
brew install eksctl

# Create EKS cluster
eksctl create cluster --name chain-capital-prod \
  --region us-west-2 \
  --nodes 3 \
  --node-type t3.medium

# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name chain-capital-prod

# Deploy to production
helm upgrade --install chain-capital ./infra/helm/chain-capital \
  --namespace chain-capital \
  --set global.environment=production \
  --set ingress.hosts[0].host=app.yourdomain.com
```

### **Option 2: Google GKE**

```bash
# Install gcloud CLI
brew install google-cloud-sdk

# Create GKE cluster
gcloud container clusters create chain-capital-prod \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-standard-2

# Get credentials
gcloud container clusters get-credentials chain-capital-prod --zone us-central1-a

# Deploy to production
helm upgrade --install chain-capital ./infra/helm/chain-capital \
  --namespace chain-capital \
  --set global.environment=production
```

### **Option 3: Azure AKS**

```bash
# Install Azure CLI
brew install azure-cli

# Create resource group
az group create --name chain-capital-rg --location eastus

# Create AKS cluster
az aks create --resource-group chain-capital-rg \
  --name chain-capital-prod \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group chain-capital-rg --name chain-capital-prod

# Deploy to production
helm upgrade --install chain-capital ./infra/helm/chain-capital \
  --namespace chain-capital \
  --set global.environment=production
```

---

## 🔒 Secrets Management

### **For Local Development**

```bash
# Create secrets from your .env file
kubectl create secret generic chain-capital-secrets \
  --from-env-file=.env \
  --namespace chain-capital
```

### **For Production**

```bash
# Create secrets manually (more secure)
kubectl create secret generic chain-capital-secrets \
  --from-literal=SUPABASE_URL="https://your-project.supabase.co" \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" \
  --from-literal=JWT_SECRET="your_jwt_secret" \
  --namespace chain-capital

# Or use sealed-secrets (recommended for GitOps)
# Install sealed-secrets controller first
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml
```

---

## 📊 Monitoring & Observability

### **Built-in Health Checks**

Your project includes comprehensive health checks:

```bash
# Check application health
curl http://localhost:3001/api/health

# Kubernetes health checks (automatic)
kubectl get pods -n chain-capital
# Shows Ready status based on health checks
```

### **Prometheus Metrics**

```bash
# If monitoring is enabled in Helm values:
kubectl port-forward -n chain-capital service/prometheus 9090:9090

# Access Prometheus at http://localhost:9090
```

### **Grafana Dashboards**

```bash
# If Grafana is enabled:
kubectl port-forward -n chain-capital service/grafana 3000:3000

# Access Grafana at http://localhost:3000
# Default credentials: admin/admin
```

---

## 🔧 Advanced Docker Commands

### **Development Workflow**

```bash
# Rebuild only frontend
docker-compose build frontend

# Rebuild only backend
docker-compose build backend

# Start only specific services
docker-compose up frontend backend

# Run with different environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up

# Execute commands in running containers
docker-compose exec backend npm run test
docker-compose exec frontend npm run lint

# View resource usage
docker stats
```

### **Production Optimizations**

```bash
# Build production images with specific tags
docker build -f infra/docker/Dockerfile.frontend -t chaincapital/frontend:v1.0.0 .
docker build -f infra/docker/Dockerfile.backend -t chaincapital/backend:v1.0.0 .

# Push to registry
docker push chaincapital/frontend:v1.0.0
docker push chaincapital/backend:v1.0.0

# Prune unused resources
docker system prune -a
```

---

## 🚀 CI/CD with GitHub Actions

### **What's Already Built**

Your project includes GitHub Actions workflow at `.github/workflows/ci-cd.yml`:

1. **Automated Testing**: Runs on every push/PR
2. **Docker Build**: Creates container images
3. **Registry Push**: Pushes to GitHub Container Registry
4. **Kubernetes Deploy**: Deploys to your cluster

### **Setup GitHub Actions**

1. **Enable GitHub Actions** in your repository
2. **Add secrets** in GitHub Settings → Secrets:
   ```
   KUBE_CONFIG - Your kubectl config (base64 encoded)
   SUPABASE_URL - Your Supabase project URL
   SUPABASE_SERVICE_ROLE_KEY - Your service role key
   JWT_SECRET - Your JWT secret
   ```

3. **Push to trigger deployment:**
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

---

## 🛠️ Troubleshooting

### **Docker Issues**

```bash
# Container won't start
docker-compose logs [service-name]

# Port conflicts
docker-compose down
# Change ports in docker-compose.yml

# Out of disk space
docker system prune -a --volumes

# Permission issues
sudo chown -R $USER:$USER ./
```

### **Kubernetes Issues**

```bash
# Pod crashes
kubectl describe pod [pod-name] -n chain-capital
kubectl logs [pod-name] -n chain-capital

# Service not accessible
kubectl get endpoints -n chain-capital

# Resource issues
kubectl top nodes
kubectl top pods -n chain-capital

# Delete and redeploy
helm uninstall chain-capital -n chain-capital
kubectl delete namespace chain-capital
# Then redeploy
```

### **Performance Issues**

```bash
# Check resource usage
kubectl top pods -n chain-capital
kubectl describe hpa -n chain-capital

# Scale manually if needed
kubectl scale deployment chain-capital-backend --replicas=5 -n chain-capital

# Check ingress
kubectl get ingress -n chain-capital
kubectl describe ingress chain-capital -n chain-capital
```

---

## 🎯 Next Steps

### **For Local Development:**
1. Start with `docker-compose up --build`
2. Develop your features using hot reload
3. Test with the monitoring stack

### **For Production:**
1. Set up your cloud Kubernetes cluster
2. Configure your domain and SSL certificates
3. Deploy with Helm
4. Set up monitoring and alerting

### **For CI/CD:**
1. Configure GitHub Actions secrets
2. Test the deployment pipeline
3. Set up automated testing
4. Configure notifications

---

## 📚 Summary of What You Have

### ✅ **Docker Infrastructure**
- Multi-stage builds for optimal image sizes
- Complete service orchestration with docker-compose
- Health checks and monitoring
- Production-ready NGINX configuration

### ✅ **Kubernetes Infrastructure**  
- Professional Helm charts
- Horizontal Pod Autoscaling
- Ingress with SSL termination
- Comprehensive security settings

### ✅ **Production Features**
- Multi-environment support
- Secrets management
- Monitoring and observability
- CI/CD pipeline ready

### ✅ **Developer Experience**
- Hot reload in development
- Easy local testing with Docker
- Comprehensive logging
- Health check endpoints

**Your infrastructure is enterprise-grade and ready for institutional use!** 🎉