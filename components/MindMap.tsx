"use client"

import { useEffect, useCallback, useState } from "react"
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
} from "reactflow"
import "reactflow/dist/style.css"
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { MindMapNode } from "@/hooks/useMindMap"

interface Props {
  data: MindMapNode | null
  onClose: () => void
}

// Кастомный узел
function MindNode({ data }: { data: any }) {
  const colors: Record<string, string> = {
    root: "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500",
    level1: "bg-[#1e1f20] text-white border-[#444] hover:border-blue-500",
    level2: "bg-[#131314] text-gray-300 border-[#333] hover:border-purple-500",
  }

  const sizes: Record<string, string> = {
    root: "px-5 py-3 text-base font-bold min-w-[120px]",
    level1: "px-4 py-2.5 text-sm font-semibold min-w-[100px]",
    level2: "px-3 py-2 text-xs min-w-[80px]",
  }

  return (
    <div className={`
      rounded-xl border-2 text-center cursor-pointer
      transition-all duration-200 shadow-lg
      ${colors[data.level] || colors.level2}
      ${sizes[data.level] || sizes.level2}
    `}>
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !border-none !w-2 !h-2" />
      <span className="leading-tight block">{data.label}</span>
      <Handle type="source" position={Position.Right} className="!bg-blue-500 !border-none !w-2 !h-2" />
    </div>
  )
}

const nodeTypes = { mindNode: MindNode }

// Конвертируем дерево в ReactFlow nodes и edges
function convertToFlow(
  node: MindMapNode,
  level: number = 0,
  x: number = 0,
  y: number = 0,
  parentId?: string
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const levelConfig = {
    0: { xOffset: 0, yGap: 0 },
    1: { xOffset: 280, yGap: 100 },
    2: { xOffset: 530, yGap: 55 },
  }

  const config = levelConfig[level as keyof typeof levelConfig] || { xOffset: 700, yGap: 45 }

  nodes.push({
    id: node.id,
    type: "mindNode",
    position: { x, y },
    data: {
      label: node.label,
      level: level === 0 ? "root" : level === 1 ? "level1" : "level2"
    },
    draggable: true,
  })

  if (parentId) {
    edges.push({
      id: `edge-${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      type: "smoothstep",
      style: {
        stroke: level === 1 ? "#3b82f6" : "#555",
        strokeWidth: level === 1 ? 2 : 1.5,
      },
      animated: level === 1,
    })
  }

  if (node.children && node.children.length > 0) {
    const totalHeight = (node.children.length - 1) * config.yGap
    const startY = y - totalHeight / 2

    node.children.forEach((child, i) => {
      const childY = startY + i * config.yGap
      const childX = config.xOffset

      const result = convertToFlow(child, level + 1, childX, childY, node.id)
      nodes.push(...result.nodes)
      edges.push(...result.edges)
    })
  }

  return { nodes, edges }
}

export default function MindMap({ data, onClose }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return

    // Считаем позицию корня по центру
    const totalChildren = data.children?.length || 1
    const centerY = (totalChildren * 100) / 2

    const { nodes: newNodes, edges: newEdges } = convertToFlow(data, 0, 50, centerY)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [data])

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.data.label)
    setTimeout(() => setSelectedNode(null), 2000)
  }, [])

  if (!data) return null

  return (
    <div className="
      fixed md:relative inset-0 md:inset-auto
      flex flex-col z-50
      bg-[#0a0a0a] border-l border-[#2a2a2a]
      w-full md:w-auto
    ">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] flex-shrink-0 bg-[#0f0f0f]">
        <div className="flex items-center gap-3">
          <span className="text-lg">🗺️</span>
          <div>
            <p className="text-sm font-semibold text-white">Карта знаний</p>
            <p className="text-[10px] text-gray-500">Перетаскивай узлы • Скролл для зума</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1e1f20] rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Уведомление при клике на узел */}
      {selectedNode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-blue-600 text-white text-xs px-4 py-2 rounded-full shadow-lg fade-in">
          📌 {selectedNode}
        </div>
      )}

      {/* ReactFlow */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={2}
          attributionPosition="bottom-right"
        >
          <Background color="#1a1a1a" gap={20} size={1} />
          <Controls
            className="!bg-[#1e1f20] !border-[#333] !rounded-xl"
            showInteractive={false}
          />
          <MiniMap
            className="!bg-[#0f0f0f] !border-[#333] !rounded-xl"
            nodeColor={(node) => {
              if (node.data?.level === "root") return "#3b82f6"
              if (node.data?.level === "level1") return "#6366f1"
              return "#374151"
            }}
            maskColor="rgba(0,0,0,0.6)"
          />
        </ReactFlow>
      </div>

      {/* Подсказка */}
      <div className="px-4 py-2 border-t border-[#2a2a2a] bg-[#0f0f0f] flex-shrink-0">
        <p className="text-[10px] text-gray-600 text-center">
          🔵 Главные темы • ⚪ Подтемы • Перетаскивай узлы для удобства
        </p>
      </div>
    </div>
  )
}