"use client"
import { Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import { Chat } from "@/hooks/useChats"
import { useState } from "react"

interface Props {
  chats: Chat[]
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onDeleteChat: (id: string) => void
}

export default function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
  }

  return (
    <div className={`flex flex-col bg-[#0f0f0f] border-r border-[#2a2a2a] transition-all duration-300 ${collapsed ? "w-12" : "w-64"} flex-shrink-0`}>
      
      {/* Шапка сайдбара */}
      <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a]">
        {!collapsed && (
          <span className="text-sm font-semibold text-gray-400">Чаты</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-[#1e1f20] rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Кнопка нового чата */}
      <div className="p-2">
        <button
          onClick={onNewChat}
          className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium ${collapsed ? "justify-center" : ""}`}
        >
          <Plus size={16} />
          {!collapsed && "Новый чат"}
        </button>
      </div>

      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
              activeChatId === chat.id
                ? "bg-[#1e1f20] text-white"
                : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
            }`}
          >
            <MessageSquare size={15} className="flex-shrink-0" />
            
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{chat.title}</p>
                  <p className="text-[10px] text-gray-600">{formatDate(chat.createdAt)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteChat(chat.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        ))}

        {chats.length === 0 && !collapsed && (
          <p className="text-xs text-gray-600 text-center py-8">
            Нет сохранённых чатов
          </p>
        )}
      </div>
    </div>
  )
}