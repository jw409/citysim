const fs = require('fs');

// Create a simple HTML canvas approach to generate icons
const html = `<!DOCTYPE html>
<html>
<head><title>Create Icons</title></head>
<body>
<canvas id="canvas" width="128" height="16"></canvas>
<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Clear background
ctx.fillStyle = 'rgba(0,0,0,0)';
ctx.fillRect(0, 0, 128, 16);

// Define icons
const icons = [
  {x: 0, color: '#ff6464', type: 'car'},      // red car
  {x: 16, color: '#ffc832', type: 'bus'},     // yellow bus  
  {x: 32, color: '#969696', type: 'truck'},   // gray truck
  {x: 48, color: '#6496ff', type: 'person'},  // blue person
];

icons.forEach(icon => {
  ctx.fillStyle = icon.color;
  if (icon.type === 'person') {
    // Draw circle for person
    ctx.beginPath();
    ctx.arc(icon.x + 8, 8, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Draw rectangle for vehicles
    ctx.fillRect(icon.x + 2, 4, 12, 8);
  }
});

// Convert to data URL and log it
const dataURL = canvas.toDataURL('image/png');
console.log('ICON_DATA_URL:' + dataURL);
</script>
</body>
</html>`;

fs.writeFileSync('temp-icons.html', html);
console.log('Created temp-icons.html - will extract data URL');
