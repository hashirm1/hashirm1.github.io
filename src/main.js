import './style.css'
import * as THREE from 'three'
import { switchHomeVersion } from './home-version.js'
import { METROID_THEMES, STANDBY_THEME } from './metroid-themes.js'
import { setSceneBackground } from './scene-background.js'

const SPHERE_RADIUS = 8
const LATITUDE_LINES = 9
const DOTS_PER_LATITUDE = 24
const ROTATION_SPEED = 0.002
const DEFAULT_ACCENT_HEX = STANDBY_THEME.accentHex
const OUTLINE_RADIUS = SPHERE_RADIUS + 0.15
const OUTLINE_WIDTH = 0.14
const LINE_LENGTH = SPHERE_RADIUS * 2
const LINE_THICKNESS = 0.1
const NODE_WIDTH = 6.4
const NODE_HEIGHT = 2.8
const CAMERA_DISTANCE = 50
const CAMERA_FOV = 75
const NODE_SPRING = 32
const NODE_DAMPING = 14
const NODE_DRAG = 6

const NODE_ATTACHMENTS = [
  { phi: 0, theta: 0, label: 'home', href: '/', themeId: 'home' },
  { phi: Math.PI, theta: 0, label: 'bio', href: '/photos/', themeId: 'bio' },
  { phi: Math.PI / 2, theta: 0, label: 'photos', href: '/photos/', themeId: 'photos' },
  {
    phi: Math.PI / 2,
    theta: (2 * Math.PI) / 3,
    label: 'project',
    href: '/projects/',
    themeId: 'project',
  },
  {
    phi: Math.PI / 2,
    theta: (4 * Math.PI) / 3,
    label: 'blog',
    href: '/blog/',
    themeId: 'blog',
  },
]

function createCircleTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2)
  ctx.fill()
  return new THREE.CanvasTexture(canvas)
}

function buildLatitudeDotPositions() {
  const positions = []

  positions.push(0, SPHERE_RADIUS, 0)

  for (let lat = 1; lat < LATITUDE_LINES; lat++) {
    const phi = (lat / LATITUDE_LINES) * Math.PI
    const y = SPHERE_RADIUS * Math.cos(phi)
    const ringRadius = SPHERE_RADIUS * Math.sin(phi)
    const dotsOnRing =
      lat === 1 || lat === LATITUDE_LINES - 1
        ? DOTS_PER_LATITUDE / 2
        : DOTS_PER_LATITUDE

    for (let i = 0; i < dotsOnRing; i++) {
      const theta = (i / dotsOnRing) * Math.PI * 2
      positions.push(
        ringRadius * Math.cos(theta),
        y,
        ringRadius * Math.sin(theta),
      )
    }
  }

  positions.push(0, -SPHERE_RADIUS, 0)

  return new Float32Array(positions)
}

function sphericalToCartesian(phi, theta) {
  const y = SPHERE_RADIUS * Math.cos(phi)
  const ringRadius = SPHERE_RADIUS * Math.sin(phi)

  return new THREE.Vector3(
    ringRadius * Math.cos(theta),
    y,
    ringRadius * Math.sin(theta),
  )
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function createNodeTexture(label, theme) {
  const canvas = document.createElement('canvas')
  const width = 640
  const height = 280
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const outlineWidth = 16
  const radius = 48
  const text = label.toUpperCase()

  drawRoundedRect(ctx, outlineWidth / 2, outlineWidth / 2, width - outlineWidth, height - outlineWidth, radius)
  ctx.fillStyle = theme.accent
  ctx.fill()

  drawRoundedRect(
    ctx,
    outlineWidth,
    outlineWidth,
    width - outlineWidth * 2,
    height - outlineWidth * 2,
    radius - outlineWidth / 2,
  )
  ctx.fillStyle = '#000000'
  ctx.fill()

  ctx.fillStyle = theme.accentBright
  ctx.font = '600 104px Orbitron, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = theme.accent
  ctx.shadowBlur = 12
  ctx.fillText(text, width / 2, height / 2 + 4)
  ctx.shadowBlur = 0

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createNode(label, href, themeId, clickableNodes) {
  const theme = METROID_THEMES[themeId]
  const group = new THREE.Group()

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(NODE_WIDTH, NODE_HEIGHT),
    new THREE.MeshBasicMaterial({
      map: createNodeTexture(label, theme),
      transparent: true,
      depthTest: true,
      depthWrite: false,
    }),
  )
  panel.userData.href = href
  panel.userData.themeId = themeId
  panel.userData.label = label
  panel.userData.panelText = theme.panelText
  clickableNodes.push(panel)
  group.add(panel)

  return group
}

function createConnectionLine(theme) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(
      LINE_THICKNESS / 2,
      LINE_THICKNESS / 2,
      1,
      8,
    ),
    new THREE.MeshBasicMaterial({ color: theme.accentHex }),
  )
}

function updateConnectionLine(line, start, end) {
  const direction = new THREE.Vector3().subVectors(end, start)
  const length = direction.length()

  if (length === 0) {
    line.visible = false
    return
  }

  line.visible = true
  line.scale.set(1, length, 1)
  line.position.copy(start).add(end).multiplyScalar(0.5)
  line.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  )
}

function createNodePhysics(attachment, clickableNodes) {
  const theme = METROID_THEMES[attachment.themeId]
  const anchorLocal = sphericalToCartesian(attachment.phi, attachment.theta)
  const radialLocal = anchorLocal.clone().normalize()
  const restLocal = anchorLocal.clone().add(radialLocal.clone().multiplyScalar(LINE_LENGTH))

  return {
    anchorLocal,
    radialLocal,
    themeId: attachment.themeId,
    position: restLocal.clone(),
    velocity: new THREE.Vector3(),
    line: createConnectionLine(theme),
    nodeGroup: createNode(
      attachment.label,
      attachment.href,
      attachment.themeId,
      clickableNodes,
    ),
  }
}

function getWorldPosition(localPoint, quaternion, target) {
  return target.copy(localPoint).applyQuaternion(quaternion)
}

const scene = new THREE.Scene()
setSceneBackground(scene, STANDBY_THEME.accent)

const canvas = document.querySelector('#bg')
const sceneFrame = document.querySelector('#scene-frame')
const layout = document.querySelector('#layout')
const infoPanel = document.querySelector('#info-panel')
const infoText = document.querySelector('#info-text')
const closeScanBtn = document.querySelector('#close-scan')
const openEntryBtn = document.querySelector('#open-entry')
const openEntryLabel = document.querySelector('#open-entry-label')
const infoHint = document.querySelector('#info-hint')
const infoCategory = document.querySelector('#info-category')
const infoLog = document.querySelector('#info-log')
const infoStatus = document.querySelector('#info-status')
const sceneVisor = document.querySelector('#scene-visor')
const sceneStatus = document.querySelector('#scene-status')
const simpleVersionLink = document.querySelector('#simple-version')

const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 1000)
camera.position.z = CAMERA_DISTANCE

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
})
renderer.setPixelRatio(window.devicePixelRatio)

function resizeRenderer() {
  const width = sceneFrame.clientWidth
  const height = sceneFrame.clientHeight
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

resizeRenderer()
new ResizeObserver(resizeRenderer).observe(sceneFrame)
sceneFrame.addEventListener('transitionend', (event) => {
  if (event.propertyName === 'width') {
    resizeRenderer()
  }
})

let layoutTransitionTimer = null

function triggerLayoutTransition() {
  layout.classList.add('layout--transitioning')
  clearTimeout(layoutTransitionTimer)
  layoutTransitionTimer = setTimeout(() => {
    layout.classList.remove('layout--transitioning')
    resizeRenderer()
  }, 620)
}

const sphereGroup = new THREE.Group()
scene.add(sphereGroup)

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0x000000,
    depthWrite: true,
  }),
)
sphere.renderOrder = 0
sphereGroup.add(sphere)

const dots = new THREE.Points(
  new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.BufferAttribute(buildLatitudeDotPositions(), 3),
  ),
  new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.35,
    sizeAttenuation: true,
    map: createCircleTexture(),
    transparent: true,
    alphaTest: 0.5,
    depthTest: true,
    depthWrite: false,
  }),
)
sphereGroup.add(dots)

const clickableNodes = []
const nodePhysics = NODE_ATTACHMENTS.map((attachment) =>
  createNodePhysics(attachment, clickableNodes),
)

for (const node of nodePhysics) {
  scene.add(node.line, node.nodeGroup)
  getWorldPosition(
    node.anchorLocal.clone().add(node.radialLocal.clone().multiplyScalar(LINE_LENGTH)),
    sphereGroup.quaternion,
    node.position,
  )
  node.nodeGroup.position.copy(node.position)
}

const outlineGroup = new THREE.Group()
const outline = new THREE.Mesh(
  new THREE.RingGeometry(
    OUTLINE_RADIUS - OUTLINE_WIDTH / 2,
    OUTLINE_RADIUS + OUTLINE_WIDTH / 2,
    128,
  ),
  new THREE.MeshBasicMaterial({
    color: DEFAULT_ACCENT_HEX,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  }),
)
outline.renderOrder = 1
outlineGroup.add(outline)
scene.add(outlineGroup)

const rotationMouse = new THREE.Vector2()
const pointer = new THREE.Vector2()
const rotationAxis = new THREE.Vector3()
const deltaRotation = new THREE.Quaternion()
const angularVelocity = new THREE.Vector3()
const anchorWorld = new THREE.Vector3()
const desiredWorld = new THREE.Vector3()
const springForce = new THREE.Vector3()
const dragForce = new THREE.Vector3()
const raycaster = new THREE.Raycaster()
const clock = new THREE.Clock()

let interactionFrozen = false
let activeNodeMesh = null

function setPointerFromEvent(event) {
  const rect = canvas.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  rotationMouse.x = event.clientX - rect.left - rect.width / 2
  rotationMouse.y = rect.height / 2 - (event.clientY - rect.top)
}

function getFrontmostNodeHit() {
  raycaster.setFromCamera(pointer, camera)
  const nodeHits = raycaster.intersectObjects(clickableNodes, false)
  const sphereHits = raycaster.intersectObject(sphere, false)

  if (nodeHits.length === 0) {
    return null
  }

  if (sphereHits.length > 0 && sphereHits[0].distance < nodeHits[0].distance) {
    return null
  }

  return nodeHits[0].object
}

function applyTheme(themeId, animateLayout = true) {
  const theme = METROID_THEMES[themeId]
  const nodeName = themeId.toUpperCase()
  layout.className = `layout mp-hud layout--scan-active theme-${themeId}`
  infoPanel.classList.add('is-active')
  infoCategory.textContent = nodeName
  infoLog.textContent = 'SECTION'
  infoStatus.textContent = 'PRESS [ESC] TO EXIT'
  sceneVisor.textContent = nodeName
  sceneStatus.textContent = 'NODE SCANNED'
  sceneStatus.classList.remove('is-hidden')
  simpleVersionLink.classList.add('is-hidden')
  outline.material.color.setHex(theme.accentHex)
  setSceneBackground(scene, theme.accent)
  if (animateLayout) {
    triggerLayoutTransition()
  }
}

function clearTheme() {
  layout.className = 'layout mp-hud theme-standby'
  infoPanel.classList.remove('is-active')
  infoCategory.textContent = STANDBY_THEME.category
  infoLog.textContent = STANDBY_THEME.logTitle
  infoStatus.textContent = STANDBY_THEME.scanStatus
  sceneVisor.textContent = 'CLICK TARGET TO SELECT'
  sceneStatus.classList.add('is-hidden')
  simpleVersionLink.classList.remove('is-hidden')
  outline.material.color.setHex(STANDBY_THEME.accentHex)
  setSceneBackground(scene, STANDBY_THEME.accent)
  triggerLayoutTransition()
}

function activateNode(mesh) {
  const animateLayout = !interactionFrozen
  interactionFrozen = true
  activeNodeMesh = mesh
  applyTheme(mesh.userData.themeId, animateLayout)
  infoText.textContent = mesh.userData.panelText
  openEntryLabel.textContent = `OPEN ${mesh.userData.label.toUpperCase()}`
  infoHint.textContent = 'SECTION SELECTED - DISMISS OR OPEN ENTRY'
}

function deactivateNode() {
  interactionFrozen = false
  activeNodeMesh = null
  clearTheme()
  infoText.textContent = ''
  openEntryLabel.textContent = 'OPEN ENTRY'
  infoHint.textContent = 'CLICK TARGET TO SELECT'
  rotationMouse.set(0, 0)
  angularVelocity.set(0, 0, 0)
}

canvas.addEventListener('mousemove', (event) => {
  setPointerFromEvent(event)
})

canvas.addEventListener('mouseleave', () => {
  rotationMouse.set(0, 0)
})

closeScanBtn.addEventListener('click', () => {
  deactivateNode()
})

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && interactionFrozen) {
    deactivateNode()
  }
})

openEntryBtn.addEventListener('click', () => {
  if (activeNodeMesh?.userData.href) {
    window.location.href = activeNodeMesh.userData.href
  }
})

simpleVersionLink.addEventListener('click', (event) => {
  event.preventDefault()
  switchHomeVersion('simple')
})

canvas.addEventListener('click', (event) => {
  setPointerFromEvent(event)

  const hit = getFrontmostNodeHit()

  if (hit && hit !== activeNodeMesh) {
    activateNode(hit)
  }
})

function updateNodePhysics(node, delta, sphereQuaternion) {
  getWorldPosition(node.anchorLocal, sphereQuaternion, anchorWorld)
  getWorldPosition(
    node.anchorLocal.clone().add(node.radialLocal.clone().multiplyScalar(LINE_LENGTH)),
    sphereQuaternion,
    desiredWorld,
  )

  springForce.copy(desiredWorld).sub(node.position).multiplyScalar(NODE_SPRING)
  dragForce.copy(angularVelocity).cross(node.position).multiplyScalar(-NODE_DRAG)

  node.velocity.addScaledVector(springForce, delta)
  node.velocity.addScaledVector(dragForce, delta)
  node.velocity.multiplyScalar(Math.exp(-NODE_DAMPING * delta))
  node.position.addScaledVector(node.velocity, delta)

  updateConnectionLine(node.line, anchorWorld, node.position)
  node.nodeGroup.position.copy(node.position)
  node.nodeGroup.quaternion.copy(camera.quaternion)
}

function animate() {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()

  if (!interactionFrozen) {
    const distance = rotationMouse.length()

    if (distance > 0) {
      rotationAxis.set(-rotationMouse.y, rotationMouse.x, 0).normalize()
      const spin = distance * ROTATION_SPEED
      angularVelocity.copy(rotationAxis).multiplyScalar(spin)
      deltaRotation.setFromAxisAngle(rotationAxis, spin * delta)
      sphereGroup.quaternion.premultiply(deltaRotation)
    } else {
      angularVelocity.multiplyScalar(Math.exp(-8 * delta))
    }

    for (const node of nodePhysics) {
      updateNodePhysics(node, delta, sphereGroup.quaternion)
    }
  }

  outlineGroup.quaternion.copy(camera.quaternion)

  renderer.render(scene, camera)
}

animate()
