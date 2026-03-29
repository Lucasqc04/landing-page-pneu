'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Html, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_TARGET_SIZE = 2.52
const MODEL_VERTICAL_OFFSET = -1.72

const TEXTURE_CANDIDATES = {
  map: [
    '/textures/tire/albedo.jpg',
    '/textures/tire/albedo.png',
    '/textures/tire/basecolor.jpg',
    '/textures/tire/basecolor.png',
    '/textures/tire/diffuse.jpg',
    '/textures/tire/diffuse.png',
  ],
  normalMap: [
    '/textures/tire/normal.jpg',
    '/textures/tire/normal.png',
    '/textures/tire/normalgl.jpg',
    '/textures/tire/normalgl.png',
  ],
  roughnessMap: [
    '/textures/tire/roughness.jpg',
    '/textures/tire/roughness.png',
    '/textures/tire/rough.jpg',
    '/textures/tire/rough.png',
  ],
  aoMap: [
    '/textures/tire/ao.jpg',
    '/textures/tire/ao.png',
    '/textures/tire/ambientocclusion.jpg',
    '/textures/tire/ambientocclusion.png',
  ],
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const hashNoise = (x, y) => {
  const raw = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return raw - Math.floor(raw)
}

const configureTexture = (texture, { isColor = false } = {}) => {
  if (!texture) return texture
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 3)
  texture.generateMipmaps = true
  texture.anisotropy = 8
  texture.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace
  texture.needsUpdate = true
  return texture
}

const disposeTextureSet = (textureSet) => {
  if (!textureSet) return
  ;['map', 'normalMap', 'roughnessMap', 'aoMap'].forEach((slot) => {
    textureSet[slot]?.dispose?.()
  })
}

const createHeightField = (size) => {
  const field = new Float32Array(size * size)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size
      const v = y / size

      const baseTread = Math.abs(Math.sin((u * Math.PI * 60) + (v * Math.PI * 6.5)))
      const crossTread = Math.abs(Math.cos((v * Math.PI * 48) + (u * Math.PI * 3.1)))
      const grain = hashNoise(x * 1.4, y * 1.4) * 0.24 + hashNoise(x * 5.8, y * 5.8) * 0.1

      const height = clamp(0.16 + baseTread * 0.54 + crossTread * 0.2 + grain, 0, 1)
      field[y * size + x] = height
    }
  }

  return field
}

const createDataTexture = (size, composePixel, isColor = false) => {
  const data = new Uint8Array(size * size * 4)
  let offset = 0

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = composePixel(x, y)
      data[offset] = r
      data[offset + 1] = g
      data[offset + 2] = b
      data[offset + 3] = a
      offset += 4
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.needsUpdate = true
  return configureTexture(texture, { isColor })
}

const createProceduralTireTextures = () => {
  const size = 256
  const heightField = createHeightField(size)

  const sampleHeight = (x, y) => {
    const wrappedX = (x + size) % size
    const wrappedY = (y + size) % size
    return heightField[wrappedY * size + wrappedX]
  }

  const map = createDataTexture(
    size,
    (x, y) => {
      const h = sampleHeight(x, y)
      const grain = hashNoise(x * 2.2, y * 2.2)
      const value = clamp(Math.round(12 + h * 24 + grain * 7), 8, 40)
      return [value, value, value, 255]
    },
    true,
  )

  const roughnessMap = createDataTexture(size, (x, y) => {
    const h = sampleHeight(x, y)
    const value = clamp(Math.round(218 + h * 34), 205, 252)
    return [value, value, value, 255]
  })

  const aoMap = createDataTexture(size, (x, y) => {
    const h = sampleHeight(x, y)
    const grooveShade = 1 - h
    const value = clamp(Math.round(145 + grooveShade * 88), 120, 230)
    return [value, value, value, 255]
  })

  const normalMap = createDataTexture(size, (x, y) => {
    const left = sampleHeight(x - 1, y)
    const right = sampleHeight(x + 1, y)
    const down = sampleHeight(x, y - 1)
    const up = sampleHeight(x, y + 1)

    const nx = left - right
    const ny = down - up
    const nz = 1

    const length = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
    const packedX = Math.round(((nx / length) * 0.5 + 0.5) * 255)
    const packedY = Math.round(((ny / length) * 0.5 + 0.5) * 255)
    const packedZ = Math.round(((nz / length) * 0.5 + 0.5) * 255)

    return [packedX, packedY, packedZ, 255]
  })

  return {
    source: 'procedural',
    map,
    normalMap,
    roughnessMap,
    aoMap,
  }
}

const resolveTextureUrl = async (candidates) => {
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { method: 'HEAD' })
      if (response.ok) return candidate
    } catch {
      // ignore and try next candidate
    }
  }

  return null
}

function ModelLoader() {
  return (
    <Html center>
      <div className="rounded-full border border-ink/10 bg-white/85 px-4 py-2 text-xs uppercase tracking-[0.22em] text-ink/65 shadow-sm backdrop-blur">
        Carregando 3D
      </div>
    </Html>
  )
}

function useTireTextureSet() {
  const proceduralSet = useMemo(() => createProceduralTireTextures(), [])
  const [pbrSet, setPbrSet] = useState(null)

  useEffect(() => {
    let cancelled = false
    let loadedSet = null

    const loader = new THREE.TextureLoader()

    const loadOptionalTexture = async (url, isColor = false) => {
      if (!url) return null

      try {
        const texture = await loader.loadAsync(url)
        return configureTexture(texture, { isColor })
      } catch {
        return null
      }
    }

    const loadTextureSet = async () => {
      const [mapUrl, normalUrl, roughnessUrl, aoUrl] = await Promise.all([
        resolveTextureUrl(TEXTURE_CANDIDATES.map),
        resolveTextureUrl(TEXTURE_CANDIDATES.normalMap),
        resolveTextureUrl(TEXTURE_CANDIDATES.roughnessMap),
        resolveTextureUrl(TEXTURE_CANDIDATES.aoMap),
      ])

      if (!mapUrl && !normalUrl && !roughnessUrl && !aoUrl) {
        return
      }

      const [map, normalMap, roughnessMap, aoMap] = await Promise.all([
        loadOptionalTexture(mapUrl, true),
        loadOptionalTexture(normalUrl),
        loadOptionalTexture(roughnessUrl),
        loadOptionalTexture(aoUrl),
      ])

      if (!map && !normalMap && !roughnessMap && !aoMap) {
        return
      }

      loadedSet = {
        source: 'pbr',
        map,
        normalMap,
        roughnessMap,
        aoMap,
      }

      if (cancelled) {
        disposeTextureSet(loadedSet)
        return
      }

      setPbrSet(loadedSet)
    }

    loadTextureSet()

    return () => {
      cancelled = true
      if (loadedSet) {
        disposeTextureSet(loadedSet)
      }
    }
  }, [])

  useEffect(
    () => () => {
      disposeTextureSet(proceduralSet)
    },
    [proceduralSet],
  )

  useEffect(
    () => () => {
      disposeTextureSet(pbrSet)
    },
    [pbrSet],
  )

  return pbrSet ?? proceduralSet
}

function TireModel({ modelPath, shouldAutoRotate }) {
  const groupRef = useRef(null)
  const { scene } = useGLTF(modelPath)
  const textureSet = useTireTextureSet()

  const tireMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f0f0f'),
      roughness: 0.96,
      metalness: 0.04,
      map: textureSet.map ?? null,
      normalMap: textureSet.normalMap ?? null,
      roughnessMap: textureSet.roughnessMap ?? null,
      aoMap: textureSet.aoMap ?? null,
      aoMapIntensity: textureSet.aoMap ? 0.9 : 0.45,
      envMapIntensity: textureSet.source === 'pbr' ? 0.45 : 0.32,
      dithering: true,
    })

    const normalIntensity = textureSet.normalMap ? 0.85 : 0.48
    material.normalScale.set(normalIntensity, normalIntensity)

    return material
  }, [textureSet])

  useEffect(
    () => () => {
      tireMaterial.dispose()
    },
    [tireMaterial],
  )

  const normalizedScene = useMemo(() => {
    const cloned = scene.clone(true)

    cloned.traverse((node) => {
      if (!node.isMesh) return

      node.castShadow = true
      node.receiveShadow = true
      node.frustumCulled = true

      if (node.geometry) {
        node.geometry = node.geometry.clone()
        if (!node.geometry.attributes.uv2 && node.geometry.attributes.uv) {
          node.geometry.setAttribute('uv2', node.geometry.attributes.uv)
        }
      }

      node.material = tireMaterial
    })

    const box = new THREE.Box3().setFromObject(cloned)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)

    cloned.position.sub(center)

    const maxAxis = Math.max(size.x, size.y, size.z) || 1
    const targetSize = MODEL_TARGET_SIZE
    const scale = targetSize / maxAxis
    cloned.scale.setScalar(scale)
    cloned.position.y += (size.y * scale) / 2

    return cloned
  }, [scene, tireMaterial])

  useEffect(
    () => () => {
      normalizedScene.traverse((node) => {
        if (node.isMesh && node.geometry) {
          node.geometry.dispose()
        }
      })
    },
    [normalizedScene],
  )

  useFrame((_, delta) => {
    if (!groupRef.current || !shouldAutoRotate) return
    groupRef.current.rotation.y += delta * 0.32
  })

  return (
    <group ref={groupRef} position={[0, MODEL_VERTICAL_OFFSET, 0]}>
      <primitive object={normalizedScene} />
    </group>
  )
}

function Scene({ modelPath, isActive }) {
  const [isInteracting, setIsInteracting] = useState(false)

  return (
    <>
      <color attach="background" args={['#eef2f6']} />
      <fog attach="fog" args={['#e9eef4', 7.2, 16]} />

      <ambientLight intensity={0.82} />

      <directionalLight
        castShadow
        intensity={1.18}
        position={[4.6, 5.7, 3.6]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <directionalLight intensity={0.48} position={[-4.2, 2.8, -3]} />
      <directionalLight intensity={0.35} position={[0.8, 1.8, 5.2]} />

      <Suspense fallback={<ModelLoader />}>
        <TireModel modelPath={modelPath} shouldAutoRotate={isActive && !isInteracting} />

        <ContactShadows
          frames={1}
          blur={2.6}
          scale={7}
          opacity={0.36}
          color="#0e141c"
          position={[0, -0.06, 0]}
          resolution={512}
        />

        <Environment preset="studio" blur={0.42} />
      </Suspense>

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        target={[0, 0.42, 0]}
        enablePan={false}
        enableZoom
        rotateSpeed={0.85}
        zoomSpeed={0.8}
        minDistance={2.3}
        maxDistance={6.3}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.74}
        onStart={() => setIsInteracting(true)}
        onEnd={() => setIsInteracting(false)}
      />
    </>
  )
}

function TireViewer({ modelPath = '/models/tire.glb', isActive = true, className = '' }) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[1.65rem] border border-[#d8e0e9] bg-[linear-gradient(165deg,#ffffff_0%,#eff3f8_56%,#e2e9f1_100%)] shadow-cinema ${className}`}
      onWheelCapture={(event) => event.preventDefault()}
    >
      <Canvas
        shadows
        dpr={[1, 1.9]}
        camera={{ position: [0.18, 0.8, 4.4], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Scene modelPath={modelPath} isActive={isActive} />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/models/tire.glb')

export default TireViewer
