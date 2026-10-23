import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" stop-color="#1b1e2a" />
      <stop offset="70%" stop-color="#0c0e14" />
      <stop offset="100%" stop-color="#07080c" />
    </radialGradient>
    <linearGradient id="neonRed" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b8001f" />
      <stop offset="50%" stop-color="#e50914" />
      <stop offset="100%" stop-color="#ff3b56" />
    </linearGradient>
    <linearGradient id="curveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(229, 9, 20, 0)" />
      <stop offset="60%" stop-color="rgba(229, 9, 20, 0.4)" />
      <stop offset="100%" stop-color="#ff3b56" />
    </linearGradient>
    <linearGradient id="planeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#f0f2f5" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>
    <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff2a44" />
      <stop offset="100%" stop-color="#990014" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)" />

  <!-- Subtle Radar Circles -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="2" />
  <circle cx="256" cy="256" r="120" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="2" />
  <circle cx="256" cy="256" r="60" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="2" />

  <!-- Grid / Coordinate Lines -->
  <line x1="80" y1="410" x2="432" y2="410" stroke="rgba(255, 255, 255, 0.12)" stroke-width="3" stroke-dasharray="6 6" />
  <line x1="100" y1="90" x2="100" y2="410" stroke="rgba(255, 255, 255, 0.12)" stroke-width="3" />

  <!-- Exponential Aviator Curve Area -->
  <path d="M 100 410 Q 230 400, 310 320 T 400 150 L 400 410 Z" fill="url(#curveGrad)" opacity="0.3" />
  <!-- Curve Stroke with Glow -->
  <path d="M 100 410 Q 230 400, 310 320 T 400 150" fill="none" stroke="url(#neonRed)" stroke-width="8" stroke-linecap="round" filter="url(#glow)" />

  <!-- Flying Aviator Jet Plane -->
  <g transform="translate(390, 150) rotate(-35) scale(1.15)">
    <!-- Exhaust Glow -->
    <ellipse cx="-45" cy="0" rx="20" ry="6" fill="#ff4d4d" filter="url(#glow)" opacity="0.85" />
    <!-- Jet Body -->
    <path d="M 45 0 Q 20 -8, -35 -6 Q -40 0, -35 6 Q 20 8, 45 0 Z" fill="url(#planeGrad)" />
    <!-- Cockpit Canopy -->
    <ellipse cx="10" cy="-1" rx="14" ry="4" fill="#0f172a" />
    <!-- Main Left Wing -->
    <path d="M -5 -4 L -30 -38 L -15 -38 L 15 -4 Z" fill="url(#wingGrad)" />
    <!-- Main Right Wing (Slightly perspective) -->
    <path d="M -5 4 L -25 28 L -12 28 L 15 4 Z" fill="#b91c1c" />
    <!-- Tail Fin -->
    <path d="M -32 -2 L -48 -22 L -38 -22 L -24 -2 Z" fill="url(#wingGrad)" />
  </g>

  <!-- Multiplier Badge (Top Left / Safe Zone) -->
  <g transform="translate(130, 130)">
    <rect x="-45" y="-22" width="90" height="44" rx="22" fill="#c026d3" filter="url(#glow)" opacity="0.9" />
    <text x="0" y="7" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="1">100X</text>
  </g>

  <!-- AI Pulse Badge (Bottom Right) -->
  <g transform="translate(256, 440)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#f43f5e" text-anchor="middle" letter-spacing="3">AVIATOR AI PRO</text>
  </g>
</svg>`;

const maskableSvg = svgContent; // Has 15% inner padding naturally with rx=110 and centered contents

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

  const svgBuffer = Buffer.from(svgContent);

  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Icons generated successfully!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
