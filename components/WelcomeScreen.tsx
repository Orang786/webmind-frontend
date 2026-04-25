"use client"

export default function WelcomeScreen({ onPromptClick }: any) {
  const suggestions = [
    "Лучшие AI фреймворки 2024",
    "Как работает блокчейн?",
    "Рецепт идеального кофе",
    "Сравнение iPhone и Android"
  ]

  return (
    <div className="mt-20 fade-in">
      <h1 className="text-5xl font-medium mb-12">
        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
          Привет!
        </span>
        <br />
        <span className="text-[#444746]">Чем могу помочь?</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((text) => (
          <button
            key={text}
            onClick={() => onPromptClick(text)}
            className="p-5 bg-[#1e1f20] hover:bg-[#282a2d] border border-transparent rounded-2xl text-left transition-all group"
          >
            <span className="text-gray-300 group-hover:text-white">{text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}