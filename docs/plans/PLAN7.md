---
id: PLAN7
title: "Phase 5: GCP Deployment to Cloud Storage"
dependencies: ["PLAN6"]
status: pending
artifacts:
  - "cloudbuild.yaml"
---

### Objective
Configure and automate the deployment of the production-built static frontend to a publicly accessible Google Cloud Storage bucket.

### Task Breakdown

1. **Create a GCS Bucket**:
   * Use the `gcloud` CLI or Terraform to create a new, globally unique Google Cloud Storage bucket (e.g., `urbansynth-demo-website`).

2. **Configure Bucket for Web Hosting**:
   * Make the bucket's contents publicly readable by applying the correct IAM policy (`roles/storage.objectViewer` for `allUsers`).
   * Set the bucket's website configuration, specifying `index.html` as the main page and `index.html` as the not-found (404) page to support client-side routing.

3. **Update CI/CD Pipeline**:
   * Modify the `cloudbuild.yaml` file to perform the following steps:
     1. Install npm dependencies.
     2. Run the full production build (`npm run build`). This will compile the frontend and generate the `/dist` directory.
     3. Use the `gsutil` command-line tool to sync the contents of the `/dist` directory with the GCS bucket (`gsutil -m rsync -r ./dist gs://<your-bucket-name>`).
     4. Set the cache control headers for the uploaded assets to ensure browsers cache them effectively (`gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://<your-bucket-name>/**`).

### Cloud Build Configuration Example (cloudbuild.yaml):
```yaml
steps:
  # Install dependencies
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['ci']

  # Install Rust and wasm-pack for WASM build
  - name: 'node:18'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
        rustup target add wasm32-unknown-unknown
        curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
        cd wasm && ~/.cargo/bin/wasm-pack build --target web --out-dir ../src/wasm --release

  # Generate city model
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['run', 'build:city']

  # Build React application
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['run', 'build']

  # Deploy to GCS bucket
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gsutil'
    args: ['-m', 'rsync', '-r', '-d', './dist', 'gs://urbansynth-demo-website']

  # Set cache headers for static assets
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gsutil'
    args: ['-m', 'setmeta', '-h', 'Cache-Control:public, max-age=31536000', 'gs://urbansynth-demo-website/**.js']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gsutil'
    args: ['-m', 'setmeta', '-h', 'Cache-Control:public, max-age=31536000', 'gs://urbansynth-demo-website/**.css']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gsutil'
    args: ['-m', 'setmeta', '-h', 'Cache-Control:public, max-age=31536000', 'gs://urbansynth-demo-website/**.wasm']

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_4'

timeout: '600s'
```

### Acceptance Criteria
- [ ] A public GCS bucket configured for static website hosting exists.
- [ ] The `cloudbuild.yaml` file is updated to deploy the `/dist` directory to the GCS bucket.
- [ ] Pushing a commit to the `main` branch triggers a successful Cloud Build run.
- [ ] The deployed application is publicly accessible and fully functional at its GCS URL (e.g., `storage.googleapis.com/<your-bucket-name>/index.html`).

### Test Plan

```shell
#!/bin/bash
# This test verifies the deployment pipeline configuration for GCS.

echo "Verifying deployment artifacts..."

# 1. Check for Cloud Build config
if [ ! -f "cloudbuild.yaml" ]; then
    echo "❌ Test FAILED: cloudbuild.yaml not found."
    exit 1
fi
echo "✅ cloudbuild.yaml exists."

# 2. Check that the cloudbuild.yaml contains the gsutil command
if ! grep -q "gsutil" "cloudbuild.yaml"; then
    echo "❌ Test FAILED: cloudbuild.yaml does not appear to contain a gsutil command for deployment."
    exit 1
fi
echo "✅ cloudbuild.yaml is configured for GCS deployment."

# 3. (Manual Step for Agent) - Trigger a cloud build and poll for success.
echo "NOTE: Final verification requires triggering a deployment on GCP and checking the public URL."
exit 0
```