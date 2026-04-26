"use client"

import { useState, useEffect } from "react"
import { Copy, Check, X, Code, Eye, ChevronDown } from "lucide-react"
import dynamic from "next/dynamic"

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false })

export interface CanvasContent {
  type: "code" | "text" | "html"
  language?: string
  content: string
  title: string
}

interface Props {
  canvas: CanvasContent | null
  onClose: () => void
}

export default function Canvas({ canvas, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code")
  const [editableContent, setEditableContent] = useState("")

  useEffect(() => {
    if (canvas) {
      setEditableContent(canvas.content)
      setActiveTab(canvas.language === "html" ? "preview" : "code")
    }
  }, [canvas])

  if (!canvas) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(editableContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isHTML = canvas.language === "html"

  return (
    // На мобилке — фиксированный overlay на весь экран
    // На десктопе — панель справа
    <div className="
      fixed md:relative inset-0 md:inset-auto
      flex flex-col z-50
      bg-[#0f0f0f] border-l border-[#2a2a2a]
      w-full md:w-auto
    ">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Code size={16} className="text-blue-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-white truncate">
            {canvas.title}
          </span>
          {canvas.language && (
            <span className="hidden sm:block text-[10px] bg-[#1e1f20] border border-[#333] px-2 py-0.5 rounded text-gray-400 font-mono flex-shrink-0">
              {canvas.language}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Табы для HTML */}
          {isHTML && (
            <div className="flex bg-[#1e1f20] rounded-lg p-0.5 border border-[#333]">
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  activeTab === "code" ? "bg-[#2a2a2a] text-white" : "text-gray-500"
                }`}
              >
                <Code size={11} />
                <span className="hidden sm:block">Код</span>
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  activeTab === "preview" ? "bg-[#2a2a2a] text-white" : "text-gray-500"
                }`}
              >
                <Eye size={11} />
                <span className="hidden sm:block">Превью</span>
              </button>
            </div>
          )}

          {/* Копировать */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-[#333] px-2 sm:px-3 py-1.5 rounded-lg transition-all"
          >
            {copied
              ? <><Check size={12} className="text-green-400" /><span className="hidden sm:block">Скопировано</span></>
              : <><Copy size={12} /><span className="hidden sm:block">Копировать</span></>
            }
          </button>

          {/* Закрыть */}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1e1f20] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "preview" && isHTML ? (
          <iframe
            srcDoc={editableContent}
            className="w-full h-full bg-white"
            sandbox="allow-scripts"
            title="preview"
          />
        ) : canvas.type === "text" ? (
          <textarea
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            className="w-full h-full bg-[#0f0f0f] text-gray-300 p-6 resize-none focus:outline-none font-sans text-base leading-relaxed"
          />
        ) : (
          <div className="h-full overflow-auto">
            <CodeMirrorEditor
              value={editableContent}
              language={canvas.language || "text"}
              onChange={setEditableContent}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function CodeMirrorEditor({ value, language, onChange }: {
  value: string
  language: string
  onChange: (v: string) => void
}) {
  const [extensions, setExtensions] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const exts: any[] = []
      if (["javascript", "js", "typescript"].includes(language)) {
        const { javascript } = await import("@codemirror/lang-javascript")
        exts.push(javascript({ typescript: language === "typescript" }))
      } else if (language === "html") {
        const { html } = await import("@codemirror/lang-html")
        exts.push(html())
      } else if (language === "python") {
        const { python } = await import("@codemirror/lang-python")
        exts.push(python())
      } else if (language === "css") {
        const { css } = await import("@codemirror/lang-css")
        exts.push(css())
      }
      setExtensions(exts)
    }
    load()
  }, [language])

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme="dark"
      extensions={extensions}
      onChange={onChange}
      style={{ fontSize: "14px", height: "100%" }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        autocompletion: true,
      }}
    />
  )
}