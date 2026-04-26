"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const COUNT        = 2500
const RADIUS       = 1.8
const AMP          = 2.5
const EXPAND_TIME  = 5      // seconds expanding
const HOLD_TIME    = 2      // seconds held at full expansion
const DEFLATE_TIME = 5      // seconds deflating
const TOTAL_PERIOD = EXPAND_TIME + HOLD_TIME + DEFLATE_TIME

interface Props {
  mouseX?: number    // normalised −1 to 1
  mouseY?: number
  isHovered?: boolean
}

export function ParticleSphere({ mouseX = 0, mouseY = 0, isHovered = false }: Props) {
  const ref = useRef<THREE.Points>(null)
  const t   = useRef(0)

  // Perturbation layer — independent from the breathing animation
  const pVel = useRef(new Float32Array(COUNT * 3).fill(0))
  const pPos = useRef(new Float32Array(COUNT * 3).fill(0))

  const { sphere, geomPos, colBuf } = useMemo(() => {
    const sphere  = new Float32Array(COUNT * 3)
    const geomPos = new Float32Array(COUNT * 3)
    const colBuf  = new Float32Array(COUNT * 3)

    for (let i = 0; i < COUNT; i++) {
      const i3    = i * 3
      const phi   = Math.acos(1 - (2 * (i + 0.5)) / COUNT)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i

      const x = RADIUS * Math.sin(phi) * Math.cos(theta)
      const y = RADIUS * Math.sin(phi) * Math.sin(theta)
      const z = RADIUS * Math.cos(phi)

      sphere[i3]     = geomPos[i3]     = x + (Math.random() - 0.5) * 0.07
      sphere[i3 + 1] = geomPos[i3 + 1] = y + (Math.random() - 0.5) * 0.07
      sphere[i3 + 2] = geomPos[i3 + 2] = z + (Math.random() - 0.5) * 0.07

      const mix      = i / COUNT
      colBuf[i3]     = 0.35 + mix * 0.45
      colBuf[i3 + 1] = 0.80 - mix * 0.55
      colBuf[i3 + 2] = 1.0
    }

    return { sphere, geomPos, colBuf }
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return

    t.current += delta

    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const col = ref.current.geometry.attributes.color.array    as Float32Array
    const pv  = pVel.current
    const pp  = pPos.current

    // Three-phase breathing: expand → hold at peak → deflate
    const phase = t.current % TOTAL_PERIOD
    let wave: number
    if (phase < EXPAND_TIME) {
      wave = (1 - Math.cos(Math.PI * phase / EXPAND_TIME)) / 2
    } else if (phase < EXPAND_TIME + HOLD_TIME) {
      wave = 1
    } else {
      const p = phase - EXPAND_TIME - HOLD_TIME
      wave = (1 + Math.cos(Math.PI * p / DEFLATE_TIME)) / 2
    }
    const scale = 0.5 + AMP * wave

    // Mouse projected to the z = 0 plane (camera fov 75°, z = 5)
    const mx = mouseX * 3.84
    const my = mouseY * 3.84

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3

      // Base position from breathing (never corrupts sphere[])
      const bx = sphere[i3]     * scale
      const by = sphere[i3 + 1] * scale
      const bz = sphere[i3 + 2] * scale

      // ── Cursor force on perturbation ────────────────────────────
      let fx = 0, fy = 0, fz = 0
      if (isHovered) {
        const dx   = bx - mx
        const dy   = by - my
        const dz   = bz
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        const infR = 2.2 * scale          // influence radius scales with sphere size
        if (dist < infR && dist > 0.001) {
          const fall     = 1 - dist / infR  // linear falloff → 0 at edge
          const strength = 0.045 * fall * fall
          fx = (dx / dist) * strength
          fy = (dy / dist) * strength
          fz = (dz / dist) * strength * 0.25
        }
      }

      // ── Perturbation physics ─────────────────────────────────────
      // Spring pulls perturbation back toward zero — guarantees full recovery
      const springBack = 0.030
      pv[i3]     = (pv[i3]     + fx - pp[i3]     * springBack) * 0.91
      pv[i3 + 1] = (pv[i3 + 1] + fy - pp[i3 + 1] * springBack) * 0.91
      pv[i3 + 2] = (pv[i3 + 2] + fz - pp[i3 + 2] * springBack) * 0.91

      pp[i3]     += pv[i3]
      pp[i3 + 1] += pv[i3 + 1]
      pp[i3 + 2] += pv[i3 + 2]

      // ── Final position = base + perturbation ─────────────────────
      pos[i3]     = bx + pp[i3]
      pos[i3 + 1] = by + pp[i3 + 1]
      pos[i3 + 2] = bz + pp[i3 + 2]

      // Slow colour wave
      const s    = Math.sin(t.current * 0.28 + i * 0.09) * 0.5 + 0.5
      col[i3]     = 0.35 + s * 0.45
      col[i3 + 1] = 0.80 - s * 0.55
      col[i3 + 2] = 1.0
    }

    ref.current.rotation.y += delta * 0.04

    ref.current.geometry.attributes.position.needsUpdate = true
    ref.current.geometry.attributes.color.needsUpdate    = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geomPos, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colBuf,  3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.030}
        vertexColors
        transparent
        opacity={0.90}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
