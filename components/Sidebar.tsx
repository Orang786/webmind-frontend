"use client"
import { Plus, Trash2, MessageSquare, X } from "lucide-react"
import { Chat } from "@/hooks/useChats"

interface Props {
  chats: Chat[]
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onDeleteChat: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({
  chats, activeChatId, onSelectChat,
  onNewChat, onDeleteChat, isOpen, onClose
}: Props) {

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("ru-RU", {
      day: "numeric", month: "short"
    })
  }

  const handleSelectChat = (id: string) => {
    onSelectChat(id)
    onClose() // Закрываем на мобилке после выбора
  }

  return (
    <>
      {/* Затемнение фона на мобилке */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Сайдбар */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50
        flex flex-col bg-[#0f0f0f] border-r border-[#2a2a2a]
        w-72 md:w-64 flex-shrink-0
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        {/* Шапка */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <span className="text-sm font-semibold text-gray-400">Чаты</span>
          {/* Крестик только на мобилке */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-gray-400 hover:text-white hover:bg-[#1e1f20] rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Кнопка нового чата */}
        <div className="p-3">
          <button
            onClick={() => { onNewChat(); onClose() }}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium"
          >
            <Plus size={16} />
            Новый чат
          </button>
        </div>

        {/* Список чатов */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
                activeChatId === chat.id
                  ? "bg-[#1e1f20] text-white"
                  : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
              }`}
            >
              <MessageSquare size={15} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{chat.title}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {formatDate(chat.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id) }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 transition-all flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {chats.length === 0 && (
            <p className="text-xs text-gray-600 text-center py-8">
              Нет сохранённых чатов
            </p>
          )}
        </div>
      </div>
    </>
  )
}