import * as THREE from 'three'

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function createVisorBackgroundTexture(accent = '#5ec8f2') {
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const cy = size / 2

  const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.72)
  base.addColorStop(0, '#0c1a2a')
  base.addColorStop(0.4, '#060c14')
  base.addColorStop(1, '#020408')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = rgba(accent, 0.07)
  ctx.lineWidth = 1.5
  for (let radius = 100; radius < size * 0.48; radius += 120) {
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.strokeStyle = rgba(accent, 0.05)
  ctx.beginPath()
  ctx.moveTo(0, cy)
  ctx.lineTo(size, cy)
  ctx.moveTo(cx, 0)
  ctx.lineTo(cx, size)
  ctx.stroke()

  ctx.strokeStyle = rgba(accent, 0.04)
  for (let angle = 0; angle < Math.PI; angle += Math.PI / 6) {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * size * 0.5, cy + Math.sin(angle) * size * 0.5)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx - Math.cos(angle) * size * 0.5, cy - Math.sin(angle) * size * 0.5)
    ctx.stroke()
  }

  for (let y = 0; y < size; y += 3) {
    ctx.fillStyle = rgba(accent, y % 6 === 0 ? 0.028 : 0.012)
    ctx.fillRect(0, y, size, 1)
  }

  const gridStep = 96
  ctx.strokeStyle = rgba(accent, 0.025)
  ctx.lineWidth = 1
  for (let x = 0; x <= size; x += gridStep) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, size)
    ctx.stroke()
  }
  for (let y = 0; y <= size; y += gridStep) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y)
    ctx.stroke()
  }

  for (let i = 0; i < 140; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const alpha = 0.08 + Math.random() * 0.28
    ctx.fillStyle = `rgba(210, 235, 255, ${alpha})`
    ctx.fillRect(x, y, 1.5, 1.5)
  }

  const vignette = ctx.createRadialGradient(cx, cy, size * 0.18, cx, cy, size * 0.78)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.72)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, size, size)

  const edgeGlow = ctx.createRadialGradient(cx, cy, size * 0.52, cx, cy, size * 0.74)
  edgeGlow.addColorStop(0, 'rgba(0, 0, 0, 0)')
  edgeGlow.addColorStop(1, rgba(accent, 0.08))
  ctx.fillStyle = edgeGlow
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function setSceneBackground(scene, accent = '#5ec8f2') {
  if (scene.background?.isCanvasTexture || scene.background?.isTexture) {
    scene.background.dispose()
  }

  scene.background = createVisorBackgroundTexture(accent)
  return scene.background
}
