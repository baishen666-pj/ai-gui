import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Canvas } from '@react-three/fiber'
import { OfficeCamera } from './OfficeCamera'
import { OfficeLighting } from './OfficeLighting'
import { OfficeScene } from './OfficeScene'
import { LayoutEditor } from './LayoutEditor'

export function AgentGraph3D() {
  const [editMode, setEditMode] = useState(false)

  if (editMode) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <h2 className="text-sm font-medium text-zinc-300">布局编辑器</h2>
          <span className="text-xs text-zinc-600">拖拽移动 · 右侧添加家具 · 保存后生效</span>
        </header>
        <div className="flex-1">
          <ReactFlowProvider>
            <LayoutEditor
              onSave={() => setEditMode(false)}
              onCancel={() => setEditMode(false)}
            />
          </ReactFlowProvider>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <h2 className="text-sm font-medium text-zinc-300">3D 虚拟办公室</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">拖拽旋转 · 滚轮缩放 · 点击查看详情</span>
          <button
            onClick={() => setEditMode(true)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            编辑布局
          </button>
        </div>
      </header>
      <div className="flex-1">
        <Canvas
          orthographic
          camera={{ position: [12, 12, 12], zoom: 40, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: 'linear-gradient(180deg, #09090b 0%, #18181b 100%)' }}
        >
          <OfficeCamera />
          <OfficeLighting />
          <OfficeScene />
        </Canvas>
      </div>
    </div>
  )
}
