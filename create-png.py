#!/usr/bin/env python3
from PIL import Image, ImageDraw
import base64
import io

# Create a simple 128x16 icon atlas
img = Image.new('RGBA', (128, 16), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Define icons and their colors
icons = {
    'car': {'x': 0, 'color': (255, 100, 100, 255)},
    'bus': {'x': 16, 'color': (255, 200, 50, 255)},
    'truck': {'x': 32, 'color': (150, 150, 150, 255)},
    'person': {'x': 48, 'color': (100, 150, 255, 255)},
    'plane': {'x': 64, 'color': (255, 255, 255, 255)},
    'helicopter': {'x': 80, 'color': (200, 200, 255, 255)},
    'drone': {'x': 96, 'color': (100, 255, 100, 255)}
}

for name, info in icons.items():
    x = info['x']
    color = info['color']
    
    if name == 'person':
        # Draw person as circle
        draw.ellipse([x+4, 4, x+12, 12], fill=color)
    elif name in ['plane', 'helicopter']:
        # Draw aircraft as triangle
        points = [(x+8, 3), (x+3, 13), (x+13, 13)]
        draw.polygon(points, fill=color)
    else:
        # Draw vehicles as rectangles
        draw.rectangle([x+3, 5, x+13, 11], fill=color)

# Save to public folder
img.save('public/agent-icons.png')

# Also create base64 version for inline use
buffer = io.BytesIO()
img.save(buffer, format='PNG')
buffer.seek(0)
b64 = base64.b64encode(buffer.read()).decode()
print("data:image/png;base64," + b64)
