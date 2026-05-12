import { useMemo } from 'react'
import { useAppStore } from '../../stores/app'
import { Desk, Monitor, Chair, RoundTable, Sofa, Plant, CoffeeTable } from './OfficeFurniture'
import type { LayoutItem } from './types'

export function DynamicFurniture() {
  const items = useAppStore((s) => s.officeLayout)

  return (
    <group>
      {items.map((item) => (
        <FurniturePiece key={item.id} item={item} />
      ))}
    </group>
  )
}

function FurniturePiece({ item }: { item: LayoutItem }) {
  const pos: [number, number, number] = [item.x, 0, item.z]

  switch (item.type) {
    case 'desk':
      return <Desk position={pos} rotation={item.rotation} />
    case 'monitor':
      return <Monitor position={[item.x, 0.77, item.z]} rotation={item.rotation} />
    case 'chair':
      return <Chair position={pos} rotation={item.rotation} />
    case 'roundTable':
      return <RoundTable position={pos} />
    case 'sofa':
      return <Sofa position={pos} rotation={item.rotation} />
    case 'plant':
      return <Plant position={pos} />
    case 'coffeeTable':
      return <CoffeeTable position={pos} />
    default:
      return null
  }
}
