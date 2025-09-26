/**
 * Terrain Texture Generator - Creates procedural terrain textures for realistic ground materials
 */

export interface TerrainTextureConfig {
  type: 'grass' | 'dirt' | 'rock' | 'concrete' | 'asphalt' | 'sand' | 'forest' | 'wetland' | 'snow' | 'gravel';
  width: number;
  height: number;
  baseColor: string;
  accentColors: string[];
  pattern: {
    type: 'organic' | 'geometric' | 'noise' | 'mixed';
    scale: number;
    density: number;
    variation: number;
  };
  materials: {
    roughness: number;
    metallic: number;
    normal: number;
    ambient: number;
    diffuse: number;
    specular: number;
  };
}

export class TerrainTextureAtlas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private textureConfigs: Record<string, TerrainTextureConfig>;
  private atlasSize: number;
  private textureRegions: Record<string, { x: number; y: number; width: number; height: number }>;

  constructor(atlasSize: number = 2048) {
    this.atlasSize = atlasSize;
    this.canvas = document.createElement('canvas');
    this.canvas.width = atlasSize;
    this.canvas.height = atlasSize;
    this.ctx = this.canvas.getContext('2d')!;
    this.textureRegions = {};
    this.textureConfigs = {}; // Initialize here
    this.initializeTextureConfigs();
  }

  private initializeTextureConfigs() {
    const textureSize = this.atlasSize / 4; // 4x3 grid for 12 textures

    this.textureConfigs = {
      // Natural terrain textures
      lush_grass: {
        type: 'grass',
        width: textureSize,
        height: textureSize,
        baseColor: '#4A7C59',
        accentColors: ['#3D6B4A', '#5A8B6B', '#2F5233', '#6B9B7C'],
        pattern: {
          type: 'organic',
          scale: 0.8,
          density: 0.7,
          variation: 0.9
        },
        materials: {
          roughness: 0.9,
          metallic: 0.0,
          normal: 0.3,
          ambient: 0.5,
          diffuse: 0.8,
          specular: 0.1
        }
      },
      dry_grass: {
        type: 'grass',
        width: textureSize,
        height: textureSize,
        baseColor: '#8B7355',
        accentColors: ['#A0845C', '#7A6B47', '#6B5D42', '#9C8660'],
        pattern: {
          type: 'organic',
          scale: 0.6,
          density: 0.5,
          variation: 0.8
        },
        materials: {
          roughness: 0.8,
          metallic: 0.0,
          normal: 0.2,
          ambient: 0.6,
          diffuse: 0.7,
          specular: 0.1
        }
      },
      rich_soil: {
        type: 'dirt',
        width: textureSize,
        height: textureSize,
        baseColor: '#8B4513',
        accentColors: ['#A0522D', '#654321', '#D2691E', '#CD853F'],
        pattern: {
          type: 'noise',
          scale: 0.4,
          density: 0.8,
          variation: 0.6
        },
        materials: {
          roughness: 1.0,
          metallic: 0.0,
          normal: 0.4,
          ambient: 0.4,
          diffuse: 0.9,
          specular: 0.05
        }
      },
      rocky_terrain: {
        type: 'rock',
        width: textureSize,
        height: textureSize,
        baseColor: '#696969',
        accentColors: ['#778899', '#556B2F', '#2F4F4F', '#8B7D6B'],
        pattern: {
          type: 'geometric',
          scale: 1.2,
          density: 0.6,
          variation: 0.7
        },
        materials: {
          roughness: 0.7,
          metallic: 0.1,
          normal: 0.8,
          ambient: 0.3,
          diffuse: 0.8,
          specular: 0.3
        }
      },
      mountain_stone: {
        type: 'rock',
        width: textureSize,
        height: textureSize,
        baseColor: '#5F5F5F',
        accentColors: ['#708090', '#2F2F2F', '#696969', '#4A4A4A'],
        pattern: {
          type: 'mixed',
          scale: 1.5,
          density: 0.4,
          variation: 0.9
        },
        materials: {
          roughness: 0.6,
          metallic: 0.2,
          normal: 1.0,
          ambient: 0.2,
          diffuse: 0.9,
          specular: 0.4
        }
      },

      // Urban terrain textures
      smooth_concrete: {
        type: 'concrete',
        width: textureSize,
        height: textureSize,
        baseColor: '#C0C0C0',
        accentColors: ['#D3D3D3', '#A9A9A9', '#DCDCDC', '#B0B0B0'],
        pattern: {
          type: 'geometric',
          scale: 0.2,
          density: 0.3,
          variation: 0.4
        },
        materials: {
          roughness: 0.4,
          metallic: 0.0,
          normal: 0.2,
          ambient: 0.6,
          diffuse: 0.8,
          specular: 0.2
        }
      },
      weathered_concrete: {
        type: 'concrete',
        width: textureSize,
        height: textureSize,
        baseColor: '#A0A0A0',
        accentColors: ['#909090', '#B0B0B0', '#808080', '#C0C0C0'],
        pattern: {
          type: 'noise',
          scale: 0.6,
          density: 0.5,
          variation: 0.7
        },
        materials: {
          roughness: 0.8,
          metallic: 0.0,
          normal: 0.4,
          ambient: 0.4,
          diffuse: 0.9,
          specular: 0.1
        }
      },
      dark_asphalt: {
        type: 'asphalt',
        width: textureSize,
        height: textureSize,
        baseColor: '#2F2F2F',
        accentColors: ['#404040', '#1A1A1A', '#333333', '#4A4A4A'],
        pattern: {
          type: 'noise',
          scale: 0.3,
          density: 0.4,
          variation: 0.5
        },
        materials: {
          roughness: 0.9,
          metallic: 0.0,
          normal: 0.3,
          ambient: 0.3,
          diffuse: 0.7,
          specular: 0.1
        }
      },

      // Specialized terrain textures
      forest_floor: {
        type: 'forest',
        width: textureSize,
        height: textureSize,
        baseColor: '#228B22',
        accentColors: ['#32CD32', '#006400', '#8FBC8F', '#2E7D32'],
        pattern: {
          type: 'organic',
          scale: 1.0,
          density: 0.9,
          variation: 1.0
        },
        materials: {
          roughness: 1.0,
          metallic: 0.0,
          normal: 0.5,
          ambient: 0.3,
          diffuse: 0.9,
          specular: 0.05
        }
      },
      sandy_beach: {
        type: 'sand',
        width: textureSize,
        height: textureSize,
        baseColor: '#F4A460',
        accentColors: ['#DEB887', '#D2B48C', '#F5DEB3', '#CD853F'],
        pattern: {
          type: 'noise',
          scale: 0.5,
          density: 0.6,
          variation: 0.4
        },
        materials: {
          roughness: 0.8,
          metallic: 0.0,
          normal: 0.2,
          ambient: 0.7,
          diffuse: 0.8,
          specular: 0.1
        }
      },
      marsh_wetland: {
        type: 'wetland',
        width: textureSize,
        height: textureSize,
        baseColor: '#556B2F',
        accentColors: ['#6B8E23', '#808000', '#9ACD32', '#8FBC8F'],
        pattern: {
          type: 'mixed',
          scale: 0.9,
          density: 0.7,
          variation: 0.8
        },
        materials: {
          roughness: 0.9,
          metallic: 0.0,
          normal: 0.4,
          ambient: 0.4,
          diffuse: 0.8,
          specular: 0.3
        }
      },
      coarse_gravel: {
        type: 'gravel',
        width: textureSize,
        height: textureSize,
        baseColor: '#808080',
        accentColors: ['#A9A9A9', '#696969', '#778899', '#708090'],
        pattern: {
          type: 'geometric',
          scale: 0.8,
          density: 0.8,
          variation: 0.6
        },
        materials: {
          roughness: 0.9,
          metallic: 0.1,
          normal: 0.6,
          ambient: 0.5,
          diffuse: 0.8,
          specular: 0.2
        }
      }
    };
  }

  public generateAtlas(): HTMLCanvasElement {
    // Clear canvas with neutral background
    this.ctx.fillStyle = '#404040';
    this.ctx.fillRect(0, 0, this.atlasSize, this.atlasSize);

    const textureSize = this.atlasSize / 4;
    const configs = Object.entries(this.textureConfigs);

    configs.forEach(([name, config], index) => {
      const x = (index % 4) * textureSize;
      const y = Math.floor(index / 4) * textureSize;

      this.generateTerrainTexture(config, x, y);

      // Store texture region for UV mapping
      this.textureRegions[name] = {
        x: x / this.atlasSize,
        y: y / this.atlasSize,
        width: textureSize / this.atlasSize,
        height: textureSize / this.atlasSize
      };
    });

    return this.canvas;
  }

  private generateTerrainTexture(config: TerrainTextureConfig, offsetX: number, offsetY: number) {
    const { width, height, baseColor, accentColors, pattern } = config;

    // Draw base color
    this.ctx.fillStyle = baseColor;
    this.ctx.fillRect(offsetX, offsetY, width, height);

    // Apply pattern based on type
    switch (pattern.type) {
      case 'organic':
        this.applyOrganicPattern(config, offsetX, offsetY, width, height);
        break;
      case 'geometric':
        this.applyGeometricPattern(config, offsetX, offsetY, width, height);
        break;
      case 'noise':
        this.applyNoisePattern(config, offsetX, offsetY, width, height);
        break;
      case 'mixed':
        this.applyMixedPattern(config, offsetX, offsetY, width, height);
        break;
    }

    // Add surface details and lighting
    this.addSurfaceDetails(config, offsetX, offsetY, width, height);
  }

  private applyOrganicPattern(config: TerrainTextureConfig, x: number, y: number, width: number, height: number) {
    const { accentColors, pattern } = config;
    // Use accentColors to avoid unused variable warning
    const colorCount = accentColors.length;

    // Create organic, irregular patterns like grass clumps or natural variations
    for (let i = 0; i < width * height * pattern.density * 0.01; i++) {
      const centerX = x + Math.random() * width;
      const centerY = y + Math.random() * height;
      const radius = (5 + Math.random() * 15) * pattern.scale;
      const color = accentColors[Math.floor(Math.random() * colorCount)];

      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 0.3 + Math.random() * 0.4;

      // Draw irregular organic shape
      this.ctx.beginPath();
      const points = 8 + Math.floor(Math.random() * 8);
      for (let j = 0; j < points; j++) {
        const angle = (j / points) * Math.PI * 2;
        const r = radius * (0.7 + Math.random() * 0.6);
        const px = centerX + Math.cos(angle) * r;
        const py = centerY + Math.sin(angle) * r;

        if (j === 0) {
          this.ctx.moveTo(px, py);
        } else {
          this.ctx.lineTo(px, py);
        }
      }
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1.0;
  }

  private applyGeometricPattern(config: TerrainTextureConfig, x: number, y: number, width: number, height: number) {
    const { accentColors, pattern } = config;

    // Create geometric patterns like rock formations or concrete patterns
    const tileSize = 20 * pattern.scale;
    const tilesX = Math.floor(width / tileSize);
    const tilesY = Math.floor(height / tileSize);

    for (let tx = 0; tx < tilesX; tx++) {
      for (let ty = 0; ty < tilesY; ty++) {
        if (Math.random() < pattern.density) {
          const tileX = x + tx * tileSize;
          const tileY = y + ty * tileSize;
          const color = accentColors[Math.floor(Math.random() * accentColors.length)];

          this.ctx.fillStyle = color;
          this.ctx.globalAlpha = 0.2 + Math.random() * 0.3;

          // Draw geometric shapes (rectangles, triangles, or polygons)
          if (Math.random() < 0.5) {
            // Rectangle
            this.ctx.fillRect(
              tileX + Math.random() * tileSize * 0.3,
              tileY + Math.random() * tileSize * 0.3,
              tileSize * (0.4 + Math.random() * 0.3),
              tileSize * (0.4 + Math.random() * 0.3)
            );
          } else {
            // Triangle or polygon
            this.ctx.beginPath();
            const sides = 3 + Math.floor(Math.random() * 3);
            const centerX = tileX + tileSize * 0.5;
            const centerY = tileY + tileSize * 0.5;
            const radius = tileSize * 0.3;

            for (let i = 0; i < sides; i++) {
              const angle = (i / sides) * Math.PI * 2;
              const px = centerX + Math.cos(angle) * radius;
              const py = centerY + Math.sin(angle) * radius;

              if (i === 0) {
                this.ctx.moveTo(px, py);
              } else {
                this.ctx.lineTo(px, py);
              }
            }
            this.ctx.closePath();
            this.ctx.fill();
          }
        }
      }
    }

    this.ctx.globalAlpha = 1.0;
  }

  private applyNoisePattern(config: TerrainTextureConfig, x: number, y: number, width: number, height: number) {
    // Apply procedural noise for natural-looking variation
    const imageData = this.ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    const { pattern } = config;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const index = (py * width + px) * 4;

        // Generate multi-octave noise
        const noiseX = (px + x) * pattern.scale * 0.01;
        const noiseY = (py + y) * pattern.scale * 0.01;

        const noise1 = this.simpleNoise(noiseX, noiseY) * 0.5;
        const noise2 = this.simpleNoise(noiseX * 2, noiseY * 2) * 0.3;
        const noise3 = this.simpleNoise(noiseX * 4, noiseY * 4) * 0.2;

        const totalNoise = (noise1 + noise2 + noise3) * pattern.variation;
        const variation = totalNoise * 60; // ±30 brightness variation

        data[index] = Math.max(0, Math.min(255, data[index] + variation));     // R
        data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + variation)); // G
        data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + variation)); // B
      }
    }

    this.ctx.putImageData(imageData, x, y);
  }

  private applyMixedPattern(config: TerrainTextureConfig, x: number, y: number, width: number, height: number) {
    // Combine multiple pattern types for complex terrain
    this.applyNoisePattern(config, x, y, width, height);

    // Reduce density for organic overlay
    const organicConfig = { ...config };
    organicConfig.pattern = { ...config.pattern, density: config.pattern.density * 0.3 };
    this.applyOrganicPattern(organicConfig, x, y, width, height);
  }

  private addSurfaceDetails(config: TerrainTextureConfig, x: number, y: number, width: number, height: number) {
    const { materials, accentColors } = config;

    // Add surface features based on material type
    switch (config.type) {
      case 'grass':
        this.addGrassDetails(x, y, width, height, accentColors, materials);
        break;
      case 'rock':
        this.addRockDetails(x, y, width, height, accentColors, materials);
        break;
      case 'concrete':
        this.addConcreteDetails(x, y, width, height, accentColors, materials);
        break;
      case 'dirt':
        this.addDirtDetails(x, y, width, height, accentColors, materials);
        break;
      case 'asphalt':
        this.addAsphaltDetails(x, y, width, height, accentColors, materials);
        break;
    }
  }

  private addGrassDetails(x: number, y: number, width: number, height: number, colors: string[], _materials: any) {
    // Add grass blade details
    for (let i = 0; i < width * height * 0.002; i++) {
      const px = x + Math.random() * width;
      const py = y + Math.random() * height;

      this.ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
      this.ctx.lineWidth = 0.5;
      this.ctx.globalAlpha = 0.4;

      this.ctx.beginPath();
      this.ctx.moveTo(px, py);
      this.ctx.lineTo(px + (Math.random() - 0.5) * 4, py - Math.random() * 8);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1.0;
  }

  private addRockDetails(x: number, y: number, width: number, height: number, colors: string[], _materials: any) {
    // Add rock cracks and mineral veins
    for (let i = 0; i < 10; i++) {
      const startX = x + Math.random() * width;
      const startY = y + Math.random() * height;

      this.ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
      this.ctx.lineWidth = 1 + Math.random() * 2;
      this.ctx.globalAlpha = 0.3;

      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);

      let currentX = startX;
      let currentY = startY;
      const segments = 3 + Math.floor(Math.random() * 5);

      for (let j = 0; j < segments; j++) {
        currentX += (Math.random() - 0.5) * 20;
        currentY += (Math.random() - 0.5) * 20;
        this.ctx.lineTo(currentX, currentY);
      }

      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1.0;
  }

  private addConcreteDetails(x: number, y: number, width: number, height: number, colors: string[], _materials: any) {
    // Add concrete seams and wear patterns
    const seams = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < seams; i++) {
      this.ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
      this.ctx.lineWidth = 1;
      this.ctx.globalAlpha = 0.5;

      if (Math.random() < 0.5) {
        // Horizontal seam
        const seamY = y + Math.random() * height;
        this.ctx.beginPath();
        this.ctx.moveTo(x, seamY);
        this.ctx.lineTo(x + width, seamY);
        this.ctx.stroke();
      } else {
        // Vertical seam
        const seamX = x + Math.random() * width;
        this.ctx.beginPath();
        this.ctx.moveTo(seamX, y);
        this.ctx.lineTo(seamX, y + height);
        this.ctx.stroke();
      }
    }

    this.ctx.globalAlpha = 1.0;
  }

  private addDirtDetails(x: number, y: number, width: number, height: number, colors: string[], _materials: any) {
    // Add dirt clumps and pebbles
    for (let i = 0; i < width * height * 0.001; i++) {
      const px = x + Math.random() * width;
      const py = y + Math.random() * height;
      const radius = 1 + Math.random() * 3;

      this.ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      this.ctx.globalAlpha = 0.4;

      this.ctx.beginPath();
      this.ctx.arc(px, py, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1.0;
  }

  private addAsphaltDetails(x: number, y: number, width: number, height: number, colors: string[], _materials: any) {
    // Add asphalt aggregate and wear patterns
    for (let i = 0; i < width * height * 0.003; i++) {
      const px = x + Math.random() * width;
      const py = y + Math.random() * height;
      const size = 0.5 + Math.random() * 1.5;

      this.ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      this.ctx.globalAlpha = 0.3;

      this.ctx.fillRect(px, py, size, size);
    }

    this.ctx.globalAlpha = 1.0;
  }

  private simpleNoise(x: number, y: number): number {
    // Simple noise function for texture generation
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1; // Return -1 to 1
  }

  public getTextureRegions(): Record<string, { x: number; y: number; width: number; height: number }> {
    return this.textureRegions;
  }

  public getTextureConfig(textureKey: string): TerrainTextureConfig | undefined {
    return this.textureConfigs[textureKey];
  }

  public getTextureURL(): string {
    return this.canvas.toDataURL('image/png');
  }

  public downloadAtlas(filename: string = 'terrain-texture-atlas.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.getTextureURL();
    link.click();
  }
}

// Utility function to determine appropriate terrain texture based on elevation, slope, and urban factors
export function getTerrainTextureKey(elevation: number, slope: number, urbanFactor: number, distanceFromWater: number = 1000): string {
  // Water proximity factor
  const nearWater = distanceFromWater < 500;

  if (elevation < -2) {
    return 'marsh_wetland';
  }

  if (urbanFactor > 0.7) {
    // Highly urban areas
    return elevation > 10 ? 'weathered_concrete' : 'smooth_concrete';
  } else if (urbanFactor > 0.3) {
    // Suburban areas
    return elevation > 5 ? 'dry_grass' : 'dark_asphalt';
  }

  // Natural terrain based on elevation and slope
  if (elevation > 150) {
    return slope > 0.3 ? 'mountain_stone' : 'rocky_terrain';
  } else if (elevation > 80) {
    return slope > 0.2 ? 'rocky_terrain' : 'dry_grass';
  } else if (elevation > 30) {
    return 'forest_floor';
  } else if (elevation > 10) {
    return nearWater ? 'marsh_wetland' : 'lush_grass';
  } else if (elevation > 0) {
    return nearWater ? 'sandy_beach' : 'rich_soil';
  } else {
    return 'marsh_wetland';
  }
}

// Enhanced noise functions for better terrain generation
export class TerrainNoiseGenerator {
  private static permutation: number[] = [];

  static {
    // Initialize permutation table for Perlin noise
    for (let i = 0; i < 256; i++) {
      TerrainNoiseGenerator.permutation[i] = Math.floor(Math.random() * 256);
    }
  }

  public static perlinNoise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = TerrainNoiseGenerator.fade(x);
    const v = TerrainNoiseGenerator.fade(y);

    const A = TerrainNoiseGenerator.permutation[X] + Y;
    const B = TerrainNoiseGenerator.permutation[X + 1] + Y;

    return TerrainNoiseGenerator.lerp(v,
      TerrainNoiseGenerator.lerp(u,
        TerrainNoiseGenerator.grad(TerrainNoiseGenerator.permutation[A], x, y),
        TerrainNoiseGenerator.grad(TerrainNoiseGenerator.permutation[B], x - 1, y)
      ),
      TerrainNoiseGenerator.lerp(u,
        TerrainNoiseGenerator.grad(TerrainNoiseGenerator.permutation[A + 1], x, y - 1),
        TerrainNoiseGenerator.grad(TerrainNoiseGenerator.permutation[B + 1], x - 1, y - 1)
      )
    );
  }

  public static fractionalBrownianMotion(x: number, y: number, octaves: number = 4, persistence: number = 0.5, scale: number = 1): number {
    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += TerrainNoiseGenerator.perlinNoise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return value / maxValue;
  }

  public static ridgedNoise(x: number, y: number, octaves: number = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;

    for (let i = 0; i < octaves; i++) {
      const n = Math.abs(TerrainNoiseGenerator.perlinNoise(x * frequency, y * frequency));
      value += (1 - n) * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value;
  }

  private static fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private static lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private static grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}