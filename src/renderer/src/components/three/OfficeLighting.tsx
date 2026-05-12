export function OfficeLighting() {
  return (
    <>
      <ambientLight intensity={0.4} color="#fef3c7" />
      <pointLight position={[0, 5.5, -1]} intensity={1.2} color="#fef9c3" distance={15} />
      <pointLight position={[0, 4, -5.5]} intensity={0.6} color="#e0e7ff" distance={8} />
      <pointLight position={[0, 4, 5]} intensity={0.5} color="#fef3c7" distance={8} />
      <pointLight position={[-8, 3, -1]} intensity={0.3} color="#c7d2fe" distance={6} />
      <pointLight position={[8, 3, -1]} intensity={0.3} color="#c7d2fe" distance={6} />
    </>
  )
}
