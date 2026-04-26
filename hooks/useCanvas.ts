import { useState } from "react"

export interface CanvasContent {
  type: "code" | "text" | "html"
  language?: string
  content: string
  title: string
}

export function useCanvas() {
  const [canvas, setCanvas] = useState<CanvasContent | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const openCanvas = (content: CanvasContent) => {
    setCanvas(content)
    setIsOpen(true)
  }

  const closeCanvas = () => {
    setIsOpen(false)
    setTimeout(() => setCanvas(null), 300)
  }

  const parseCanvasFromMessage = (content: string): CanvasContent | null => {
    const codeMatch = content.match(/```(\w+)\n([\s\S]*?)```/)
    if (codeMatch) {
      const language = codeMatch[1]
      const code = codeMatch[2]
      const isHTML = language === "html"
      const titles: Record<string, string> = {
        html: "HTML страница",
        css: "CSS стили",
        javascript: "JavaScript",
        typescript: "TypeScript",
        python: "Python скрипт",
        sql: "SQL запрос",
      }
      return {
        type: isHTML ? "html" : "code",
        language,
        content: code,
        title: titles[language] || `${language} файл`
      }
    }

    if (content.length > 500 && !content.includes("```")) {
      return {
        type: "text",
        content,
        title: "Документ"
      }
    }

    return null
  }

  return {
    canvas,
    isOpen,
    openCanvas,
    closeCanvas,
    parseCanvasFromMessage
  }
}