import { useRef, useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

export function OfficeCamera() {
  const target = useMemo(() => new THREE.Vector3(0, 1, 0), [])

  return (
    <>
      <OrthographicSetup />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minZoom={0.5}
        maxZoom={3}
        maxPolarAngle={Math.PI / 3}
        minPolarAngle={Math.PI / 6}
        enablePan
        panSpeed={0.8}
        target={target}
      />
    </>
  )
}

function OrthographicSetup() {
  const { set } = useThree()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const ortho = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100)
    ortho.position.set(12, 12, 12)
    ortho.zoom = 40
    ortho.lookAt(0, 1, 0)
    ortho.updateProjectionMatrix()
    set({ camera: ortho })
  }, [set])

  return null
}
