---
id: PLAN2
title: "Procedural City Generation Script"
dependencies: ["PLAN1"]
status: pending
artifacts:
  - "src/data/city_model.proto"
  - "src/data/city_model.js"
  - "scripts/generate_city.js"
  - "public/model.pbf"
---

### Objective
Create a Node.js script that procedurally generates a complete, believable city model and serializes it to a Protocol Buffers binary file for use by the simulation and visualization systems.

### Task Breakdown

1. **Install additional dependencies**:
   ```bash
   npm install --save-dev protobufjs-cli simplex-noise
   npm install simplex-noise
   ```

2. **Create Protocol Buffers schema** (src/data/city_model.proto):
   ```protobuf
   syntax = "proto3";

   package urbansynth;

   message City {
     string name = 1;
     BoundingBox bounds = 2;
     repeated Zone zones = 3;
     repeated Road roads = 4;
     repeated POI pois = 5;
     repeated Building buildings = 6;
     CityMetadata metadata = 7;
   }

   message BoundingBox {
     float min_x = 1;
     float min_y = 2;
     float max_x = 3;
     float max_y = 4;
   }

   message Zone {
     string id = 1;
     ZoneType type = 2;
     repeated Point2D boundary = 3;
     float density = 4;
     ZoneProperties properties = 5;
   }

   message Road {
     string id = 1;
     RoadType type = 2;
     repeated Point2D path = 3;
     float width = 4;
     int32 lanes = 5;
     float speed_limit = 6;
   }

   message POI {
     string id = 1;
     POIType type = 2;
     Point2D position = 3;
     string zone_id = 4;
     int32 capacity = 5;
     POIProperties properties = 6;
   }

   message Building {
     string id = 1;
     repeated Point2D footprint = 2;
     float height = 3;
     string zone_id = 4;
     BuildingType type = 5;
   }

   message Point2D {
     float x = 1;
     float y = 2;
   }

   message ZoneProperties {
     float residential_density = 1;
     float commercial_density = 2;
     float office_density = 3;
   }

   message POIProperties {
     string name = 1;
     repeated string tags = 2;
   }

   message CityMetadata {
     int64 generation_timestamp = 1;
     string generation_seed = 2;
     int32 total_population = 3;
     float total_area = 4;
   }

   enum ZoneType {
     RESIDENTIAL = 0;
     COMMERCIAL = 1;
     INDUSTRIAL = 2;
     DOWNTOWN = 3;
     PARK = 4;
     WATER = 5;
   }

   enum RoadType {
     HIGHWAY = 0;
     ARTERIAL = 1;
     COLLECTOR = 2;
     LOCAL = 3;
   }

   enum POIType {
     HOME = 0;
     OFFICE = 1;
     SHOP = 2;
     RESTAURANT = 3;
     SCHOOL = 4;
     HOSPITAL = 5;
     PARK_POI = 6;
     FACTORY = 7;
   }

   enum BuildingType {
     HOUSE = 0;
     APARTMENT = 1;
     OFFICE_BUILDING = 2;
     STORE = 3;
     WAREHOUSE = 4;
   }
   ```

3. **Compile Protocol Buffers schema**:
   ```bash
   npx protoc --js_out=import_style=commonjs,binary:src/data/ src/data/city_model.proto
   ```

4. **Create city generation script** (scripts/generate_city.js):
   ```javascript
   import fs from 'fs';
   import path from 'path';
   import { createNoise2D } from 'simplex-noise';
   import protobuf from 'protobufjs';

   const CITY_SIZE = 10000; // 10km x 10km city
   const GENERATION_SEED = 'urbansynth-v1';

   class CityGenerator {
     constructor(seed = GENERATION_SEED) {
       this.seed = seed;
       this.noise = createNoise2D(() => this.hashSeed(seed));
       this.zones = [];
       this.roads = [];
       this.pois = [];
       this.buildings = [];
     }

     hashSeed(seed) {
       let hash = 0;
       for (let i = 0; i < seed.length; i++) {
         const char = seed.charCodeAt(i);
         hash = ((hash << 5) - hash) + char;
         hash = hash & hash; // Convert to 32-bit integer
       }
       return Math.abs(hash) / 2147483647;
     }

     generateCity() {
       console.log('🏙️ Generating city with seed:', this.seed);

       this.generateZones();
       this.generateRoadNetwork();
       this.generatePOIs();
       this.generateBuildings();

       return this.createCityModel();
     }

     generateZones() {
       console.log('📍 Generating zones...');

       // Downtown core
       this.zones.push({
         id: 'downtown',
         type: 3, // DOWNTOWN
         boundary: this.generatePolygon(0, 0, 1500, 8),
         density: 0.9,
         properties: { residential_density: 0.2, commercial_density: 0.6, office_density: 0.8 }
       });

       // Residential suburbs
       for (let i = 0; i < 6; i++) {
         const angle = (i / 6) * Math.PI * 2;
         const distance = 3000 + this.noise(i, 0) * 1000;
         const x = Math.cos(angle) * distance;
         const y = Math.sin(angle) * distance;

         this.zones.push({
           id: `residential_${i}`,
           type: 0, // RESIDENTIAL
           boundary: this.generatePolygon(x, y, 1200, 6),
           density: 0.6,
           properties: { residential_density: 0.8, commercial_density: 0.2, office_density: 0.1 }
         });
       }

       // Commercial districts
       for (let i = 0; i < 4; i++) {
         const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
         const distance = 2000;
         const x = Math.cos(angle) * distance;
         const y = Math.sin(angle) * distance;

         this.zones.push({
           id: `commercial_${i}`,
           type: 1, // COMMERCIAL
           boundary: this.generatePolygon(x, y, 800, 5),
           density: 0.7,
           properties: { residential_density: 0.1, commercial_density: 0.8, office_density: 0.3 }
         });
       }

       // Industrial areas
       for (let i = 0; i < 2; i++) {
         const x = (i === 0 ? -1 : 1) * 4000;
         const y = 2000 + this.noise(i + 10, 0) * 1000;

         this.zones.push({
           id: `industrial_${i}`,
           type: 2, // INDUSTRIAL
           boundary: this.generatePolygon(x, y, 1500, 4),
           density: 0.4,
           properties: { residential_density: 0.05, commercial_density: 0.1, office_density: 0.2 }
         });
       }

       // Parks
       for (let i = 0; i < 3; i++) {
         const angle = (i / 3) * Math.PI * 2;
         const distance = 1500;
         const x = Math.cos(angle) * distance;
         const y = Math.sin(angle) * distance;

         this.zones.push({
           id: `park_${i}`,
           type: 4, // PARK
           boundary: this.generatePolygon(x, y, 600, 8),
           density: 0.1,
           properties: { residential_density: 0, commercial_density: 0, office_density: 0 }
         });
       }
     }

     generatePolygon(centerX, centerY, radius, sides) {
       const points = [];
       for (let i = 0; i < sides; i++) {
         const angle = (i / sides) * Math.PI * 2;
         const noiseOffset = this.noise(centerX + i, centerY + i) * 0.3;
         const r = radius * (1 + noiseOffset);
         points.push({
           x: centerX + Math.cos(angle) * r,
           y: centerY + Math.sin(angle) * r
         });
       }
       return points;
     }

     generateRoadNetwork() {
       console.log('🛣️ Generating road network...');

       // Major highways (ring road)
       const ringRadius = 3500;
       const ringPoints = [];
       for (let i = 0; i <= 32; i++) {
         const angle = (i / 32) * Math.PI * 2;
         ringPoints.push({
           x: Math.cos(angle) * ringRadius,
           y: Math.sin(angle) * ringRadius
         });
       }
       this.roads.push({
         id: 'ring_highway',
         type: 0, // HIGHWAY
         path: ringPoints,
         width: 20,
         lanes: 6,
         speed_limit: 80
       });

       // Arterial roads connecting zones
       this.zones.forEach((zone, i) => {
         if (zone.type !== 4) { // Not parks
           const centerX = zone.boundary.reduce((sum, p) => sum + p.x, 0) / zone.boundary.length;
           const centerY = zone.boundary.reduce((sum, p) => sum + p.y, 0) / zone.boundary.length;

           // Connect to downtown
           this.roads.push({
             id: `arterial_to_${zone.id}`,
             type: 1, // ARTERIAL
             path: [
               { x: 0, y: 0 },
               { x: centerX * 0.7, y: centerY * 0.7 },
               { x: centerX, y: centerY }
             ],
             width: 12,
             lanes: 4,
             speed_limit: 60
           });
         }
       });

       // Local roads within zones
       this.zones.forEach(zone => {
         if (zone.type === 0 || zone.type === 1) { // Residential or commercial
           const centerX = zone.boundary.reduce((sum, p) => sum + p.x, 0) / zone.boundary.length;
           const centerY = zone.boundary.reduce((sum, p) => sum + p.y, 0) / zone.boundary.length;

           // Grid of local roads
           for (let i = 0; i < 3; i++) {
             for (let j = 0; j < 3; j++) {
               const offsetX = (i - 1) * 400;
               const offsetY = (j - 1) * 400;

               this.roads.push({
                 id: `local_${zone.id}_${i}_${j}`,
                 type: 3, // LOCAL
                 path: [
                   { x: centerX + offsetX - 200, y: centerY + offsetY },
                   { x: centerX + offsetX + 200, y: centerY + offsetY }
                 ],
                 width: 6,
                 lanes: 2,
                 speed_limit: 30
               });
             }
           }
         }
       });
     }

     generatePOIs() {
       console.log('📍 Generating points of interest...');

       this.zones.forEach(zone => {
         const centerX = zone.boundary.reduce((sum, p) => sum + p.x, 0) / zone.boundary.length;
         const centerY = zone.boundary.reduce((sum, p) => sum + p.y, 0) / zone.boundary.length;
         const poiCount = Math.floor(zone.density * 50);

         for (let i = 0; i < poiCount; i++) {
           const angle = Math.random() * Math.PI * 2;
           const distance = Math.random() * 500;
           const x = centerX + Math.cos(angle) * distance;
           const y = centerY + Math.sin(angle) * distance;

           let poiType;
           switch (zone.type) {
             case 0: // RESIDENTIAL
               poiType = Math.random() < 0.8 ? 0 : 2; // HOME or SHOP
               break;
             case 1: // COMMERCIAL
               poiType = Math.random() < 0.6 ? 2 : 3; // SHOP or RESTAURANT
               break;
             case 2: // INDUSTRIAL
               poiType = 7; // FACTORY
               break;
             case 3: // DOWNTOWN
               poiType = Math.random() < 0.5 ? 1 : 2; // OFFICE or SHOP
               break;
             case 4: // PARK
               poiType = 6; // PARK_POI
               break;
             default:
               poiType = 0;
           }

           this.pois.push({
             id: `poi_${zone.id}_${i}`,
             type: poiType,
             position: { x, y },
             zone_id: zone.id,
             capacity: Math.floor(Math.random() * 100) + 10,
             properties: {
               name: this.generatePOIName(poiType),
               tags: []
             }
           });
         }
       });
     }

     generatePOIName(type) {
       const names = {
         0: ['Home', 'Residence', 'House'],
         1: ['Office', 'Corporation', 'Business Center'],
         2: ['Shop', 'Store', 'Market'],
         3: ['Restaurant', 'Cafe', 'Diner'],
         4: ['School', 'Academy', 'University'],
         5: ['Hospital', 'Clinic', 'Medical Center'],
         6: ['Park', 'Garden', 'Green Space'],
         7: ['Factory', 'Plant', 'Facility']
       };
       const typeNames = names[type] || ['Location'];
       return typeNames[Math.floor(Math.random() * typeNames.length)];
     }

     generateBuildings() {
       console.log('🏢 Generating buildings...');

       // Generate buildings for high-density POIs
       this.pois.forEach((poi, i) => {
         if (poi.capacity > 50) {
           const footprint = this.generatePolygon(poi.position.x, poi.position.y, 50, 4);
           const height = 30 + Math.random() * 100;

           this.buildings.push({
             id: `building_${i}`,
             footprint,
             height,
             zone_id: poi.zone_id,
             type: this.getBuildingType(poi.type)
           });
         }
       });
     }

     getBuildingType(poiType) {
       const mapping = {
         0: 0, // HOME -> HOUSE
         1: 2, // OFFICE -> OFFICE_BUILDING
         2: 3, // SHOP -> STORE
         7: 4  // FACTORY -> WAREHOUSE
       };
       return mapping[poiType] || 0;
     }

     createCityModel() {
       return {
         name: 'UrbanSynth City',
         bounds: {
           min_x: -CITY_SIZE / 2,
           min_y: -CITY_SIZE / 2,
           max_x: CITY_SIZE / 2,
           max_y: CITY_SIZE / 2
         },
         zones: this.zones,
         roads: this.roads,
         pois: this.pois,
         buildings: this.buildings,
         metadata: {
           generation_timestamp: Date.now(),
           generation_seed: this.seed,
           total_population: this.pois.filter(p => p.type === 0).length * 3,
           total_area: CITY_SIZE * CITY_SIZE
         }
       };
     }
   }

   async function main() {
     try {
       // Load protobuf schema
       const root = await protobuf.load('./src/data/city_model.proto');
       const City = root.lookupType('urbansynth.City');

       // Generate city
       const generator = new CityGenerator();
       const cityData = generator.generateCity();

       // Validate the message
       const errMsg = City.verify(cityData);
       if (errMsg) throw Error(errMsg);

       // Create message and encode to binary
       const message = City.create(cityData);
       const buffer = City.encode(message).finish();

       // Write to file
       const outputPath = './public/model.pbf';
       fs.writeFileSync(outputPath, buffer);

       console.log(`✅ City model generated successfully!`);
       console.log(`📊 Stats:`);
       console.log(`   - Zones: ${cityData.zones.length}`);
       console.log(`   - Roads: ${cityData.roads.length}`);
       console.log(`   - POIs: ${cityData.pois.length}`);
       console.log(`   - Buildings: ${cityData.buildings.length}`);
       console.log(`   - File size: ${(buffer.length / 1024).toFixed(1)} KB`);
       console.log(`   - Output: ${outputPath}`);

     } catch (error) {
       console.error('❌ City generation failed:', error);
       process.exit(1);
     }
   }

   main();
   ```

5. **Update package.json scripts**:
   Add to the existing scripts section:
   ```json
   "prebuild": "npm run build:city && npm run build:wasm",
   "build:city": "node scripts/generate_city.js",
   "protoc": "npx protoc --js_out=import_style=commonjs,binary:src/data/ src/data/city_model.proto"
   ```

6. **Create directory structure**:
   ```bash
   mkdir -p src/data
   mkdir -p public
   mkdir -p scripts
   ```

### Acceptance Criteria
- [ ] Protocol Buffers schema file exists at src/data/city_model.proto
- [ ] Compiled JavaScript protobuf files exist in src/data/
- [ ] City generation script exists at scripts/generate_city.js
- [ ] npm run build:city completes successfully
- [ ] Output file public/model.pbf is created and is not empty
- [ ] Generated city contains reasonable numbers of zones, roads, and POIs
- [ ] Protobuf file can be decoded and validated

### Test Plan
Execute from project root directory:

```bash
#!/bin/bash
set -e

echo "🧪 Testing PLAN2: Procedural City Generation"

# Test 1: Verify protobuf schema exists
echo "📋 Testing protobuf schema..."
if [ ! -f "src/data/city_model.proto" ]; then
  echo "❌ Protobuf schema not found"
  exit 1
fi
echo "✅ Protobuf schema exists"

# Test 2: Compile protobuf schema
echo "🔨 Testing protobuf compilation..."
npm run protoc > /dev/null 2>&1 || exit 1
if [ ! -f "src/data/city_model.js" ]; then
  echo "❌ Compiled protobuf file not found"
  exit 1
fi
echo "✅ Protobuf compilation successful"

# Test 3: Verify generation script exists
echo "📝 Testing generation script..."
if [ ! -f "scripts/generate_city.js" ]; then
  echo "❌ Generation script not found"
  exit 1
fi
echo "✅ Generation script exists"

# Test 4: Run city generation
echo "🏙️ Testing city generation..."
npm run build:city || exit 1
echo "✅ City generation completed"

# Test 5: Verify output file
echo "📄 Testing output file..."
if [ ! -f "public/model.pbf" ]; then
  echo "❌ Output file public/model.pbf not found"
  exit 1
fi

# Check file is not empty
if [ ! -s "public/model.pbf" ]; then
  echo "❌ Output file is empty"
  exit 1
fi

FILE_SIZE=$(wc -c < "public/model.pbf")
if [ $FILE_SIZE -lt 1000 ]; then
  echo "❌ Output file too small (${FILE_SIZE} bytes)"
  exit 1
fi
echo "✅ Output file valid (${FILE_SIZE} bytes)"

# Test 6: Validate protobuf content (Node.js test)
echo "🔍 Testing protobuf validation..."
node -e "
  const fs = require('fs');
  const protobuf = require('protobufjs');

  (async () => {
    try {
      const root = await protobuf.load('./src/data/city_model.proto');
      const City = root.lookupType('urbansynth.City');
      const buffer = fs.readFileSync('./public/model.pbf');
      const message = City.decode(buffer);
      const object = City.toObject(message);

      console.log('🏙️ City validation results:');
      console.log('   - Zones:', object.zones.length);
      console.log('   - Roads:', object.roads.length);
      console.log('   - POIs:', object.pois.length);
      console.log('   - Buildings:', object.buildings.length);

      if (object.zones.length < 5) throw new Error('Too few zones generated');
      if (object.roads.length < 10) throw new Error('Too few roads generated');
      if (object.pois.length < 50) throw new Error('Too few POIs generated');

      console.log('✅ Protobuf content validation passed');
    } catch (error) {
      console.error('❌ Protobuf validation failed:', error.message);
      process.exit(1);
    }
  })();
" || exit 1

echo "🎉 PLAN2 COMPLETED SUCCESSFULLY"
echo "Next: Execute PLAN3 for WASM simulation core"
exit 0
```