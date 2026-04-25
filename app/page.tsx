"use client"
import { useState, useRef, useEffect } from "react"
import SearchBar from "@/components/SearchBar"
import WelcomeScreen from "@/components/WelcomeScreen"
import MarkdownResponse from "@/components/MarkdownResponse"
import TokenBar from "@/components/TokenBar"

// Лимит токенов на сессию
const TOKEN_LIMIT = 50000
// Время восстановления в секундах (3 минуты)
const COOLDOWN_SECONDS = 180

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: any[]
  isSearch?: boolean
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    fetch("https://webmind-backend.onrender.com/health")
      .then(() => console.log("✅ Backend живой!"))
      .catch(() => console.log("⚠️ Backend спит..."))
  }, [])
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<any>(null)

  // Таймер обратного отсчета восстановления токенов
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setTotalTokens(0) // Сбрасываем токены после ожидания!
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [cooldown])

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    })
  }, [messages, loading])

  const handleSearch = async (text: string) => {
    // Если токены исчерпаны И таймер уже идёт - блокируем
    if (totalTokens >= TOKEN_LIMIT && cooldown > 0) return
    // Если токены исчерпаны и таймера нет - запускаем таймер
    if (totalTokens >= TOKEN_LIMIT) {
      setCooldown(COOLDOWN_SECONDS)
      return
    }

    const userMsg: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch("https://webmind-backend-g78c.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          history: messages.slice(-8)
        })
      })

      const data = await res.json()

      setTotalTokens(prev => {
        const next = prev + (data.tokens_used || 0)
        // Если после ответа токены кончились - сразу запускаем таймер
        if (next >= TOKEN_LIMIT) setCooldown(COOLDOWN_SECONDS)
        return next
      })

      const aiMsg: Message = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        isSearch: data.is_search_performed
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setTotalTokens(0)
    setCooldown(0)
    clearInterval(timerRef.current)
  }

  const isBlocked = totalTokens >= TOKEN_LIMIT

  return (
    <div className="flex flex-col h-screen bg-[#131314] text-white">
      {/* Шапка */}
      <header className="flex justify-between items-center px-6 py-3 border-b border-[#2a2a2a] bg-[#131314] z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">
            Web<span className="text-blue-500">Mind</span> AI
          </span>
        </div>
        <TokenBar
          used={totalTokens}
          limit={TOKEN_LIMIT}
          cooldown={cooldown}
          onNewChat={handleNewChat}
        />
      </header>

      {/* Список сообщений */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">

          {messages.length === 0 && (
            <WelcomeScreen onPromptClick={handleSearch} />
          )}

          {messages.map((msg, i) => (
            <div key={i} className="fade-in">
              {msg.role === "user" ? (
                // Сообщение пользователя
                <div className="flex justify-end">
                  <div className="bg-[#1e1f20] border border-[#333] px-5 py-3 rounded-2xl max-w-[80%]">
                    <p className="text-white">{msg.content}</p>
                  </div>
                </div>
              ) : (
                // Ответ AI
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    {msg.isSearch && (
                      <div className="flex items-center gap-2 text-[10px] text-blue-400 mb-3 font-mono bg-blue-500/10 w-fit px-3 py-1 rounded-full border border-blue-500/20">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                        ПОИСК В СЕТИ
                      </div>
                    )}

                    <MarkdownResponse content={msg.content} />

                    {/* Источники */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {msg.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            className="flex items-center gap-1.5 text-[11px] bg-[#1e1f20] hover:bg-[#282a2d] px-3 py-1.5 rounded-lg border border-[#333] transition-colors max-w-[180px]"
                          >
                            <span className="truncate text-blue-300">{s.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Индикатор загрузки */}
          {loading && (
            <div className="flex gap-3 fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex-shrink-0" />
              <div className="flex items-center gap-1 pt-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Поле ввода */}
      <div className="px-4 pb-6 pt-2 bg-[#131314]">
        <div className="max-w-3xl mx-auto relative">

          {/* Блокировка при исчерпании токенов */}
          {isBlocked && (
            <div className="absolute -top-16 left-0 right-0 flex items-center justify-center gap-3 bg-[#1e1f20] border border-yellow-500/30 rounded-xl py-3 px-4">
              {cooldown > 0 ? (
                <>
                  <span className="text-yellow-400 text-sm">
                    ⏳ Подождите {Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, "0")} для восстановления токенов
                  </span>
                </>
              ) : (
                <span className="text-red-400 text-sm">
                  🚫 Лимит исчерпан. Создайте новый чат.
                </span>
              )}
            </div>
          )}

          <SearchBar onSearch={handleSearch} loading={loading || isBlocked} />
        </div>
        <p className="text-[11px] text-center text-gray-600 mt-3">
          WebMind AI может ошибаться. Проверяйте важную информацию.
        </p>
      </div>
    </div>
  )
}
