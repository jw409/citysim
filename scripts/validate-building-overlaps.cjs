const fs = require('fs');
const protobuf = require('protobufjs');

/**
 * Mathematical validation script to detect building overlaps
 */

async function validateBuildingOverlaps() {
  try {
    console.log('🔍 Loading city model for overlap analysis...');

    // Load protobuf schema
    const root = await protobuf.load('./src/data/city_model.proto');
    const City = root.lookupType('urbansynth.City');

    // Load the city model
    const buffer = fs.readFileSync('./public/model.pbf');
    const cityData = City.decode(buffer);

    console.log(`📊 Analyzing ${cityData.buildings.length} buildings for overlaps...`);

    const overlaps = [];
    const buildings = cityData.buildings;

    // Check every building against every other building
    for (let i = 0; i < buildings.length; i++) {
      const buildingA = buildings[i];
      if (!buildingA.footprint || buildingA.footprint.length < 3) continue;

      for (let j = i + 1; j < buildings.length; j++) {
        const buildingB = buildings[j];
        if (!buildingB.footprint || buildingB.footprint.length < 3) continue;

        if (polygonsOverlap(buildingA.footprint, buildingB.footprint)) {
          overlaps.push({
            buildingA: buildingA.id,
            buildingB: buildingB.id,
            zoneA: buildingA.zone_id || 'unknown',
            zoneB: buildingB.zone_id || 'unknown',
            footprintA: buildingA.footprint,
            footprintB: buildingB.footprint,
            distance: getPolygonDistance(buildingA.footprint, buildingB.footprint)
          });
        }
      }

      // Progress indicator
      if (i % 50 === 0) {
        console.log(`  Checked ${i}/${buildings.length} buildings...`);
      }
    }

    console.log(`\n📋 OVERLAP ANALYSIS RESULTS:`);
    console.log(`   Total buildings: ${buildings.length}`);
    console.log(`   Overlapping pairs: ${overlaps.length}`);

    if (overlaps.length > 0) {
      console.log(`\n❌ OVERLAPS DETECTED:`);
      overlaps.slice(0, 10).forEach((overlap, i) => {
        console.log(`   ${i+1}. ${overlap.buildingA} <-> ${overlap.buildingB}`);
        console.log(`      Zones: ${overlap.zoneA} <-> ${overlap.zoneB}`);
        console.log(`      Distance: ${overlap.distance.toFixed(2)}m`);
      });

      if (overlaps.length > 10) {
        console.log(`   ... and ${overlaps.length - 10} more overlaps`);
      }
    } else {
      console.log(`\n✅ NO OVERLAPS DETECTED - All buildings properly spaced!`);
    }

    // Analyze building type distribution for color debugging
    console.log(`\n🎨 BUILDING TYPE ANALYSIS:`);
    const typeCount = {};
    const zoneTypeCount = {};

    buildings.forEach(building => {
      const type = building.type || 'undefined';
      const zone = building.zone_id || 'undefined';

      typeCount[type] = (typeCount[type] || 0) + 1;
      zoneTypeCount[zone] = (zoneTypeCount[zone] || 0) + 1;
    });

    console.log(`   Building types:`, typeCount);
    console.log(`   Zone distribution:`, Object.keys(zoneTypeCount).length + ' zones');

    return overlaps.length === 0;

  } catch (error) {
    console.error('❌ Validation failed:', error);
    return false;
  }
}

/**
 * Check if two polygons overlap using SAT (Separating Axis Theorem)
 */
function polygonsOverlap(polyA, polyB) {
  // Convert to simple bounding box check first (faster)
  const boundsA = getPolygonBounds(polyA);
  const boundsB = getPolygonBounds(polyB);

  if (!boundingBoxesOverlap(boundsA, boundsB)) {
    return false; // No bounding box overlap = no polygon overlap
  }

  // More precise polygon overlap test
  return pointInPolygon(polyA[0], polyB) ||
         pointInPolygon(polyB[0], polyA) ||
         polygonEdgesIntersect(polyA, polyB);
}

/**
 * Get bounding box of polygon
 */
function getPolygonBounds(polygon) {
  const xs = polygon.map(p => p.x);
  const ys = polygon.map(p => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

/**
 * Check if bounding boxes overlap
 */
function boundingBoxesOverlap(a, b) {
  return !(a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY);
}

/**
 * Point in polygon test
 */
function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
        (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Check if polygon edges intersect
 */
function polygonEdgesIntersect(polyA, polyB) {
  for (let i = 0; i < polyA.length; i++) {
    const a1 = polyA[i];
    const a2 = polyA[(i + 1) % polyA.length];

    for (let j = 0; j < polyB.length; j++) {
      const b1 = polyB[j];
      const b2 = polyB[(j + 1) % polyB.length];

      if (lineSegmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if two line segments intersect
 */
function lineSegmentsIntersect(p1, p2, p3, p4) {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 0.0001) return false; // Parallel lines

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

/**
 * Get distance between polygon centers
 */
function getPolygonDistance(polyA, polyB) {
  const centerA = getPolygonCenter(polyA);
  const centerB = getPolygonCenter(polyB);
  return Math.sqrt(Math.pow(centerB.x - centerA.x, 2) + Math.pow(centerB.y - centerA.y, 2));
}

/**
 * Get polygon center point
 */
function getPolygonCenter(polygon) {
  const x = polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length;
  const y = polygon.reduce((sum, p) => sum + p.y, 0) / polygon.length;
  return { x, y };
}

// Run the validation
validateBuildingOverlaps().then(success => {
  console.log(success ? '\n✅ Validation passed!' : '\n❌ Validation failed!');
  process.exit(success ? 0 : 1);
});