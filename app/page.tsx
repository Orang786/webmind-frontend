"use client"

import { useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import SearchBar from "@/components/SearchBar"
import WelcomeScreen from "@/components/WelcomeScreen"
import TokenBar from "@/components/TokenBar"
import Sidebar from "@/components/Sidebar"
import Canvas from "@/components/Canvas"
import { useChats } from "@/hooks/useChats"
import { useCanvas } from "@/hooks/useCanvas"
import { useMindMap } from "@/hooks/useMindMap"
import { Menu, Code, Map } from "lucide-react"

const MarkdownResponse = dynamic(() => import("@/components/MarkdownResponse"), {
  ssr: false,
  loading: () => <p className="text-gray-400 animate-pulse">Загрузка...</p>
})

const MindMap = dynamic(() => import("@/components/MindMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
})

const TOKEN_LIMIT = 8000
const COOLDOWN_SECONDS = 180

// Что показываем справа
type RightPanel = "none" | "canvas" | "mindmap"

export default function Home() {
  const {
    chats, activeChat, activeChatId,
    setActiveChatId, createChat, deleteChat,
    addMessage, updateLastMessage, addTokens
  } = useChats()

  const {
    canvas, isOpen: canvasOpen,
    openCanvas, closeCanvas, parseCanvasFromMessage
  } = useCanvas()

  const {
    mindMap, isOpen: mindMapOpen,
    openMindMap, closeMindMap, parseMindMap
  } = useMindMap()

  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rightPanel, setRightPanel] = useState<RightPanel>("none")
  const [lastQuery, setLastQuery] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<any>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch("/api/analyze").catch(console.error)
  }, [])

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [cooldown])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    })
  }, [activeChat?.messages, loading])

  const currentTokens = activeChat?.tokensUsed || 0
  const isBlocked = currentTokens >= TOKEN_LIMIT
  const isPanelOpen = rightPanel !== "none"

  const handleSearch = async (text: string) => {
    if (isBlocked && cooldown > 0) return
    if (isBlocked) { setCooldown(COOLDOWN_SECONDS); return }

    setLastQuery(text)
    let chatId = activeChatId
    if (!chatId) chatId = createChat()

    addMessage(chatId, { role: "user", content: text })
    setLoading(true)

    const history = activeChat?.messages.slice(-8) || []

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, history, stream: true })
      })

      if (!res.ok) throw new Error("Ошибка сервера")

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      let fullText = ""
      let sources: any[] = []
      let isSearch = false
      let isFirstChunk = true

      addMessage(chatId, {
        role: "assistant", content: "", sources: [], isSearch: false
      })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6).trim()
          if (!data) continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === "meta") {
              sources = parsed.sources || []
              isSearch = parsed.is_search_performed || false
            }
            if (parsed.type === "chunk") {
              fullText += parsed.text
              updateLastMessage(chatId!, fullText)
              if (isFirstChunk) { setLoading(false); isFirstChunk = false }
            }
            if (parsed.type === "done") {
              // Проверяем канвас
              const canvasContent = parseCanvasFromMessage(fullText)
              if (canvasContent) {
                openCanvas(canvasContent)
                setRightPanel("canvas")
              }

              // Всегда строим карту знаний если есть структура
              const mindMapData = parseMindMap(fullText, text)
              if (mindMapData) {
                openMindMap(mindMapData)
                // Если нет канваса — показываем карту
                if (!canvasContent) setRightPanel("mindmap")
              }

              addTokens(chatId!, Math.floor(fullText.length / 4))
            }
          } catch {}
        }
      }

    } catch (e) {
      console.error(e)
      addMessage(chatId!, {
        role: "assistant",
        content: "Произошла ошибка. Попробуйте ещё раз."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    createChat()
    setCooldown(0)
    setSidebarOpen(false)
    setRightPanel("none")
  }

  const handleClosePanel = () => {
    setRightPanel("none")
    closeCanvas()
    closeMindMap()
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#131314]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const messages = activeChat?.messages || []

  return (
    <div className="flex h-screen bg-[#131314] text-white overflow-hidden">

      {/* Сайдбар */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Чат */}
      <div className={`flex flex-col min-w-0 transition-all duration-300 ${isPanelOpen ? "md:w-[42%] md:flex-none" : "flex-1"}`}>

        {/* Шапка */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-[#1e1f20] rounded-lg"
            >
              <Menu size={20} />
            </button>
            <span className="text-lg font-bold">
              Web<span className="text-blue-500">Mind</span> AI
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Переключатель панелей (если есть что показать) */}
            {(canvasOpen || mindMapOpen) && (
              <div className="hidden sm:flex bg-[#1e1f20] rounded-lg p-0.5 border border-[#333]">
                {canvasOpen && (
                  <button
                    onClick={() => setRightPanel("canvas")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                      rightPanel === "canvas" ? "bg-[#2a2a2a] text-white" : "text-gray-500 hover:text-white"
                    }`}
                  >
                    <Code size={12} />
                    Канвас
                  </button>
                )}
                {mindMapOpen && (
                  <button
                    onClick={() => setRightPanel("mindmap")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                      rightPanel === "mindmap" ? "bg-[#2a2a2a] text-white" : "text-gray-500 hover:text-white"
                    }`}
                  >
                    <Map size={12} />
                    Карта
                  </button>
                )}
              </div>
            )}

            <TokenBar
              used={currentTokens}
              limit={TOKEN_LIMIT}
              cooldown={cooldown}
              onNewChat={handleNewChat}
            />
          </div>
        </header>

        {/* Сообщения */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-6">

            {messages.length === 0 && (
              <WelcomeScreen onPromptClick={handleSearch} />
            )}

            {messages.map((msg, i) => (
              <div key={i} className="fade-in">
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-[#1e1f20] border border-[#333] px-4 py-3 rounded-2xl max-w-[85%]">
                      <p className="text-white text-sm sm:text-base">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      {msg.isSearch && (
                        <div className="flex items-center gap-2 text-[10px] text-blue-400 mb-2 font-mono bg-blue-500/10 w-fit px-2 py-1 rounded-full border border-blue-500/20">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                          ПОИСК В СЕТИ
                        </div>
                      )}

                      <MarkdownResponse content={msg.content || "▌"} />

                      {/* Кнопки открытия панелей */}
                      {msg.content && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {parseCanvasFromMessage(msg.content) && (
                            <button
                              onClick={() => {
                                const c = parseCanvasFromMessage(msg.content)
                                if (c) { openCanvas(c); setRightPanel("canvas") }
                              }}
                              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-all"
                            >
                              <Code size={11} />
                              Канвас
                            </button>
                          )}
                          {parseMindMap(msg.content, lastQuery) && (
                            <button
                              onClick={() => {
                                const m = parseMindMap(msg.content, lastQuery)
                                if (m) { openMindMap(m); setRightPanel("mindmap") }
                              }}
                              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg transition-all"
                            >
                              <Map size={11} />
                              Карта знаний
                            </button>
                          )}
                        </div>
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.sources.map((s: any, idx: number) => (
                            <a
                              key={idx}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] bg-[#1e1f20] hover:bg-[#282a2d] px-2 py-1.5 rounded-lg border border-[#333] transition-colors max-w-[160px] truncate text-blue-300"
                            >
                              {s.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex-shrink-0" />
                <div className="flex items-center gap-1 pt-2">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Поле ввода */}
        <div className="px-3 sm:px-4 pb-4 pt-2 flex-shrink-0">
          <div className="max-w-2xl mx-auto relative">
            {isBlocked && (
              <div className="absolute -top-14 left-0 right-0 flex items-center justify-center bg-[#1e1f20] border border-yellow-500/30 rounded-xl py-3 px-4">
                {cooldown > 0
                  ? <span className="text-yellow-400 text-xs sm:text-sm">⏳ {Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, "0")}</span>
                  : <span className="text-red-400 text-xs sm:text-sm">🚫 Лимит исчерпан</span>
                }
              </div>
            )}
            <SearchBar onSearch={handleSearch} loading={loading || isBlocked} />
          </div>
          <p className="text-[10px] text-center text-gray-600 mt-2">
            WebMind AI может ошибаться. Проверяйте важную информацию.
          </p>
        </div>
      </div>

      {/* Правая панель — Канвас или Карта */}
      {isPanelOpen && (
        <div className="fixed md:relative inset-0 md:inset-auto md:flex-1 z-50 md:z-auto">
          {rightPanel === "canvas" && (
            <Canvas canvas={canvas} onClose={handleClosePanel} />
          )}
          {rightPanel === "mindmap" && (
            <MindMap data={mindMap} onClose={handleClosePanel} />
          )}
        </div>
      )}
    </div>
  )
}