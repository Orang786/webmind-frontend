import { useState } from "react"
import { CanvasContent } from "@/components/Canvas"

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

  // Парсим ответ AI и ищем канвас-контент
  const parseCanvasFromMessage = (content: string): CanvasContent | null => {
    // Ищем блок кода с языком
    const codeMatch = content.match(/```(\w+)\n([\s\S]*?)```/)
    if (codeMatch) {
      const language = codeMatch[1]
      const code = codeMatch[2]

      // Определяем тип
      const isHTML = language === "html"

      return {
        type: isHTML ? "html" : "code",
        language,
        content: code,
        title: getTitle(language, content)
      }
    }

    // Если ответ длинный (больше 500 символов) и нет кода — текстовый канвас
    if (content.length > 500 && !content.includes("```")) {
      return {
        type: "text",
        content,
        title: "Документ"
      }
    }

    return null
  }

  const getTitle = (language: string, content: string): string => {
    const titles: Record<string, string> = {
      html: "HTML страница",
      css: "CSS стили",
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python скрипт",
      sql: "SQL запрос",
    }
    return titles[language] || `${language} файл`
  }

  return {
    canvas,
    isOpen,
    openCanvas,
    closeCanvas,
    parseCanvasFromMessage
  }
}