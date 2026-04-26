"use client"
import { useState } from "react"
import { SendHorizonal, Loader2 } from "lucide-react"

export default function SearchBar({ onSearch, loading }: any) {
  const [text, setText] = useState("")

  const submit = (e: any) => {
    e.preventDefault()
    if (text.trim() && !loading) {
      onSearch(text)
      setText("")
    }
  }

  // Отправка по Enter (но Shift+Enter = новая строка)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit(e)
    }
  }

  return (
    <form onSubmit={submit} className="relative group">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Введите запрос..."
        rows={1}
        className="
          w-full bg-[#1e1f20] text-white rounded-2xl
          py-4 px-5 pr-14
          focus:outline-none focus:bg-[#282a2d]
          border border-transparent focus:border-[#333]
          transition-all resize-none
          text-sm sm:text-base
          min-h-[56px] max-h-[200px]
        "
        style={{ height: "auto" }}
        disabled={loading}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement
          target.style.height = "auto"
          target.style.height = Math.min(target.scrollHeight, 200) + "px"
        }}
      />
      <button
        type="submit"
        className="
          absolute right-3 bottom-3
          w-10 h-10 flex items-center justify-center
          bg-blue-600 hover:bg-blue-700
          disabled:bg-[#333] disabled:cursor-not-allowed
          rounded-xl transition-colors
        "
        disabled={!text.trim() || loading}
      >
        {loading
          ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          : <SendHorizonal className="w-4 h-4 text-white" />
        }
      </button>
    </form>
  )
}