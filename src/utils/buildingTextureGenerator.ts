/**
 * Building Texture Generator - Creates procedural building textures with window patterns
 */

export interface BuildingTextureConfig {
  type: 'office' | 'residential' | 'commercial' | 'industrial' | 'mixed';
  width: number;
  height: number;
  windowPattern: {
    rows: number;
    cols: number;
    windowWidth: number;
    windowHeight: number;
    spacing: number;
  };
  colors: {
    wall: string;
    window: string;
    windowFrame: string;
    accent: string;
  };
}

export class BuildingTextureAtlas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private textureConfigs: Record<string, BuildingTextureConfig>;
  private atlasSize: number;
  private textureRegions: Record<string, { x: number; y: number; width: number; height: number }>;

  constructor(atlasSize: number = 1024) {
    this.atlasSize = atlasSize;
    this.canvas = document.createElement('canvas');
    this.canvas.width = atlasSize;
    this.canvas.height = atlasSize;
    this.ctx = this.canvas.getContext('2d')!;
    this.textureRegions = {};
    this.initializeTextureConfigs();
  }

  private initializeTextureConfigs() {
    const textureSize = this.atlasSize / 3; // 3x2 grid for 6 textures

    this.textureConfigs = {
      office_glass: {
        type: 'office',
        width: textureSize,
        height: textureSize,
        windowPattern: {
          rows: 20,
          cols: 6,
          windowWidth: 0.8,
          windowHeight: 0.8,
          spacing: 0.1
        },
        colors: {
          wall: '#B0C4DE',      // Light steel blue
          window: '#2F4F4F',    // Dark slate gray (reflective glass)
          windowFrame: '#708090', // Slate gray
          accent: '#4682B4'     // Steel blue
        }
      },
      residential_brick: {
        type: 'residential',
        width: textureSize,
        height: textureSize,
        windowPattern: {
          rows: 12,
          cols: 4,
          windowWidth: 0.6,
          windowHeight: 0.7,
          spacing: 0.15
        },
        colors: {
          wall: '#CD853F',      // Peru (brick color)
          window: '#1E1E1E',    // Dark gray
          windowFrame: '#FFFFFF', // White frames
          accent: '#8B4513'     // Saddle brown
        }
      },
      commercial_mixed: {
        type: 'commercial',
        width: textureSize,
        height: textureSize,
        windowPattern: {
          rows: 8,
          cols: 8,
          windowWidth: 0.9,
          windowHeight: 0.9,
          spacing: 0.05
        },
        colors: {
          wall: '#F5F5DC',      // Beige
          window: '#000080',    // Navy blue (tinted glass)
          windowFrame: '#C0C0C0', // Silver
          accent: '#DAA520'     // Goldenrod
        }
      },
      industrial_concrete: {
        type: 'industrial',
        width: textureSize,
        height: textureSize,
        windowPattern: {
          rows: 6,
          cols: 3,
          windowWidth: 0.7,
          windowHeight: 0.5,
          spacing: 0.2
        },
        colors: {
          wall: '#696969',      // Dim gray (concrete)
          window: '#2F2F2F',    // Dark gray
          windowFrame: '#808080', // Gray
          accent: '#556B2F'     // Dark olive green
        }
      },
      mixed_modern: {
        type: 'mixed',
        width: textureSize,
        height: textureSize,
        windowPattern: {
          rows: 15,
          cols: 5,
          windowWidth: 0.75,
          windowHeight: 0.85,
          spacing: 0.1
        },
        colors: {
          wall: '#DCDCDC',      // Gainsboro (light gray)
          window: '#191970',    // Midnight blue
          windowFrame: '#FF6347', // Tomato (accent color)
          accent: '#4169E1'     // Royal blue
        }
      },
      luxury_tower: {
        type: 'office',
        width: textureSize,
        height: textureSize,
        windowPattern: {
          rows: 25,
          cols: 8,
          windowWidth: 0.95,
          windowHeight: 0.9,
          spacing: 0.02
        },
        colors: {
          wall: '#2F4F4F',      // Dark slate gray (premium)
          window: '#000000',    // Black (high-end glass)
          windowFrame: '#FFD700', // Gold frames
          accent: '#1C1C1C'     // Almost black
        }
      }
    };
  }

  public generateAtlas(): HTMLCanvasElement {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.atlasSize, this.atlasSize);

    const textureSize = this.atlasSize / 3;
    const configs = Object.entries(this.textureConfigs);

    configs.forEach(([name, config], index) => {
      const x = (index % 3) * textureSize;
      const y = Math.floor(index / 3) * textureSize;

      this.generateBuildingTexture(config, x, y);

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

  private generateBuildingTexture(config: BuildingTextureConfig, offsetX: number, offsetY: number) {
    const { width, height, windowPattern, colors } = config;

    // Draw base wall color
    this.ctx.fillStyle = colors.wall;
    this.ctx.fillRect(offsetX, offsetY, width, height);

    // Add wall texture pattern
    this.addWallTexture(colors, offsetX, offsetY, width, height);

    // Draw window grid
    this.drawWindowGrid(windowPattern, colors, offsetX, offsetY, width, height);

    // Add building details
    this.addBuildingDetails(config, offsetX, offsetY, width, height);
  }

  private addWallTexture(colors: any, x: number, y: number, width: number, height: number) {
    // Add subtle wall texture variation
    const imageData = this.ctx.getImageData(x, y, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const variation = (Math.random() - 0.5) * 20; // ±10 brightness variation
      data[i] = Math.max(0, Math.min(255, data[i] + variation));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + variation)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + variation)); // B
    }

    this.ctx.putImageData(imageData, x, y);
  }

  private drawWindowGrid(pattern: any, colors: any, offsetX: number, offsetY: number, width: number, height: number) {
    const windowWidth = (width / pattern.cols) * pattern.windowWidth;
    const windowHeight = (height / pattern.rows) * pattern.windowHeight;
    const spacingX = width / pattern.cols;
    const spacingY = height / pattern.rows;

    for (let row = 0; row < pattern.rows; row++) {
      for (let col = 0; col < pattern.cols; col++) {
        const x = offsetX + col * spacingX + (spacingX - windowWidth) / 2;
        const y = offsetY + row * spacingY + (spacingY - windowHeight) / 2;

        // Draw window frame
        this.ctx.fillStyle = colors.windowFrame;
        this.ctx.fillRect(x - 1, y - 1, windowWidth + 2, windowHeight + 2);

        // Draw window glass
        this.ctx.fillStyle = colors.window;
        this.ctx.fillRect(x, y, windowWidth, windowHeight);

        // Add window lighting effect (random lit windows)
        if (Math.random() > 0.7) {
          this.ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
          this.ctx.fillRect(x, y, windowWidth, windowHeight);
        }

        // Add window divisions (cross pattern)
        this.ctx.strokeStyle = colors.windowFrame;
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x + windowWidth / 2, y);
        this.ctx.lineTo(x + windowWidth / 2, y + windowHeight);
        this.ctx.moveTo(x, y + windowHeight / 2);
        this.ctx.lineTo(x + windowWidth, y + windowHeight / 2);
        this.ctx.stroke();
      }
    }
  }

  private addBuildingDetails(config: BuildingTextureConfig, x: number, y: number, width: number, height: number) {
    // Add accent stripes for modern buildings
    if (config.type === 'office' || config.type === 'mixed') {
      this.ctx.fillStyle = config.colors.accent;
      // Vertical accent lines
      for (let i = 0; i < 3; i++) {
        const lineX = x + (width / 4) * (i + 1);
        this.ctx.fillRect(lineX, y, 2, height);
      }
    }

    // Add rooftop elements
    this.ctx.fillStyle = config.colors.accent;
    this.ctx.fillRect(x + width * 0.3, y, width * 0.4, height * 0.05); // Rooftop structure

    // Add ground floor distinction for commercial buildings
    if (config.type === 'commercial' || config.type === 'mixed') {
      this.ctx.fillStyle = config.colors.accent;
      this.ctx.fillRect(x, y + height * 0.85, width, height * 0.15);
    }
  }

  public getTextureRegions(): Record<string, { x: number; y: number; width: number; height: number }> {
    return this.textureRegions;
  }

  public getTextureURL(): string {
    return this.canvas.toDataURL('image/png');
  }

  public downloadAtlas(filename: string = 'building-texture-atlas.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.getTextureURL();
    link.click();
  }
}

// Utility function to get appropriate texture for building type and height
export function getBuildingTextureKey(buildingType: string, height: number): string {
  switch (buildingType.toLowerCase()) {
    case 'office':
      return height > 200 ? 'luxury_tower' : 'office_glass';
    case 'residential':
      return 'residential_brick';
    case 'commercial':
      return 'commercial_mixed';
    case 'industrial':
      return 'industrial_concrete';
    case 'mixed':
      return 'mixed_modern';
    default:
      return height > 100 ? 'office_glass' : 'residential_brick';
  }
}