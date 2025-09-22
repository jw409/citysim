# Agent Execution Prompt: UrbanSynth - Final Edition

### // META

* **Project Codename:** UrbanSynth
* **Version:** 6.0 (Dynamic Solver Edition)
* **Core Principle:** A beautiful, interactive, and hackable microcosm in the browser where users can not only observe but also solve complex problems.
* **Architecture:** Zero-cost scaling, serverless static web application.
* **Aesthetic:** Vibrant, polished, "SimCity meets modern data-viz." The primary goal is to create a feeling of a living, breathing miniature world that is delightful to observe and influence.

### // OBJECTIVE

Architect and implement a visually stunning, interactive, and entirely client-side city simulator. The project will feature a single, procedurally generated hypothetical city, brought to life with a high-performance agent-based simulation. The user must be able to not only observe and modify the city in real-time but also use an integrated **constraint solver** to analyze the simulation and find optimal solutions to urban planning challenges, such as placing EV charging stations.

---

### // PHASE 1: Procedural City Generation

1.  **Generation Script (`/scripts/generate_city.js`):**
    * Implement a Node.js script that procedurally generates a complete and plausible city model from scratch. This script runs once during the build process.
    * **Generation Logic:** Define zones (downtown, suburbs), generate a realistic road network connecting them, and procedurally place thousands of POIs based on zone type. Use noise algorithms to create natural-looking features like coastlines.
    * **Serialization:** Define a Protocol Buffers (Protobuf v3) schema (`/src/data/city_model.proto`) for the city model. The script's final output will be a single, compressed binary file: `/public/model.pbf`.

2.  **Build Automation (`package.json`):**
    * Define a `"prebuild"` script that executes `generate_city.js`, ensuring the city model is created before the frontend application is built.

---

### // PHASE 2: High-Performance Simulation Core (WASM)

1.  **Engine Implementation (Rust):**
    * Develop the needs-driven, agent-based simulation core in Rust. Agents should have dynamic daily schedules (home, work, shop, leisure) based on the procedurally generated POIs.
    * The engine must be capable of dynamically updating its world state and exporting traffic data for analysis.

2.  **JS/WASM Interface:**
    * Compile the Rust core to a WASM target, optimizing for performance.
    * **Required API Surface:**
        * `init(city_model_buffer, config)`: Initializes the simulation.
        * `tick()`: Advances the simulation by one step.
        * `getAgentStates()`: Returns the current state of all agents for rendering.
        * `getTrafficData()`: Returns aggregated traffic data (e.g., a heatmap of route densities) for the constraint solver.
        * `updateWorld(event)`: Modifies the simulation world in real-time (e.g., adding/removing a POI).
        * `destroy()`: Frees all memory.

---

### // PHASE 3: "Visually Awesome" & Interactive Frontend

1.  **Core Technology & Aesthetics:**
    * **Stack:** SvelteKit or React (using Vite) with `deck.gl` for WebGL rendering.
    * **Map Styling:** Implement a custom, minimalist map style with a "day/night" toggle.
    * **"Cute" Agents:** Render agents as stylized, minimalist 3D vehicle models (cars, buses, trucks).
    * **Polished UX:** The entire interface must be fluid, with polished animations and subtle, satisfying sound effects for key interactions.

2.  **Real-Time Interactivity:**
    * **The Edit Toolbar:** Implement a simple UI toolbar with interactive tools: `Bulldoze`, `Build Office`, `Build Park`.
    * **Dynamic Simulation:** When the user clicks on the map with a tool, the frontend will call the `updateWorld()` function in the WASM module. The simulation must react visibly, with agents altering their routes and changing traffic patterns over time.

---

### // PHASE 4: Dynamic Constraint Solver Demonstration

1.  **Solver Integration:**
    * **Technology:** Integrate a client-side constraint solver library. **Google OR-Tools (compiled to WASM)** is the ideal choice for performance and to fit the project's technical ethos.
    * **UI Trigger:** Add a button to the main UI labeled "**⚡ Optimize EV Network**".

2.  **Optimization Logic:**
    * When the user clicks the "Optimize" button, the application will:
        1.  Call `getTrafficData()` on the WASM module to get the latest traffic density and travel routes from the simulation.
        2.  Feed this data into the constraint solver.
        3.  **Problem Definition:** Formulate the problem to find the optimal placement for a set number (`K`) of EV charging stations.
        4.  **Objective:** Maximize traffic coverage (i.e., ensure the highest number of simulated trips pass near a charger) while minimizing placement cost (e.g., preferring placement along major roads).
        5.  Run the solver client-side.
        6.  Visualize the results by placing stylized, "cute" charging station icons on the map at the optimal locations returned by the solver.

3.  **The Interactive Feedback Loop:**
    * The core demonstration is showing how the optimal solution **adapts**. The user should be encouraged to dramatically alter the city (e.g., build a new residential suburb) and then re-run the optimization. They will visibly see the charging station locations shift to serve the new traffic patterns they created.

---

### // PHASE 5: Developer Experience & Easter Eggs

1.  **Test Hooks & Debugging:**
    * Instrument all interactive DOM elements with `data-testid` attributes for Playwright testing.
    * Expose a `window.simulation` object with helper functions for live console debugging.

2.  **Easter Eggs:**
    * On load, print a stylized ASCII art logo and a welcome message to the developer console.
    * Implement at least two fun easter eggs (e.g., a chaos mode, a secret vehicle model).

---

### // DELIVERABLES

1.  **GitHub Repository:** A link to the final, public GitHub repository.
2.  **Live Deployment:** A publicly accessible URL to the deployed application.
