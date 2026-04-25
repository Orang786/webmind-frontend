import { useState, useEffect } from "react"

export interface Message {
  role: "user" | "assistant"
  content: string
  sources?: any[]
  isSearch?: boolean
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  tokensUsed: number
}

const STORAGE_KEY = "webmind_chats"

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  // Загружаем чаты из localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      setChats(parsed)
      // Открываем последний чат
      if (parsed.length > 0) {
        setActiveChatId(parsed[0].id)
      }
    }
  }, [])

  // Сохраняем в localStorage при каждом изменении
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
    }
  }, [chats])

  const activeChat = chats.find(c => c.id === activeChatId) || null

  const createChat = (): string => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "Новый чат",
      messages: [],
      createdAt: Date.now(),
      tokensUsed: 0
    }
    setChats(prev => [newChat, ...prev])
    setActiveChatId(newChat.id)
    return newChat.id
  }

  const deleteChat = (id: string) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== id)
      // Если удалили активный — открываем следующий
      if (id === activeChatId) {
        setActiveChatId(filtered[0]?.id || null)
      }
      // Очищаем localStorage если чатов нет
      if (filtered.length === 0) {
        localStorage.removeItem(STORAGE_KEY)
      }
      return filtered
    })
  }

  const addMessage = (chatId: string, message: Message) => {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat

      // Первое сообщение пользователя становится заголовком
      const title = chat.messages.length === 0 && message.role === "user"
        ? message.content.slice(0, 40) + (message.content.length > 40 ? "..." : "")
        : chat.title

      return {
        ...chat,
        title,
        messages: [...chat.messages, message]
      }
    }))
  }

  const updateLastMessage = (chatId: string, content: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat
      const messages = [...chat.messages]
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content
      }
      return { ...chat, messages }
    }))
  }

  const addTokens = (chatId: string, tokens: number) => {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat
      return { ...chat, tokensUsed: chat.tokensUsed + tokens }
    }))
  }

  return {
    chats,
    activeChat,
    activeChatId,
    setActiveChatId,
    createChat,
    deleteChat,
    addMessage,
    updateLastMessage,
    addTokens
  }
}