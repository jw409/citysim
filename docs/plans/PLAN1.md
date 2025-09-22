---
id: PLAN1
title: "Project Scaffolding & Dependencies"
dependencies: []
status: pending
artifacts:
  - "package.json"
  - "tsconfig.json"
  - "vite.config.ts"
  - ".gitignore"
  - "src/main.tsx"
  - "src/App.tsx"
  - "index.html"
  - "wasm/Cargo.toml"
  - "wasm/src/lib.rs"
  - "scripts/.gitkeep"
  - "public/.gitkeep"
  - "tests/.gitkeep"
---

### Objective
Initialize the complete UrbanSynth project structure with all necessary dependencies and configuration files for both the React frontend and Rust WASM backend.

### Task Breakdown

1. **Create project directory structure**:
   ```
   /src/           # React application source
   /src/components/  # React components
   /src/types/     # TypeScript type definitions
   /scripts/       # Build and generation scripts
   /public/        # Static assets served by Vite
   /wasm/          # Rust WASM module
   /wasm/src/      # Rust source code
   /tests/         # Playwright end-to-end tests
   ```

2. **Create package.json** with exact dependency versions:
   ```json
   {
     "name": "urbansynth",
     "version": "6.0.0",
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview",
       "test": "playwright test",
       "lint": "eslint src --ext ts,tsx",
       "format": "prettier --write src/**/*.{ts,tsx}",
       "build:wasm": "cd wasm && wasm-pack build --target web --out-dir ../src/wasm",
       "build:city": "node scripts/generate_city.js"
     }
   }
   ```

3. **Install React + Vite dependencies**:
   - react@^18.2.0, react-dom@^18.2.0
   - vite@^5.0.0, @vitejs/plugin-react@^4.2.0
   - typescript@^5.0.0, @types/react@^18.0.0, @types/react-dom@^18.0.0

4. **Install visualization dependencies**:
   - @deck.gl/core@^9.0.0, @deck.gl/layers@^9.0.0, @deck.gl/react@^9.0.0
   - three@^0.160.0, @types/three@^0.160.0

5. **Install data handling dependencies**:
   - protobufjs@^7.2.0, @types/protobufjs@^6.0.0

6. **Install development dependencies**:
   - eslint@^8.0.0, @typescript-eslint/parser@^6.0.0, @typescript-eslint/eslint-plugin@^6.0.0
   - prettier@^3.0.0
   - @playwright/test@^1.40.0
   - vitest@^1.0.0

7. **Create TypeScript configuration** (tsconfig.json):
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "useDefineForClassFields": true,
       "lib": ["ES2020", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "skipLibCheck": true,
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react-jsx",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true
     },
     "include": ["src"],
     "references": [{ "path": "./tsconfig.node.json" }]
   }
   ```

8. **Create Vite configuration** (vite.config.ts):
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     optimizeDeps: {
       exclude: ['@deck.gl/core', '@deck.gl/layers', '@deck.gl/react']
     },
     server: {
       fs: {
         allow: ['..']
       }
     }
   })
   ```

9. **Create .gitignore**:
   ```
   # Dependencies
   node_modules/

   # Build outputs
   dist/
   build/

   # Environment files
   .env
   .env.local
   .env.production

   # Editor files
   .vscode/
   .idea/
   *.swp
   *.swo
   *~

   # OS files
   .DS_Store
   Thumbs.db

   # Rust/WASM
   target/
   Cargo.lock
   wasm/pkg/
   src/wasm/

   # Generated files
   public/model.pbf
   *.log
   ```

10. **Create index.html**:
    ```html
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>UrbanSynth - Interactive City Simulator</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
    ```

11. **Create src/main.tsx**:
    ```typescript
    import React from 'react'
    import ReactDOM from 'react-dom/client'
    import App from './App'
    import './index.css'

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
    ```

12. **Create src/App.tsx**:
    ```typescript
    import React from 'react'

    function App() {
      return (
        <div className="App">
          <h1>UrbanSynth</h1>
          <p>City simulator loading...</p>
        </div>
      )
    }

    export default App
    ```

13. **Create basic CSS** (src/index.css):
    ```css
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    * {
      box-sizing: border-box;
    }

    #root {
      width: 100vw;
      height: 100vh;
    }
    ```

14. **Initialize Rust WASM project**:
    - Create wasm/Cargo.toml
    - Create wasm/src/lib.rs with basic WASM exports
    - Configure wasm-bindgen dependencies

15. **Create Rust Cargo.toml** (wasm/Cargo.toml):
    ```toml
    [package]
    name = "urbansynth-sim"
    version = "0.1.0"
    edition = "2021"

    [lib]
    crate-type = ["cdylib"]

    [dependencies]
    wasm-bindgen = "0.2"
    js-sys = "0.3"
    web-sys = "0.3"
    console_error_panic_hook = "0.1"
    wee_alloc = "0.4"

    [dependencies.web-sys]
    version = "0.3"
    features = [
      "console",
    ]
    ```

16. **Create basic Rust lib.rs** (wasm/src/lib.rs):
    ```rust
    use wasm_bindgen::prelude::*;

    #[cfg(feature = "wee_alloc")]
    #[global_allocator]
    static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

    #[wasm_bindgen]
    extern "C" {
        fn alert(s: &str);
    }

    #[wasm_bindgen]
    pub fn greet() {
        alert("Hello, UrbanSynth!");
    }

    #[wasm_bindgen(start)]
    pub fn main() {
        console_error_panic_hook::set_once();
    }
    ```

17. **Create placeholder files**:
    - scripts/.gitkeep
    - public/.gitkeep
    - tests/.gitkeep
    - src/components/.gitkeep
    - src/types/.gitkeep

18. **Initialize git repository** if not already present

### Acceptance Criteria
- [ ] All directory structure exists as specified
- [ ] package.json contains all required dependencies with exact versions
- [ ] npm install completes successfully with no errors
- [ ] npm run dev starts development server on localhost
- [ ] TypeScript compilation passes with no errors
- [ ] Rust project compiles successfully with `cargo check` in wasm/ directory
- [ ] wasm-pack can build the initial WASM module
- [ ] Git repository is initialized with proper .gitignore

### Test Plan
Execute from project root directory:

```bash
#!/bin/bash
set -e

echo "🧪 Testing PLAN1: Project Scaffolding"

# Test 1: Verify directory structure
echo "📁 Testing directory structure..."
for dir in src src/components src/types scripts public wasm wasm/src tests; do
  if [ ! -d "$dir" ]; then
    echo "❌ Directory $dir does not exist"
    exit 1
  fi
done
echo "✅ Directory structure complete"

# Test 2: Verify key files exist
echo "📄 Testing key files..."
for file in package.json tsconfig.json vite.config.ts .gitignore index.html src/main.tsx src/App.tsx wasm/Cargo.toml wasm/src/lib.rs; do
  if [ ! -f "$file" ]; then
    echo "❌ File $file does not exist"
    exit 1
  fi
done
echo "✅ Key files present"

# Test 3: Verify package.json is valid JSON
echo "🔍 Testing package.json validity..."
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" || exit 1
echo "✅ package.json is valid"

# Test 4: Test npm install
echo "📦 Testing npm install..."
npm install > /dev/null 2>&1 || exit 1
echo "✅ npm install successful"

# Test 5: Test development server can start
echo "🚀 Testing development server..."
timeout 10s npm run dev > /dev/null 2>&1 &
DEV_PID=$!
sleep 5
if kill -0 $DEV_PID 2>/dev/null; then
  kill $DEV_PID
  echo "✅ Development server starts successfully"
else
  echo "❌ Development server failed to start"
  exit 1
fi

# Test 6: Test TypeScript compilation
echo "🔧 Testing TypeScript compilation..."
npx tsc --noEmit || exit 1
echo "✅ TypeScript compilation successful"

# Test 7: Test Rust compilation
echo "🦀 Testing Rust compilation..."
cd wasm && cargo check > /dev/null 2>&1 || exit 1
cd ..
echo "✅ Rust compilation successful"

# Test 8: Test WASM build
echo "🕸️ Testing WASM build..."
npm run build:wasm > /dev/null 2>&1 || exit 1
if [ -d "src/wasm" ] && [ -f "src/wasm/urbansynth_sim.js" ]; then
  echo "✅ WASM build successful"
else
  echo "❌ WASM build failed or output not found"
  exit 1
fi

echo "🎉 PLAN1 COMPLETED SUCCESSFULLY"
echo "Next: Execute PLAN2 for city generation script"
exit 0
```