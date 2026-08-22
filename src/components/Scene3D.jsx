import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

const BASE = import.meta.env.BASE_URL

/** Pointer position in normalized [-1, 1] space, smoothed every frame. */
const pointer = { x: 0, y: 0 }
const smoothed = { x: 0, y: 0 }
const scroll = { y: 0 }

if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  })
  window.addEventListener(
    'scroll',
    () => {
      scroll.y = window.scrollY / window.innerHeight
    },
    { passive: true }
  )
}

/**
 * One parallax layer: a textured plane sized to exactly cover the viewport at
 * its own depth, then nudged by pointer and scroll to create the depth read.
 */
function Layer({
  url,
  z = 0,
  parallax = 0.4,
  scrollFactor = 0.3,
  opacity = 1,
  additive = false,
  scale = 1,
  offset = [0, 0],
  anchor = 'center',
}) {
  const texture = useTexture(BASE + url)
  const ref = useRef()
  const viewport = useThree((s) => s.viewport)
  const camera = useThree((s) => s.camera)

  const size = useMemo(() => {
    const v = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, z))
    const aspect = texture.image ? texture.image.width / texture.image.height : 1.5
    // cover: grow the plane until it overflows the viewport on both axes
    let w = v.width * scale
    let h = w / aspect
    if (h < v.height * scale) {
      h = v.height * scale
      w = h * aspect
    }
    return { w, h, vh: v.height }
  }, [viewport, camera, z, texture, scale])

  const baseY = anchor === 'bottom' ? -size.vh / 2 + size.h / 2 : 0

  useFrame((_, delta) => {
    if (!ref.current) return
    const k = Math.min(1, delta * 4)
    smoothed.x += (pointer.x - smoothed.x) * k
    smoothed.y += (pointer.y - smoothed.y) * k
    ref.current.position.x = offset[0] + -smoothed.x * parallax
    ref.current.position.y =
      baseY + offset[1] + smoothed.y * parallax * 0.6 + scroll.y * scrollFactor
    ref.current.rotation.y = -smoothed.x * parallax * 0.02
    ref.current.rotation.x = smoothed.y * parallax * 0.012
  })

  return (
    <mesh ref={ref} position={[offset[0], baseY + offset[1], z]}>
      <planeGeometry args={[size.w, size.h, 1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </mesh>
  )
}

/** Free-floating dust and ember motes drifting across the scene. */
function Dust({ count = 260 }) {
  const ref = useRef()

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16
      positions[i * 3 + 2] = -6 + Math.random() * 7
      speeds[i] = 0.06 + Math.random() * 0.22
    }
    return { positions, speeds }
  }, [count])

  useFrame((state, delta) => {
    const geo = ref.current?.geometry
    if (!geo) return
    const arr = geo.attributes.position.array
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta
      arr[i * 3] += Math.sin(t * 0.3 + i) * delta * 0.05
      if (arr[i * 3 + 1] > 8) arr[i * 3 + 1] = -8
    }
    geo.attributes.position.needsUpdate = true
    ref.current.position.x = -smoothed.x * 0.35
    ref.current.position.y = smoothed.y * 0.25
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#e8c88a"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function Rig() {
  useFrame((state, delta) => {
    const k = Math.min(1, delta * 2)
    state.camera.position.x += (smoothed.x * 0.25 - state.camera.position.x) * k
    state.camera.position.y += (-smoothed.y * 0.18 - state.camera.position.y) * k
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

/**
 * `terrain` apaga los planos de cielo/ciudad/dunas/rocas y deja solo el polvo.
 * Se usa cuando el fondo de la página es el vídeo scrubbed: esos planos son
 * opacos y lo taparían por completo.
 */
function Layers({ terrain = true }) {
  if (!terrain) return <Dust />
  return (
    <>
      <Layer url="assets/texture-sky.webp" z={-14} parallax={0.22} scrollFactor={0.2} opacity={0.9} />
      <Layer
        url="assets/texture-city.webp"
        z={-10}
        parallax={0.55}
        scrollFactor={0.55}
        opacity={0.75}
        anchor="bottom"
        offset={[1.6, 1.1]}
        scale={0.78}
      />
      <Layer
        url="assets/texture-dunes.webp"
        z={-7}
        parallax={0.9}
        scrollFactor={1}
        opacity={0.9}
        anchor="bottom"
        offset={[0, 0.2]}
        scale={1.05}
      />
      <Layer
        url="assets/texture-rocks.webp"
        z={-3.5}
        parallax={1.5}
        scrollFactor={1.7}
        opacity={0.95}
        anchor="bottom"
        offset={[0, -0.4]}
        scale={1.2}
      />
      <Dust />
    </>
  )
}

export default function Scene3D({ terrain = true }) {
  return (
    <div className="scene3d" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 5], fov: 55 }}
      >
        <Suspense fallback={null}>
          <Layers terrain={terrain} />
        </Suspense>
        <Rig />
      </Canvas>
    </div>
  )
}
