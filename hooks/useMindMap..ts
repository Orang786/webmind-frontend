import { useState } from "react"

export interface MindMapNode {
  id: string
  label: string
  children?: MindMapNode[]
}

export function useMindMap() {
  const [mindMap, setMindMap] = useState<MindMapNode | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const openMindMap = (data: MindMapNode) => {
    setMindMap(data)
    setIsOpen(true)
  }

  const closeMindMap = () => {
    setIsOpen(false)
    setTimeout(() => setMindMap(null), 300)
  }

  // Парсим ответ AI и строим дерево
  const parseMindMap = (content: string, query: string): MindMapNode | null => {
    // Ищем заголовки ## и подпункты - и * в тексте
    const lines = content.split("\n").filter(l => l.trim())
    
    const root: MindMapNode = {
      id: "root",
      label: query.slice(0, 40),
      children: []
    }

    let currentParent: MindMapNode | null = null
    let nodeId = 0

    for (const line of lines) {
      const trimmed = line.trim()
      
      // ## Заголовок → дочерний узел корня
      if (trimmed.startsWith("## ")) {
        nodeId++
        const node: MindMapNode = {
          id: `node-${nodeId}`,
          label: trimmed.replace("## ", "").slice(0, 35),
          children: []
        }
        root.children!.push(node)
        currentParent = node
      }
      // ### Подзаголовок или - пункт → дочерний узел текущего
      else if ((trimmed.startsWith("### ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) && currentParent) {
        nodeId++
        const label = trimmed
          .replace("### ", "")
          .replace("- ", "")
          .replace("* ", "")
          .replace(/\*\*/g, "")
          .slice(0, 30)
        
        if (label.length > 2) {
          currentParent.children!.push({
            id: `node-${nodeId}`,
            label,
            children: []
          })
        }
      }
    }

    // Если не нашли структуру — возвращаем null
    if (!root.children || root.children.length === 0) return null
    return root
  }

  return {
    mindMap,
    isOpen,
    openMindMap,
    closeMindMap,
    parseMindMap
  }
}