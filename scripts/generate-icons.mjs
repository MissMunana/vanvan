import sharp from 'sharp'

function createIconSvg(size, maskable = false) {
  const s = size
  const cx = s / 2
  const cy = s * 0.46
  const cornerR = maskable ? s * 0.02 : s * 0.22

  // Star geometry - plump, rounded
  const outerR = s * 0.30
  const innerR = outerR * 0.46

  // Generate smooth rounded star path
  const rawPts = []
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 10
    const r = i % 2 === 0 ? outerR : innerR
    rawPts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }

  // Catmull-Rom spline for smooth curves
  function catmullRom(pts, steps = 12) {
    const result = []
    const n = pts.length
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n]
      const p1 = pts[i]
      const p2 = pts[(i + 1) % n]
      const p3 = pts[(i + 2) % n]
      for (let t = 0; t < steps; t++) {
        const tt = t / steps
        const t2 = tt * tt, t3 = t2 * tt
        result.push([
          0.5 * (2*p1[0] + (-p0[0]+p2[0])*tt + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
          0.5 * (2*p1[1] + (-p0[1]+p2[1])*tt + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3),
        ])
      }
    }
    return result
  }

  // Round toward circle for plumpness
  const smoothPts = catmullRom(rawPts, 16)
  const avgR = (outerR + innerR) / 2
  const roundFactor = 0.15
  const finalPts = smoothPts.map(([x, y]) => {
    const dx = x - cx, dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return [x, y]
    const cx2 = cx + avgR * dx / dist
    const cy2 = cy + avgR * dy / dist
    return [x * (1 - roundFactor) + cx2 * roundFactor, y * (1 - roundFactor) + cy2 * roundFactor]
  })

  const starPath = `M ${finalPts[0][0]} ${finalPts[0][1]} ` +
    finalPts.slice(1).map(p => `L ${p[0]} ${p[1]}`).join(' ') + ' Z'

  // Slightly smaller star for highlight
  const hlPts = finalPts.map(([x, y]) => {
    const dx = x - cx, dy = y - cy
    return [cx + dx * 0.92, cy + dy * 0.92 - s * 0.008]
  })
  const hlPath = `M ${hlPts[0][0]} ${hlPts[0][1]} ` +
    hlPts.slice(1).map(p => `L ${p[0]} ${p[1]}`).join(' ') + ' Z'

  // Even smaller for inner glow
  const glowPts = finalPts.map(([x, y]) => {
    const dx = x - cx, dy = y - cy
    return [cx + dx * 0.75, cy + dy * 0.75 - s * 0.01]
  })
  const glowPath = `M ${glowPts[0][0]} ${glowPts[0][1]} ` +
    glowPts.slice(1).map(p => `L ${p[0]} ${p[1]}`).join(' ') + ' Z'

  // 4-point sparkle
  const sparkle = (sx, sy, sz, opacity = 0.85) => {
    const a = sz, b = sz * 0.28
    return `<path d="M ${sx} ${sy-a} C ${sx+b} ${sy-b}, ${sx+b} ${sy-b}, ${sx+a} ${sy} C ${sx+b} ${sy+b}, ${sx+b} ${sy+b}, ${sx} ${sy+a} C ${sx-b} ${sy+b}, ${sx-b} ${sy+b}, ${sx-a} ${sy} C ${sx-b} ${sy-b}, ${sx-b} ${sy-b}, ${sx} ${sy-a} Z" fill="white" opacity="${opacity}"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
  <defs>
    <!-- Rich background gradient -->
    <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFE082"/>
      <stop offset="35%" stop-color="#FFD54F"/>
      <stop offset="70%" stop-color="#FFB300"/>
      <stop offset="100%" stop-color="#FF9800"/>
    </linearGradient>

    <!-- Top-left light wash -->
    <radialGradient id="bgLight" cx="0.25" cy="0.2" r="0.7">
      <stop offset="0%" stop-color="white" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>

    <!-- Bottom-right warm shadow -->
    <radialGradient id="bgDark" cx="0.8" cy="0.85" r="0.5">
      <stop offset="0%" stop-color="#E65100" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#E65100" stop-opacity="0"/>
    </radialGradient>

    <!-- Star body gradient - warm 3D -->
    <linearGradient id="starBody" x1="0.3" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#FFFDF5"/>
      <stop offset="40%" stop-color="#FFF9E6"/>
      <stop offset="100%" stop-color="#FFE9A0"/>
    </linearGradient>

    <!-- Star top highlight - glossy -->
    <linearGradient id="starHighlight" x1="0.5" y1="0" x2="0.5" y2="0.6">
      <stop offset="0%" stop-color="white" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="white" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>

    <!-- Star inner glow -->
    <radialGradient id="starInnerGlow" cx="0.45" cy="0.38" r="0.4">
      <stop offset="0%" stop-color="white" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>

    <!-- Star rim light (edge highlight) -->
    <radialGradient id="rimLight" cx="0.3" cy="0.2" r="0.8">
      <stop offset="0%" stop-color="white" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="white" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#FFB300" stop-opacity="0.05"/>
    </radialGradient>

    <!-- Shadow filter -->
    <filter id="starShadow" x="-15%" y="-10%" width="130%" height="140%">
      <feDropShadow dx="0" dy="${s*0.015}" stdDeviation="${s*0.025}" flood-color="#BF6C00" flood-opacity="0.35"/>
    </filter>

    <!-- Soft outer glow -->
    <filter id="outerGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${s*0.015}"/>
    </filter>

    <!-- Sparkle glow -->
    <filter id="sparkleGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${s*0.004}"/>
    </filter>

    <!-- Blush filter -->
    <filter id="blush" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${s*0.015}"/>
    </filter>

    <!-- Eye shadow -->
    <filter id="eyeShadow">
      <feDropShadow dx="0" dy="${s*0.002}" stdDeviation="${s*0.003}" flood-color="#5D4037" flood-opacity="0.2"/>
    </filter>

    <!-- Clip for glossy overlay -->
    <clipPath id="starClip">
      <path d="${starPath}"/>
    </clipPath>
  </defs>

  <!-- === BACKGROUND === -->
  <rect width="${s}" height="${s}" rx="${cornerR}" ry="${cornerR}" fill="url(#bg1)"/>
  <rect width="${s}" height="${s}" rx="${cornerR}" ry="${cornerR}" fill="url(#bgLight)"/>
  <rect width="${s}" height="${s}" rx="${cornerR}" ry="${cornerR}" fill="url(#bgDark)"/>

  <!-- Subtle inner border for depth -->
  <rect x="${s*0.01}" y="${s*0.01}" width="${s*0.98}" height="${s*0.98}" rx="${Math.max(cornerR-s*0.01, 0)}" ry="${Math.max(cornerR-s*0.01, 0)}" fill="none" stroke="white" stroke-opacity="0.15" stroke-width="${s*0.004}"/>

  <!-- === STAR OUTER GLOW === -->
  <path d="${starPath}" fill="#FFF8E1" opacity="0.4" filter="url(#outerGlow)"/>

  <!-- === STAR WITH SHADOW === -->
  <g filter="url(#starShadow)">
    <!-- Star base -->
    <path d="${starPath}" fill="url(#starBody)"/>
  </g>

  <!-- Star edge/rim highlight -->
  <path d="${starPath}" fill="url(#rimLight)"/>

  <!-- Glossy overlay on top half -->
  <g clip-path="url(#starClip)">
    <ellipse cx="${cx}" cy="${cy - outerR * 0.35}" rx="${outerR * 0.85}" ry="${outerR * 0.55}" fill="url(#starHighlight)"/>
  </g>

  <!-- Inner glow center -->
  <path d="${glowPath}" fill="url(#starInnerGlow)" opacity="0.6"/>

  <!-- Subtle bottom edge shadow inside star -->
  <g clip-path="url(#starClip)">
    <ellipse cx="${cx}" cy="${cy + outerR * 0.7}" rx="${outerR * 0.6}" ry="${outerR * 0.2}" fill="#E8A000" opacity="0.08"/>
  </g>

  <!-- === CUTE FACE === -->
  <g filter="url(#eyeShadow)">
    <!-- Left eye -->
    <ellipse cx="${cx - outerR*0.21}" cy="${cy + outerR*0.01}" rx="${outerR*0.058}" ry="${outerR*0.068}" fill="#4E342E"/>
    <!-- Right eye -->
    <ellipse cx="${cx + outerR*0.21}" cy="${cy + outerR*0.01}" rx="${outerR*0.058}" ry="${outerR*0.068}" fill="#4E342E"/>
  </g>

  <!-- Eye highlights - big -->
  <ellipse cx="${cx - outerR*0.23}" cy="${cy - outerR*0.02}" rx="${outerR*0.028}" ry="${outerR*0.032}" fill="white"/>
  <ellipse cx="${cx + outerR*0.19}" cy="${cy - outerR*0.02}" rx="${outerR*0.028}" ry="${outerR*0.032}" fill="white"/>

  <!-- Eye highlights - small -->
  <circle cx="${cx - outerR*0.19}" cy="${cy + outerR*0.03}" r="${outerR*0.013}" fill="white" opacity="0.7"/>
  <circle cx="${cx + outerR*0.23}" cy="${cy + outerR*0.03}" r="${outerR*0.013}" fill="white" opacity="0.7"/>

  <!-- Blush -->
  <ellipse cx="${cx - outerR*0.35}" cy="${cy + outerR*0.10}" rx="${outerR*0.085}" ry="${outerR*0.055}" fill="#FF6E6E" opacity="0.3" filter="url(#blush)"/>
  <ellipse cx="${cx + outerR*0.35}" cy="${cy + outerR*0.10}" rx="${outerR*0.085}" ry="${outerR*0.055}" fill="#FF6E6E" opacity="0.3" filter="url(#blush)"/>

  <!-- Smile -->
  <path d="M ${cx - outerR*0.10} ${cy + outerR*0.10} Q ${cx} ${cy + outerR*0.20} ${cx + outerR*0.10} ${cy + outerR*0.10}"
    stroke="#5D4037" stroke-width="${outerR*0.025}" stroke-linecap="round" fill="none" opacity="0.85"/>

  <!-- === SPARKLES === -->
  <g filter="url(#sparkleGlow)">
    ${sparkle(cx + s*0.30, cy - s*0.24, s*0.028, 0.9)}
    ${sparkle(cx - s*0.33, cy - s*0.16, s*0.020, 0.75)}
    ${sparkle(cx + s*0.24, cy + s*0.30, s*0.017, 0.7)}
    ${sparkle(cx - s*0.27, cy + s*0.28, s*0.022, 0.65)}
    ${sparkle(cx + s*0.06, cy - s*0.37, s*0.014, 0.6)}
    ${sparkle(cx - s*0.15, cy + s*0.36, s*0.012, 0.5)}
  </g>

  <!-- Tiny round sparkle dots -->
  <circle cx="${cx + s*0.37}" cy="${cy - s*0.05}" r="${s*0.006}" fill="white" opacity="0.5"/>
  <circle cx="${cx - s*0.39}" cy="${cy + s*0.08}" r="${s*0.005}" fill="white" opacity="0.4"/>
  <circle cx="${cx + s*0.12}" cy="${cy + s*0.38}" r="${s*0.005}" fill="white" opacity="0.45"/>
  <circle cx="${cx - s*0.08}" cy="${cy - s*0.40}" r="${s*0.004}" fill="white" opacity="0.35"/>
  <circle cx="${cx + s*0.35}" cy="${cy + s*0.18}" r="${s*0.004}" fill="white" opacity="0.4"/>

</svg>`
}

async function generateHighQuality(targetSize, outputPath, maskable = false) {
  const renderSize = 1024
  const svg = createIconSvg(renderSize, maskable)
  await sharp(Buffer.from(svg))
    .resize(targetSize, targetSize, { kernel: 'lanczos3' })
    .png({ quality: 100 })
    .toFile(outputPath)
  console.log(`Generated: ${outputPath} (${targetSize}x${targetSize})`)
}

const base = 'public'
await generateHighQuality(180, `${base}/apple-touch-icon-180x180.png`)
await generateHighQuality(192, `${base}/pwa-192x192.png`)
await generateHighQuality(512, `${base}/pwa-512x512.png`)
await generateHighQuality(512, `${base}/maskable-icon-512x512.png`, true)

console.log('\nAll icons generated!')
