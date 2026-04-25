"use client"
import { useState } from "react"
import { SendHorizonal } from "lucide-react"

export default function SearchBar({ onSearch, loading }: any) {
  const [text, setText] = useState("")

  const submit = (e: any) => {
    e.preventDefault()
    if (text.trim() && !loading) {
      onSearch(text)
      setText("")
    }
  }

  return (
    <form onSubmit={submit} className="relative group">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Введите запрос..."
        className="w-full bg-[#1e1f20] text-white rounded-full py-4 px-6 pr-14 focus:outline-none focus:bg-[#282a2d] border border-transparent focus:border-[#333] transition-all"
        disabled={loading}
      />
      <button
        type="submit"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-30"
        disabled={!text.trim() || loading}
      >
        <SendHorizonal size={24} />
      </button>
    </form>
  )
}