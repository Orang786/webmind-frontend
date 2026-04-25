"use client"
import { Zap, RefreshCw, Clock } from "lucide-react"

interface Props {
  used: number
  limit: number
  cooldown: number // секунды до восстановления
  onNewChat: () => void
}

export default function TokenBar({ used, limit, onNewChat, cooldown }: Props) {
  const percent = Math.min((used / limit) * 100, 100)
  const isWarning = percent >= 70
  const isDanger = percent >= 90
  const isExhausted = used >= limit

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Zap size={14} className={isDanger ? "text-red-400" : isWarning ? "text-yellow-400" : "text-blue-400"} />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-28 h-1.5 bg-[#2d2d2d] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isDanger ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-blue-500"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-500 tabular-nums">
              {used.toLocaleString()} / {limit.toLocaleString()}
            </span>
          </div>
          {isExhausted && cooldown > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-yellow-400">
              <Clock size={10} />
              Восстановление через {formatTime(cooldown)}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onNewChat}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-[#333] hover:border-[#555] px-3 py-1.5 rounded-lg transition-all"
      >
        <RefreshCw size={12} />
        Новый чат
      </button>
    </div>
  )
}