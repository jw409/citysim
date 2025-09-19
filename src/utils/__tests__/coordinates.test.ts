import { describe, it, expect } from 'vitest';
import { localToLatLng, convertPointsToLatLng, getBoundsFromCityModel } from '../coordinates';

describe('Coordinate Utilities', () => {
  describe('localToLatLng', () => {
    it('should convert local coordinates to lat/lng', () => {
      const [lng, lat] = localToLatLng(0, 0);
      expect(lng).toBeCloseTo(-74.006, 4);
      expect(lat).toBeCloseTo(40.7128, 4);
    });

    it('should handle positive offsets', () => {
      const [lng, lat] = localToLatLng(1000, 1000);
      expect(lng).toBeGreaterThan(-74.006);
      expect(lat).toBeGreaterThan(40.7128);
    });
  });

  describe('convertPointsToLatLng', () => {
    it('should convert array of points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];
      const result = convertPointsToLatLng(points);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(2);
    });

    it('should handle empty array', () => {
      const result = convertPointsToLatLng([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getBoundsFromCityModel', () => {
    it('should return default view for model without bounds', () => {
      const cityModel = { zones: [], roads: [], buildings: [] };
      const bounds = getBoundsFromCityModel(cityModel);

      expect(bounds).toHaveProperty('longitude');
      expect(bounds).toHaveProperty('latitude');
      expect(bounds).toHaveProperty('zoom');
      expect(bounds.zoom).toBeGreaterThan(0);
    });

    it('should calculate bounds from city model bounds', () => {
      const cityModel = {
        bounds: { min_x: 0, min_y: 0, max_x: 1000, max_y: 1000 },
        zones: [],
        roads: [],
        buildings: [],
      };
      const bounds = getBoundsFromCityModel(cityModel);

      expect(bounds.zoom).toBeGreaterThan(10);
      expect(bounds.pitch).toBe(45);
      expect(bounds.bearing).toBe(0);
    });
  });
});
