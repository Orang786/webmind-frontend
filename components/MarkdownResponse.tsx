"use client"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

export default function MarkdownResponse({ content }: { content: string }) {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Заголовки
        h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-6 mb-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold text-white mt-5 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold text-gray-200 mt-4 mb-2">{children}</h3>,

        // Параграф
        p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-3">{children}</p>,

        // Жирный и курсив
        strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
        em: ({ children }) => <em className="text-gray-200 italic">{children}</em>,

        // Списки
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-gray-300">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-300">{children}</ol>,
        li: ({ children }) => <li className="text-gray-300 ml-2">{children}</li>,

        // Код строчный
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "")
          const codeString = String(children).replace(/\n$/, "")

          if (!inline && match) {
            return (
              <div className="my-4 rounded-xl overflow-hidden border border-[#333]">
                {/* Шапка блока кода */}
                <div className="flex justify-between items-center px-4 py-2 bg-[#1e1f20] border-b border-[#333]">
                  <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
                  <button
                    onClick={() => handleCopy(codeString)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {copied === codeString
                      ? <><Check size={12} className="text-green-400" /> Скопировано!</>
                      : <><Copy size={12} /> Копировать</>
                    }
                  </button>
                </div>
                {/* Блок кода */}
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: "1.25rem",
                    fontSize: "0.875rem",
                    background: "#0d0d0d"
                  }}
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            )
          }

          return (
            <code className="bg-[#2d2d2d] text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          )
        },

        // Таблицы
        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-xl border border-[#333]">
            <table className="w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-[#1e1f20]">{children}</thead>,
        th: ({ children }) => (
          <th className="px-4 py-3 text-left text-white font-semibold border-b border-[#333]">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-3 text-gray-300 border-b border-[#333]">{children}</td>
        ),

        // Разделитель
        hr: () => <hr className="border-[#333] my-4" />,

        // Цитата
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500 pl-4 my-3 text-gray-400 italic">
            {children}
          </blockquote>
        ),

        // Ссылки
        a: ({ href, children }) => (
          <a href={href} target="_blank" className="text-blue-400 hover:underline">{children}</a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}