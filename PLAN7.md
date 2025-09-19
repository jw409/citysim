---
id: PLAN7
title: "GCP Deployment Configuration"
dependencies: ["PLAN1", "PLAN2", "PLAN3", "PLAN4", "PLAN5", "PLAN6"]
status: pending
artifacts:
  - "Dockerfile"
  - "nginx.conf"
  - ".dockerignore"
  - "cloudbuild.yaml"
  - ".github/workflows/deploy.yml"
  - "scripts/deploy.sh"
  - "terraform/main.tf"
  - "terraform/variables.tf"
  - "terraform/outputs.tf"
  - "docker-compose.yml"
---

### Objective
Deploy the UrbanSynth application to Google Cloud Platform using Cloud Run with automated CI/CD, custom domain, SSL, and production optimizations for performance and cost efficiency.

### Task Breakdown

1. **Create optimized Dockerfile**:
   ```dockerfile
   # Build stage
   FROM node:18-alpine AS builder

   WORKDIR /app

   # Copy package files
   COPY package*.json ./
   COPY tsconfig*.json ./
   COPY vite.config.ts ./

   # Install dependencies
   RUN npm ci --only=production && npm cache clean --force

   # Copy source code
   COPY src/ src/
   COPY public/ public/
   COPY index.html ./

   # Install Rust for WASM build
   RUN apk add --no-cache \
       curl \
       gcc \
       musl-dev \
       && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
       && source ~/.cargo/env \
       && rustup target add wasm32-unknown-unknown

   # Install wasm-pack
   ENV PATH="/root/.cargo/bin:${PATH}"
   RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

   # Build WASM module
   COPY wasm/ wasm/
   RUN cd wasm && wasm-pack build --target web --out-dir ../src/wasm --release

   # Generate city model
   COPY scripts/ scripts/
   RUN npm run build:city

   # Build React application
   RUN npm run build

   # Production stage
   FROM nginx:alpine

   # Install gzip and brotli for compression
   RUN apk add --no-cache gzip brotli

   # Copy nginx configuration
   COPY nginx.conf /etc/nginx/nginx.conf

   # Copy built application
   COPY --from=builder /app/dist /usr/share/nginx/html

   # Set proper permissions
   RUN chown -R nginx:nginx /usr/share/nginx/html

   # Compress static assets
   RUN find /usr/share/nginx/html -type f \( -name "*.js" -o -name "*.css" -o -name "*.wasm" \) \
       -exec gzip -9 -k {} \; \
       -exec brotli -q 11 -k {} \;

   # Health check
   HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
       CMD curl -f http://localhost:8080/health || exit 1

   EXPOSE 8080

   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx configuration** (nginx.conf):
   ```nginx
   events {
       worker_connections 1024;
   }

   http {
       include       /etc/nginx/mime.types;
       default_type  application/octet-stream;

       # Add WASM MIME type
       location ~* \.wasm$ {
           add_header Content-Type application/wasm;
       }

       # Gzip compression
       gzip on;
       gzip_vary on;
       gzip_min_length 1024;
       gzip_proxied any;
       gzip_comp_level 6;
       gzip_types
           text/plain
           text/css
           text/xml
           text/javascript
           application/javascript
           application/xml+rss
           application/json
           application/wasm;

       # Brotli compression
       brotli on;
       brotli_comp_level 6;
       brotli_types
           text/plain
           text/css
           text/xml
           text/javascript
           application/javascript
           application/json
           application/wasm;

       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header Referrer-Policy "no-referrer-when-downgrade" always;
       add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;

       server {
           listen 8080;
           server_name _;
           root /usr/share/nginx/html;
           index index.html;

           # Enable efficient file serving
           sendfile on;
           tcp_nopush on;
           tcp_nodelay on;
           keepalive_timeout 65;

           # Cache static assets
           location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
               expires 1y;
               add_header Cache-Control "public, immutable";

               # Try gzipped version first
               location ~* \.(js|css|wasm)$ {
                   gzip_static on;
                   brotli_static on;
               }
           }

           # Cache WASM files
           location ~* \.wasm$ {
               expires 1y;
               add_header Cache-Control "public, immutable";
               add_header Content-Type application/wasm;
               gzip_static on;
               brotli_static on;
           }

           # SPA routing
           location / {
               try_files $uri $uri/ /index.html;
               add_header Cache-Control "no-cache, no-store, must-revalidate";
               add_header Pragma "no-cache";
               add_header Expires "0";
           }

           # Health check endpoint
           location /health {
               access_log off;
               return 200 "healthy\n";
               add_header Content-Type text/plain;
           }

           # API routes (if needed)
           location /api/ {
               add_header Cache-Control "no-cache, no-store, must-revalidate";
               # Proxy to backend if needed
           }

           # Deny access to sensitive files
           location ~ /\. {
               deny all;
           }

           # Enable CORS for local development
           location ~* \.(js|css|wasm)$ {
               add_header Access-Control-Allow-Origin "*";
               add_header Access-Control-Allow-Methods "GET, OPTIONS";
               add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept";
           }
       }
   }
   ```

3. **Create .dockerignore**:
   ```
   node_modules
   npm-debug.log
   .git
   .gitignore
   README.md
   Dockerfile
   .dockerignore
   .env
   .env.local
   .env.production
   coverage
   .nyc_output
   .vscode
   .idea
   *.swp
   *.swo
   *~
   .DS_Store
   Thumbs.db
   dist/
   target/
   wasm/pkg/
   src/wasm/
   *.log
   ```

4. **Create Cloud Build configuration** (cloudbuild.yaml):
   ```yaml
   steps:
     # Build Docker image
     - name: 'gcr.io/cloud-builders/docker'
       args: [
         'build',
         '-t', 'gcr.io/$PROJECT_ID/urbansynth:$COMMIT_SHA',
         '-t', 'gcr.io/$PROJECT_ID/urbansynth:latest',
         '.'
       ]

     # Push Docker image
     - name: 'gcr.io/cloud-builders/docker'
       args: ['push', 'gcr.io/$PROJECT_ID/urbansynth:$COMMIT_SHA']

     - name: 'gcr.io/cloud-builders/docker'
       args: ['push', 'gcr.io/$PROJECT_ID/urbansynth:latest']

     # Deploy to Cloud Run
     - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
       entrypoint: gcloud
       args: [
         'run', 'deploy', 'urbansynth',
         '--image', 'gcr.io/$PROJECT_ID/urbansynth:$COMMIT_SHA',
         '--region', 'us-central1',
         '--platform', 'managed',
         '--allow-unauthenticated',
         '--memory', '1Gi',
         '--cpu', '1',
         '--max-instances', '10',
         '--min-instances', '0',
         '--port', '8080',
         '--set-env-vars', 'NODE_ENV=production',
         '--tag', 'latest'
       ]

     # Update traffic allocation
     - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
       entrypoint: gcloud
       args: [
         'run', 'services', 'update-traffic', 'urbansynth',
         '--to-latest',
         '--region', 'us-central1'
       ]

   options:
     logging: CLOUD_LOGGING_ONLY
     machineType: 'E2_HIGHCPU_8'

   timeout: '1200s'
   ```

5. **Create GitHub Actions workflow** (.github/workflows/deploy.yml):
   ```yaml
   name: Deploy to Google Cloud Run

   on:
     push:
       branches:
         - main
         - develop
     pull_request:
       branches:
         - main

   env:
     PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
     GAR_LOCATION: us-central1
     REPOSITORY: urbansynth
     SERVICE: urbansynth
     REGION: us-central1

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'

         - name: Install dependencies
           run: npm ci

         - name: Run TypeScript check
           run: npx tsc --noEmit

         - name: Run tests
           run: npm test

         - name: Run linting
           run: npm run lint

     build-and-deploy:
       needs: test
       runs-on: ubuntu-latest
       if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

       permissions:
         contents: read
         id-token: write

       steps:
         - name: Checkout
           uses: actions/checkout@v3

         - name: Google Auth
           id: auth
           uses: 'google-github-actions/auth@v1'
           with:
             credentials_json: '${{ secrets.GCP_SA_KEY }}'

         - name: Set up Cloud SDK
           uses: 'google-github-actions/setup-gcloud@v1'
           with:
             project_id: '${{ env.PROJECT_ID }}'

         - name: Configure Docker to use gcloud as a credential helper
           run: |
             gcloud auth configure-docker gcr.io

         - name: Build Docker image
           run: |
             docker build \
               --tag "gcr.io/$PROJECT_ID/$SERVICE:$GITHUB_SHA" \
               --tag "gcr.io/$PROJECT_ID/$SERVICE:latest" \
               .

         - name: Push Docker image
           run: |
             docker push "gcr.io/$PROJECT_ID/$SERVICE:$GITHUB_SHA"
             docker push "gcr.io/$PROJECT_ID/$SERVICE:latest"

         - name: Deploy to Cloud Run
           id: deploy
           uses: google-github-actions/deploy-cloudrun@v1
           with:
             service: ${{ env.SERVICE }}
             region: ${{ env.REGION }}
             image: gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE }}:${{ github.sha }}
             flags: |
               --memory=1Gi
               --cpu=1
               --max-instances=10
               --min-instances=0
               --port=8080
               --allow-unauthenticated
               --set-env-vars=NODE_ENV=production

         - name: Show Output
           run: echo ${{ steps.deploy.outputs.url }}

         - name: Update domain mapping (production only)
           if: github.ref == 'refs/heads/main'
           run: |
             gcloud run domain-mappings create \
               --service=$SERVICE \
               --domain=urbansynth.app \
               --region=$REGION \
               --force-override || true
   ```

6. **Create deployment script** (scripts/deploy.sh):
   ```bash
   #!/bin/bash
   set -e

   # Configuration
   PROJECT_ID=${GCP_PROJECT_ID:-"urbansynth-prod"}
   SERVICE_NAME="urbansynth"
   REGION="us-central1"
   DOMAIN="urbansynth.app"

   echo "🚀 Deploying UrbanSynth to Google Cloud Run"

   # Check if gcloud is installed and authenticated
   if ! command -v gcloud &> /dev/null; then
       echo "❌ gcloud CLI is not installed"
       exit 1
   fi

   # Set project
   gcloud config set project $PROJECT_ID

   # Enable required APIs
   echo "📋 Enabling required APIs..."
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable containerregistry.googleapis.com

   # Build and push Docker image
   echo "🐳 Building Docker image..."
   IMAGE_URI="gcr.io/$PROJECT_ID/$SERVICE_NAME:$(git rev-parse --short HEAD)"

   docker build -t $IMAGE_URI .
   docker push $IMAGE_URI

   # Deploy to Cloud Run
   echo "☁️ Deploying to Cloud Run..."
   gcloud run deploy $SERVICE_NAME \
       --image $IMAGE_URI \
       --region $REGION \
       --platform managed \
       --allow-unauthenticated \
       --memory 1Gi \
       --cpu 1 \
       --max-instances 10 \
       --min-instances 0 \
       --port 8080 \
       --set-env-vars NODE_ENV=production

   # Get service URL
   SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
       --region $REGION \
       --format 'value(status.url)')

   echo "✅ Deployment successful!"
   echo "🌐 Service URL: $SERVICE_URL"

   # Set up custom domain (optional)
   if [ ! -z "$DOMAIN" ]; then
       echo "🌍 Setting up custom domain: $DOMAIN"

       # Create domain mapping
       gcloud run domain-mappings create \
           --service $SERVICE_NAME \
           --domain $DOMAIN \
           --region $REGION \
           --force-override || true

       echo "📝 Please configure DNS:"
       echo "   Type: CNAME"
       echo "   Name: $DOMAIN"
       echo "   Value: ghs.googlehosted.com"
   fi

   echo "🎉 Deployment completed successfully!"
   ```

7. **Create Terraform configuration** (terraform/main.tf):
   ```hcl
   terraform {
     required_version = ">= 1.0"
     required_providers {
       google = {
         source  = "hashicorp/google"
         version = "~> 4.0"
       }
     }
   }

   provider "google" {
     project = var.project_id
     region  = var.region
   }

   # Enable required APIs
   resource "google_project_service" "apis" {
     for_each = toset([
       "run.googleapis.com",
       "cloudbuild.googleapis.com",
       "containerregistry.googleapis.com",
       "cloudresourcemanager.googleapis.com"
     ])

     service = each.value
     disable_on_destroy = false
   }

   # Cloud Run service
   resource "google_cloud_run_service" "urbansynth" {
     name     = var.service_name
     location = var.region

     template {
       metadata {
         annotations = {
           "autoscaling.knative.dev/maxScale" = "10"
           "autoscaling.knative.dev/minScale" = "0"
           "run.googleapis.com/cpu-throttling" = "false"
         }
       }

       spec {
         containers {
           image = "gcr.io/${var.project_id}/${var.service_name}:latest"

           ports {
             container_port = 8080
           }

           resources {
             limits = {
               memory = "1Gi"
               cpu    = "1000m"
             }
           }

           env {
             name  = "NODE_ENV"
             value = "production"
           }

           env {
             name  = "PORT"
             value = "8080"
           }
         }

         service_account_name = google_service_account.cloudrun.email
       }
     }

     traffic {
       percent         = 100
       latest_revision = true
     }

     depends_on = [google_project_service.apis]
   }

   # Service account for Cloud Run
   resource "google_service_account" "cloudrun" {
     account_id   = "${var.service_name}-cloudrun"
     display_name = "Cloud Run Service Account for ${var.service_name}"
   }

   # IAM policy for unauthenticated access
   resource "google_cloud_run_service_iam_member" "public" {
     service  = google_cloud_run_service.urbansynth.name
     location = google_cloud_run_service.urbansynth.location
     role     = "roles/run.invoker"
     member   = "allUsers"
   }

   # Domain mapping (if domain is provided)
   resource "google_cloud_run_domain_mapping" "urbansynth" {
     count    = var.domain != "" ? 1 : 0
     location = var.region
     name     = var.domain

     metadata {
       namespace = var.project_id
     }

     spec {
       route_name = google_cloud_run_service.urbansynth.name
     }
   }

   # Cloud Build trigger for automated deployments
   resource "google_cloudbuild_trigger" "github" {
     count = var.github_repo != "" ? 1 : 0

     github {
       owner = split("/", var.github_repo)[0]
       name  = split("/", var.github_repo)[1]
       push {
         branch = "^main$"
       }
     }

     filename = "cloudbuild.yaml"

     depends_on = [google_project_service.apis]
   }
   ```

8. **Create Terraform variables** (terraform/variables.tf):
   ```hcl
   variable "project_id" {
     description = "The GCP project ID"
     type        = string
   }

   variable "region" {
     description = "The GCP region"
     type        = string
     default     = "us-central1"
   }

   variable "service_name" {
     description = "The name of the Cloud Run service"
     type        = string
     default     = "urbansynth"
   }

   variable "domain" {
     description = "Custom domain for the application"
     type        = string
     default     = ""
   }

   variable "github_repo" {
     description = "GitHub repository in format owner/repo"
     type        = string
     default     = ""
   }

   variable "environment" {
     description = "Environment (production, staging, development)"
     type        = string
     default     = "production"
   }
   ```

9. **Create Terraform outputs** (terraform/outputs.tf):
   ```hcl
   output "service_url" {
     description = "URL of the deployed Cloud Run service"
     value       = google_cloud_run_service.urbansynth.status[0].url
   }

   output "domain_mapping" {
     description = "Custom domain mapping"
     value       = var.domain != "" ? "https://${var.domain}" : null
   }

   output "service_name" {
     description = "Name of the Cloud Run service"
     value       = google_cloud_run_service.urbansynth.name
   }

   output "project_id" {
     description = "GCP Project ID"
     value       = var.project_id
   }

   output "region" {
     description = "GCP Region"
     value       = var.region
   }
   ```

10. **Create docker-compose for local development** (docker-compose.yml):
    ```yaml
    version: '3.8'

    services:
      urbansynth:
        build:
          context: .
          dockerfile: Dockerfile
        ports:
          - "8080:8080"
        environment:
          - NODE_ENV=production
        volumes:
          - ./nginx.conf:/etc/nginx/nginx.conf:ro
        restart: unless-stopped

      # Optional: Add monitoring
      prometheus:
        image: prom/prometheus:latest
        ports:
          - "9090:9090"
        volumes:
          - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
        command:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
          - '--web.console.libraries=/etc/prometheus/console_libraries'
          - '--web.console.templates=/etc/prometheus/consoles'
          - '--web.enable-lifecycle'

      grafana:
        image: grafana/grafana:latest
        ports:
          - "3000:3000"
        environment:
          - GF_SECURITY_ADMIN_PASSWORD=admin
        volumes:
          - grafana-storage:/var/lib/grafana

    volumes:
      grafana-storage:
    ```

11. **Update package.json with deployment scripts**:
    ```json
    {
      "scripts": {
        "docker:build": "docker build -t urbansynth .",
        "docker:run": "docker run -p 8080:8080 urbansynth",
        "docker:dev": "docker-compose up",
        "deploy": "bash scripts/deploy.sh",
        "deploy:terraform": "cd terraform && terraform init && terraform plan && terraform apply",
        "deploy:staging": "bash scripts/deploy.sh staging",
        "build:production": "NODE_ENV=production npm run build"
      }
    }
    ```

### Acceptance Criteria
- [ ] Docker image builds successfully and is optimized for production
- [ ] Nginx serves files correctly with proper MIME types for WASM
- [ ] Application deploys to Google Cloud Run without errors
- [ ] Custom domain mapping works with SSL certificate
- [ ] GitHub Actions CI/CD pipeline runs automatically
- [ ] Static assets are properly compressed and cached
- [ ] Health checks respond correctly
- [ ] Application scales properly under load
- [ ] Terraform configuration deploys infrastructure correctly
- [ ] Monitoring and logging are functional

### Test Plan
Execute from project root directory:

```bash
#!/bin/bash
set -e

echo "🧪 Testing PLAN7: GCP Deployment Configuration"

# Test 1: Verify deployment files
echo "📦 Testing deployment configuration files..."
required_files=(
  "Dockerfile"
  "nginx.conf"
  ".dockerignore"
  "cloudbuild.yaml"
  ".github/workflows/deploy.yml"
  "scripts/deploy.sh"
  "terraform/main.tf"
  "terraform/variables.tf"
  "terraform/outputs.tf"
  "docker-compose.yml"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Required file $file not found"
    exit 1
  fi
done
echo "✅ All deployment files present"

# Test 2: Docker build test
echo "🐳 Testing Docker build..."
if command -v docker &> /dev/null; then
  docker build -t urbansynth-test . > /dev/null 2>&1 || exit 1
  echo "✅ Docker build successful"

  # Cleanup
  docker rmi urbansynth-test > /dev/null 2>&1 || true
else
  echo "⚠️ Docker not available, skipping build test"
fi

# Test 3: Nginx configuration validation
echo "🌐 Testing Nginx configuration..."
if command -v nginx &> /dev/null; then
  nginx -t -c $(pwd)/nginx.conf > /dev/null 2>&1 || exit 1
  echo "✅ Nginx configuration valid"
else
  echo "⚠️ Nginx not available, skipping validation"
fi

# Test 4: Terraform validation
echo "🏗️ Testing Terraform configuration..."
if command -v terraform &> /dev/null; then
  cd terraform
  terraform init > /dev/null 2>&1
  terraform validate > /dev/null 2>&1 || exit 1
  cd ..
  echo "✅ Terraform configuration valid"
else
  echo "⚠️ Terraform not available, skipping validation"
fi

# Test 5: GitHub Actions workflow syntax
echo "⚙️ Testing GitHub Actions workflow..."
if command -v yq &> /dev/null; then
  yq eval '.jobs' .github/workflows/deploy.yml > /dev/null 2>&1 || exit 1
  echo "✅ GitHub Actions workflow syntax valid"
else
  echo "⚠️ yq not available, skipping workflow validation"
fi

# Test 6: Shell script syntax
echo "📝 Testing shell scripts..."
if [ -f "scripts/deploy.sh" ]; then
  bash -n scripts/deploy.sh || exit 1
  echo "✅ Shell script syntax valid"
fi

# Test 7: Cloud Build configuration
echo "☁️ Testing Cloud Build configuration..."
if command -v yq &> /dev/null; then
  yq eval '.steps' cloudbuild.yaml > /dev/null 2>&1 || exit 1
  echo "✅ Cloud Build configuration valid"
else
  echo "⚠️ yq not available, skipping Cloud Build validation"
fi

# Test 8: Production build optimization
echo "🎯 Testing production build optimization..."
NODE_ENV=production npm run build > /dev/null 2>&1 || exit 1

if [ -d "dist" ]; then
  # Check for gzipped files
  if find dist -name "*.gz" | grep -q .; then
    echo "✅ Gzip compression configured"
  fi

  # Check bundle size
  BUNDLE_SIZE=$(du -sb dist | cut -f1)
  if [ $BUNDLE_SIZE -lt 20971520 ]; then  # < 20MB
    echo "✅ Bundle size optimized ($(echo "scale=1; $BUNDLE_SIZE/1024/1024" | bc -l)MB)"
  else
    echo "⚠️ Bundle size might be too large ($(echo "scale=1; $BUNDLE_SIZE/1024/1024" | bc -l)MB)"
  fi
fi

# Test 9: Environment variable validation
echo "🔧 Testing environment configuration..."
if grep -q "NODE_ENV" cloudbuild.yaml; then
  echo "✅ Environment variables configured"
else
  echo "❌ Environment variables missing"
  exit 1
fi

echo "🎉 PLAN7 COMPLETED SUCCESSFULLY"
echo "📊 Deployment Stats:"
echo "   - Docker files: $(find . -name "Dockerfile*" -o -name "docker-compose*" | wc -l)"
echo "   - Terraform files: $(find terraform -name "*.tf" 2>/dev/null | wc -l || echo 0)"
echo "   - CI/CD workflows: $(find .github/workflows -name "*.yml" 2>/dev/null | wc -l || echo 0)"
echo "   - Scripts: $(find scripts -name "*.sh" 2>/dev/null | wc -l || echo 0)"
echo "Next: Execute PLAN8 for promotion content creation"
exit 0
```