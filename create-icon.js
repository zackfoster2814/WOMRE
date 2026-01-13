const fs = require('fs');
const path = require('path');

// Create a simple 1024x1024 PNG with gradient
const { createCanvas } = require('canvas');
const canvas = createCanvas(1024, 1024);
const ctx = canvas.getContext('2d');

// Create gradient
const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
gradient.addColorStop(0, '#60a5fa');
gradient.addColorStop(0.5, '#a78bfa');
gradient.addColorStop(1, '#f472b6');

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 1024, 1024);

// Add circle
ctx.fillStyle = 'white';
ctx.beginPath();
ctx.arc(512, 512, 400, 0, Math.PI * 2);
ctx.fill();

// Save
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('src-tauri/app-icon.png', buffer);
console.log('Icon created successfully!');
