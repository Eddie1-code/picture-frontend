<template>
  <div
    ref="containerRef"
    class="receipt-board"
    :class="{ 'is-fallback': !enabled3D }"
    :style="{ width: width + 'px', height: height + 'px' }"
  >
    <!-- 悬挂挂钉 -->
    <div class="receipt-pin" aria-hidden="true">
      <span class="pin-dot"></span>
    </div>

    <!-- 3D 画布 -->
    <canvas
      v-show="enabled3D"
      ref="canvasRef"
      class="receipt-canvas"
      :width="width"
      :height="height"
    />

    <!-- 降级静态小票 -->
    <div v-if="!enabled3D" class="receipt-fallback">
      <div class="fb-paper">
        <div class="fb-title">{{ title }}</div>
        <div v-if="subtitle" class="fb-sub">{{ subtitle }}</div>
        <div class="fb-divider"></div>
        <ul class="fb-items">
          <li v-for="(it, idx) in items" :key="idx">
            <span class="fb-chk">{{ it.checked ? '[x]' : '[ ]' }}</span>
            <span>{{ it.text }}</span>
          </li>
        </ul>
        <div class="fb-divider"></div>
        <div class="fb-footer">{{ footerText }}</div>
        <div class="fb-barcode"></div>
      </div>
    </div>

    <!-- 新手提示 -->
    <div v-if="enabled3D && showHint" class="receipt-hint" aria-hidden="true">
      拖拽我 · drag me
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

interface ReceiptItem {
  checked?: boolean
  text: string
}

interface Props {
  title?: string
  subtitle?: string
  items?: ReceiptItem[]
  footerText?: string
  barcode?: string
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'NESTPIC · RECEIPT',
  subtitle: '',
  items: () => [],
  footerText: 'THANK YOU, STAY CREATIVE',
  barcode: '*NESTPIC-20260420*',
  width: 320,
  height: 520,
})

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const enabled3D = ref(true)
const showHint = ref(true)

// ---------------- Three.js 全局变量 ----------------
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let mesh: THREE.Mesh | null = null
let paperTexture: THREE.CanvasTexture | null = null
let rafId = 0
let started = false

// ---------------- Verlet 粒子系统 ----------------
const COLS = 14
const ROWS = 26
const PAPER_W = 300
const PAPER_H = 480

interface Particle {
  x: number
  y: number
  px: number
  py: number
  pinned: boolean
}

let particles: Particle[] = []
// [i, j, restLength, stiffness]
let constraints: Array<[number, number, number, number]> = []
let dragIndex = -1

function initParticles() {
  particles = []
  constraints = []
  const dx = PAPER_W / (COLS - 1)
  const dy = PAPER_H / (ROWS - 1)
  const startX = -PAPER_W / 2
  const startY = PAPER_H / 2

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = startX + col * dx
      const y = startY - row * dy
      particles.push({
        x,
        y,
        px: x,
        py: y,
        // 顶部一整行所有粒子都 pin——满足"顶部整条固定"
        pinned: row === 0,
      })
    }
  }

  // 结构约束：水平 + 垂直
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col
      if (col < COLS - 1) constraints.push([i, i + 1, dx, 1.0])
      if (row < ROWS - 1) constraints.push([i, i + COLS, dy, 1.0])
    }
  }

  // 弯曲约束（跨 2）：防止纸像布一样"起鬼影"，给刚性
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col
      if (col < COLS - 2) constraints.push([i, i + 2, dx * 2, 0.6])
      if (row < ROWS - 2) constraints.push([i, i + COLS * 2, dy * 2, 0.6])
    }
  }
}

// ---------------- 热敏纸贴图绘制 ----------------
function drawReceiptCanvas(): HTMLCanvasElement {
  const w = 512
  const h = Math.round((w * PAPER_H) / PAPER_W)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // 1. 底色：热敏纸偏暖白 + 渐变
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#fefcf7')
  grad.addColorStop(0.5, '#fcf8ef')
  grad.addColorStop(1, '#f6f1e6')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // 2. 纸张颗粒 noise（随机像素扰动）
  const img = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14
    img.data[i] = clamp(img.data[i] + n, 0, 255)
    img.data[i + 1] = clamp(img.data[i + 1] + n, 0, 255)
    img.data[i + 2] = clamp(img.data[i + 2] + n, 0, 255)
  }
  ctx.putImageData(img, 0, 0)

  // 3. 上下锯齿（撕纸口）
  drawTearEdge(ctx, w, 0, 'top')
  drawTearEdge(ctx, w, h, 'bottom')

  const pad = w * 0.08
  let y = pad + 12
  const ink = '#2a2620'

  // 4. 标题
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = 'bold 32px "Courier New", ui-monospace, monospace'
  ctx.fillText(props.title, w / 2, y)
  y += 44

  // 5. 副标题
  if (props.subtitle) {
    ctx.font = '20px "Courier New", monospace'
    ctx.fillStyle = '#6b6256'
    ctx.fillText(props.subtitle, w / 2, y)
    y += 32
  }

  // 6. 日期/门店（热敏纸常有）
  ctx.font = '16px "Courier New", monospace'
  ctx.fillStyle = '#807566'
  const today = new Date()
  const pad2 = (n: number) => String(n).padStart(2, '0')
  const stamp = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}  ${pad2(today.getHours())}:${pad2(today.getMinutes())}`
  ctx.fillText(stamp, w / 2, y)
  y += 26

  // 7. 虚线分隔
  drawDashed(ctx, pad, y, w - pad, y, '#9a8f80')
  y += 24

  // 8. 清单项
  ctx.textAlign = 'left'
  ctx.fillStyle = ink
  ctx.font = '22px "Courier New", monospace'
  const lineH = 36
  const itemsToDraw = props.items.slice(0, 10)
  itemsToDraw.forEach((item) => {
    const prefix = item.checked ? '[x]' : '[ ]'
    ctx.fillText(`${prefix}  ${item.text}`, pad, y)
    y += lineH
  })

  // 9. 底部虚线
  y += 8
  drawDashed(ctx, pad, y, w - pad, y, '#9a8f80')
  y += 24

  // 10. 感谢语
  ctx.textAlign = 'center'
  ctx.font = 'italic 18px "Courier New", monospace'
  ctx.fillStyle = '#6b6256'
  ctx.fillText(props.footerText, w / 2, y)
  y += 34

  // 11. 条形码（竖条 + 下方代码）
  const bcH = 56
  let bcCursor = pad
  while (bcCursor < w - pad) {
    const lw = Math.random() < 0.5 ? 2 : 4
    ctx.fillStyle = ink
    ctx.fillRect(bcCursor, y, lw, bcH)
    bcCursor += lw + (Math.random() < 0.5 ? 3 : 5)
  }
  y += bcH + 10
  ctx.fillStyle = '#6b6256'
  ctx.font = '16px "Courier New", monospace'
  ctx.fillText(props.barcode, w / 2, y)

  return canvas
}

function drawTearEdge(
  ctx: CanvasRenderingContext2D,
  w: number,
  y: number,
  dir: 'top' | 'bottom',
) {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  const step = 10
  const amp = 6
  if (dir === 'top') {
    ctx.moveTo(0, -1)
    for (let x = 0; x <= w; x += step) {
      const jitter = (Math.random() - 0.5) * amp
      ctx.lineTo(x, Math.max(0, amp * 0.4 + jitter))
    }
    ctx.lineTo(w, -1)
  } else {
    ctx.moveTo(0, y + 1)
    for (let x = 0; x <= w; x += step) {
      const jitter = (Math.random() - 0.5) * amp
      ctx.lineTo(x, y - amp * 0.4 + jitter)
    }
    ctx.lineTo(w, y + 1)
  }
  ctx.closePath()
  ctx.fillStyle = '#000'
  ctx.fill()
  ctx.restore()
}

function drawDashed(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v
}

// ---------------- Three.js 初始化 ----------------
function initThree() {
  if (started) return
  started = true

  const canvas = canvasRef.value
  if (!canvas) return

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    })
  } catch {
    enabled3D.value = false
    return
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(props.width, props.height, false)
  renderer.setClearColor(0x000000, 0)

  scene = new THREE.Scene()
  const halfW = props.width / 2
  const halfH = props.height / 2
  camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, -1000, 1000)
  camera.position.z = 10

  initParticles()

  // 纸张 mesh（PlaneGeometry 顶点顺序刚好 row-major，从左上到右下，与 particles 对齐）
  const geom = new THREE.PlaneGeometry(PAPER_W, PAPER_H, COLS - 1, ROWS - 1)
  const texCanvas = drawReceiptCanvas()
  paperTexture = new THREE.CanvasTexture(texCanvas)
  paperTexture.minFilter = THREE.LinearFilter
  paperTexture.magFilter = THREE.LinearFilter
  paperTexture.generateMipmaps = false
  paperTexture.anisotropy = 4

  const mat = new THREE.MeshBasicMaterial({
    map: paperTexture,
    side: THREE.DoubleSide,
    transparent: true,
  })
  mesh = new THREE.Mesh(geom, mat)
  scene.add(mesh)

  // 假影子
  const shadowTex = makeShadowTexture()
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.75,
  })
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(PAPER_W * 0.9, 50), shadowMat)
  shadow.position.set(0, -PAPER_H / 2 - 18, -1)
  scene.add(shadow)

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerUp)

  lastT = performance.now()
  animate()
}

function makeShadowTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 32, 4, 128, 32, 120)
  g.addColorStop(0, 'rgba(60,45,30,0.4)')
  g.addColorStop(0.6, 'rgba(60,45,30,0.15)')
  g.addColorStop(1, 'rgba(60,45,30,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 64)
  return new THREE.CanvasTexture(c)
}

// ---------------- 交互 ----------------
function canvasToLocal(e: PointerEvent) {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
  const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
  return {
    x: (nx * props.width) / 2,
    y: (ny * props.height) / 2,
  }
}

function findClosestParticle(x: number, y: number) {
  let minD = Infinity
  let idx = -1
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    const dx = p.x - x
    const dy = p.y - y
    const d = dx * dx + dy * dy
    if (d < minD) {
      minD = d
      idx = i
    }
  }
  return { idx, d: Math.sqrt(minD) }
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0 && e.pointerType === 'mouse') return
  const { x, y } = canvasToLocal(e)
  const hit = findClosestParticle(x, y)
  // 命中范围宽松一点，方便抓
  if (hit.d < 80 && !particles[hit.idx].pinned) {
    dragIndex = hit.idx
    showHint.value = false
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    e.preventDefault()
  }
}

function onPointerMove(e: PointerEvent) {
  if (dragIndex < 0) return
  const { x, y } = canvasToLocal(e)
  const p = particles[dragIndex]
  // 直接设置位置 + prev，让 verlet 不"甩"
  p.x = x
  p.y = y
  p.px = x
  p.py = y
}

function onPointerUp(e: PointerEvent) {
  if (dragIndex >= 0) {
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }
  dragIndex = -1
}

// ---------------- Verlet 步进 ----------------
const GRAVITY_Y = -900
const DAMPING = 0.985
const ITERATIONS = 5

function verletStep(dt: number) {
  const gy = GRAVITY_Y * dt * dt
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    if (p.pinned || i === dragIndex) continue
    const vx = (p.x - p.px) * DAMPING
    const vy = (p.y - p.py) * DAMPING
    p.px = p.x
    p.py = p.y
    p.x += vx
    p.y += vy + gy
  }

  for (let k = 0; k < ITERATIONS; k++) {
    for (let ci = 0; ci < constraints.length; ci++) {
      const c = constraints[ci]
      const pa = particles[c[0]]
      const pb = particles[c[1]]
      const rest = c[2]
      const stiff = c[3]
      const dx = pb.x - pa.x
      const dy = pb.y - pa.y
      const d = Math.sqrt(dx * dx + dy * dy) + 1e-6
      const diff = ((d - rest) / d) * 0.5 * stiff
      const ox = dx * diff
      const oy = dy * diff
      const aLocked = pa.pinned || c[0] === dragIndex
      const bLocked = pb.pinned || c[1] === dragIndex
      if (!aLocked && !bLocked) {
        pa.x += ox
        pa.y += oy
        pb.x -= ox
        pb.y -= oy
      } else if (!aLocked) {
        pa.x += ox * 2
        pa.y += oy * 2
      } else if (!bLocked) {
        pb.x -= ox * 2
        pb.y -= oy * 2
      }
    }
  }
}

function updateGeometry() {
  if (!mesh) return
  const geom = mesh.geometry as THREE.PlaneGeometry
  const positions = geom.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    positions.setXYZ(i, p.x, p.y, 0)
  }
  positions.needsUpdate = true
}

let lastT = 0
function animate() {
  rafId = requestAnimationFrame(animate)
  const nowT = performance.now()
  const dt = Math.min(32, nowT - lastT) / 1000
  lastT = nowT
  verletStep(dt)
  updateGeometry()
  if (renderer && scene && camera) renderer.render(scene, camera)
}

// ---------------- 生命周期 ----------------
let io: IntersectionObserver | null = null

onMounted(() => {
  // 初筛：无 WebGL / 小屏直接降级
  const tester = document.createElement('canvas')
  const gl =
    (tester.getContext('webgl') as WebGLRenderingContext | null) ||
    (tester.getContext('experimental-webgl') as WebGLRenderingContext | null)
  if (!gl) {
    enabled3D.value = false
    return
  }
  if (window.innerWidth < 720) {
    // 窄屏用户更在意性能与空间，一律降级
    enabled3D.value = false
    return
  }

  // 进入视口再启动渲染循环（首屏 0 成本）
  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          initThree()
          io?.disconnect()
          io = null
        }
      }
    },
    { threshold: 0.1 },
  )
  if (containerRef.value) io.observe(containerRef.value)

  // 10 秒后自动淡化 hint
  setTimeout(() => (showHint.value = false), 10000)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  io?.disconnect()
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerUp)
    canvas.removeEventListener('pointerleave', onPointerUp)
  }
  if (mesh) {
    mesh.geometry.dispose()
    ;(mesh.material as THREE.Material).dispose()
  }
  paperTexture?.dispose()
  renderer?.dispose()
  particles = []
  constraints = []
})
</script>

<style scoped>
.receipt-board {
  position: relative;
  user-select: none;
  touch-action: none;
  /* 留给挂钉的空间 */
  padding-top: 0;
}

.receipt-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  filter: drop-shadow(0 12px 24px rgba(75, 51, 30, 0.12));
}

.receipt-canvas:active {
  cursor: grabbing;
}

/* 顶部挂钉 */
.receipt-pin {
  position: absolute;
  left: 50%;
  top: -8px;
  transform: translateX(-50%);
  width: 28px;
  height: 18px;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(139, 115, 85, 0.22), rgba(139, 115, 85, 0.08));
  border-radius: 4px 4px 0 0;
  box-shadow: 0 2px 6px rgba(75, 51, 30, 0.12);
}

.receipt-pin .pin-dot {
  position: absolute;
  left: 50%;
  top: 4px;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #c89b6a, #6b4a2a);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 新手提示 */
.receipt-hint {
  position: absolute;
  left: 50%;
  bottom: -28px;
  transform: translateX(-50%);
  font-size: 12px;
  letter-spacing: 0.12em;
  color: rgba(107, 81, 58, 0.7);
  background: rgba(255, 252, 247, 0.9);
  border: 1px dashed rgba(139, 115, 85, 0.3);
  padding: 3px 12px;
  border-radius: 999px;
  white-space: nowrap;
  pointer-events: none;
  animation:
    hint-in 0.6s ease 0.4s both,
    hint-breathe 2.4s ease-in-out 1.5s infinite;
}

@keyframes hint-in {
  from {
    opacity: 0;
    transform: translate(-50%, -4px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes hint-breathe {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* ==================== 降级静态小票 ==================== */
.receipt-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12px;
}

.fb-paper {
  width: 88%;
  max-height: 100%;
  padding: 18px 16px 16px;
  background: linear-gradient(180deg, #fefcf7, #f6f1e6);
  font-family: 'Courier New', ui-monospace, monospace;
  color: #2a2620;
  box-shadow: 0 10px 24px rgba(75, 51, 30, 0.14);
  border-radius: 2px;
  overflow: hidden;
}

.fb-title {
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.04em;
}

.fb-sub {
  font-size: 12px;
  color: #6b6256;
  text-align: center;
  margin-top: 4px;
}

.fb-divider {
  border-top: 1px dashed #9a8f80;
  margin: 10px 0;
}

.fb-items {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 13px;
  line-height: 1.9;
}

.fb-items li {
  display: flex;
  gap: 6px;
}

.fb-chk {
  color: #6b6256;
}

.fb-footer {
  text-align: center;
  font-style: italic;
  font-size: 12px;
  color: #6b6256;
  margin-bottom: 10px;
}

.fb-barcode {
  height: 36px;
  background-image: repeating-linear-gradient(
    90deg,
    #2a2620 0,
    #2a2620 2px,
    transparent 2px,
    transparent 5px,
    #2a2620 5px,
    #2a2620 9px,
    transparent 9px,
    transparent 14px
  );
  border-radius: 1px;
}
</style>
