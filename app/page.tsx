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
import { Menu, Code } from "lucide-react"

const MarkdownResponse = dynamic(() => import("@/components/MarkdownResponse"), {
  ssr: false,
  loading: () => <p className="text-gray-400 animate-pulse">Загрузка...</p>
})

const TOKEN_LIMIT = 8000
const COOLDOWN_SECONDS = 180

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

  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  const handleSearch = async (text: string) => {
    if (isBlocked && cooldown > 0) return
    if (isBlocked) { setCooldown(COOLDOWN_SECONDS); return }

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
              const canvasContent = parseCanvasFromMessage(fullText)
              if (canvasContent) openCanvas(canvasContent)
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

      {/* Основной контент */}
      <div className={`
        flex flex-col flex-1 min-w-0 transition-all duration-300
        ${canvasOpen ? "md:w-[45%] md:flex-none" : ""}
      `}>

        {/* Шапка */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Бургер для мобилки */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-[#1e1f20] rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="text-lg font-bold">
              Web<span className="text-blue-500">Mind</span> AI
            </span>
          </div>
          <TokenBar
            used={currentTokens}
            limit={TOKEN_LIMIT}
            cooldown={cooldown}
            onNewChat={handleNewChat}
          />
        </header>

        {/* Сообщения */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">

            {messages.length === 0 && (
              <WelcomeScreen onPromptClick={handleSearch} />
            )}

            {messages.map((msg, i) => (
              <div key={i} className="fade-in">
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-[#1e1f20] border border-[#333] px-4 py-3 rounded-2xl max-w-[85%] sm:max-w-[80%]">
                      <p className="text-white text-sm sm:text-base">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      {msg.isSearch && (
                        <div className="flex items-center gap-2 text-[10px] text-blue-400 mb-2 sm:mb-3 font-mono bg-blue-500/10 w-fit px-2 sm:px-3 py-1 rounded-full border border-blue-500/20">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                          ПОИСК В СЕТИ
                        </div>
                      )}

                      <MarkdownResponse content={msg.content || "▌"} />

                      {msg.content && parseCanvasFromMessage(msg.content) && (
                        <button
                          onClick={() => {
                            const c = parseCanvasFromMessage(msg.content)
                            if (c) openCanvas(c)
                          }}
                          className="mt-2 sm:mt-3 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <Code size={12} />
                          Открыть в канвасе
                        </button>
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
                          {msg.sources.map((s: any, idx: number) => (
                            <a
                              key={idx}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] bg-[#1e1f20] hover:bg-[#282a2d] px-2 sm:px-3 py-1.5 rounded-lg border border-[#333] transition-colors max-w-[160px] sm:max-w-[180px] truncate text-blue-300"
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
              <div className="flex gap-2 sm:gap-3 fade-in">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex-shrink-0" />
                <div className="flex items-center gap-1 pt-2">
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Поле ввода */}
        <div className="px-3 sm:px-4 pb-4 sm:pb-6 pt-2 flex-shrink-0">
          <div className="max-w-2xl mx-auto relative">
            {isBlocked && (
              <div className="absolute -top-14 left-0 right-0 flex items-center justify-center bg-[#1e1f20] border border-yellow-500/30 rounded-xl py-3 px-4 text-center">
                {cooldown > 0
                  ? <span className="text-yellow-400 text-xs sm:text-sm">
                      ⏳ Подождите {Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, "0")}
                    </span>
                  : <span className="text-red-400 text-xs sm:text-sm">
                      🚫 Лимит исчерпан. Создайте новый чат.
                    </span>
                }
              </div>
            )}
            <SearchBar onSearch={handleSearch} loading={loading || isBlocked} />
          </div>
          <p className="text-[10px] sm:text-[11px] text-center text-gray-600 mt-2 sm:mt-3">
            WebMind AI может ошибаться. Проверяйте важную информацию.
          </p>
        </div>
      </div>

      {/* Канвас */}
      {canvasOpen && (
        <div className="fixed md:relative inset-0 md:inset-auto md:w-[55%] z-50 md:z-auto flex-shrink-0">
          <Canvas canvas={canvas} onClose={closeCanvas} />
        </div>
      )}
    </div>
  )
}