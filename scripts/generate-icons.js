const fs = require('fs');
const path = require('path');

// SVG content for the Slice icon with a background
const createIconSVG = (size, bgColor = '#3b82f6', iconColor = '#ffffff') => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}" rx="${size * 0.1}" />
  <g transform="translate(${size * 0.2}, ${size * 0.2}) scale(${size * 0.6 / 24})">
    <path d="m8 14-6 6h9v-3" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18.37 3.63 8 14l3 3L21.37 6.63a2 2 0 0 0-3-3z" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

// Generate icon files
const icons = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

const publicDir = path.join(__dirname, '..', 'public');

// Create SVG files that can be converted to PNG
icons.forEach(({ name, size }) => {
  const svgContent = createIconSVG(size);
  const svgName = name.replace('.png', '.svg');
  fs.writeFileSync(path.join(publicDir, svgName), svgContent);
  console.log(`Created ${svgName} (${size}x${size})`);
});

// Also create a colored version of the slice icon
const coloredSliceIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <rect width="24" height="24" fill="#3b82f6" rx="4" />
  <g transform="translate(3, 3) scale(0.75)">
    <path d="m8 14-6 6h9v-3" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18.37 3.63 8 14l3 3L21.37 6.63a2 2 0 0 0-3-3z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), coloredSliceIcon);
console.log('Created favicon.svg');

console.log('\nNote: You\'ll need to convert the SVG files to PNG format.');
console.log('You can use an online converter or a tool like ImageMagick:');
console.log('  convert icon-192.svg icon-192.png');
console.log('  convert icon-512.svg icon-512.png');
console.log('  convert apple-touch-icon.svg apple-touch-icon.png');