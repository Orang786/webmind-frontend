import { ExternalLink, CheckCircle, BookOpen, Layers } from "lucide-react"

export default function ResultCard({ result }: any) {
  // Если результата вообще нет, ничего не рисуем
  if (!result) return null;

  return (
    <div className="flex flex-col gap-8 fade-in"> 
      
      {/* Анализ */}
      <div>
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Анализ темы
        </h2>
        <p className="text-[#e3e3e3] leading-relaxed text-lg whitespace-pre-wrap">
          {result.summary || "Анализ не подготовлен."}
        </p>
      </div>

      {/* Ключевые пункты */}
      {/* Проверяем, есть ли список и не пустой ли он */}
      {result.key_points && result.key_points.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4 text-green-400">
             <CheckCircle size={22} />
             <h2 className="text-xl font-bold text-[#e3e3e3]">Ключевые пункты</h2>
          </div>
          <ul className="flex flex-col gap-4">
            {result.key_points.map((point: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="bg-[#3c4043] text-gray-300 text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                  {i + 1}
                </span>
                <span className="text-[#e3e3e3] text-lg">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Детали */}
      {result.raw_analysis && (
        <div>
          <div className="flex items-center gap-3 mb-4 text-purple-400">
            <Layers size={22} />
            <h2 className="text-xl font-bold text-[#e3e3e3]">Детали и нюансы</h2>
          </div>
          <p className="text-[#e3e3e3] leading-relaxed text-lg whitespace-pre-wrap">
            {result.raw_analysis}
          </p>
        </div>
      )}

      {/* Источники */}
      {result.sources && result.sources.length > 0 && (
        <div className="pb-10">
          <h2 className="text-xl font-bold mb-5">📚 Источники</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.sources.map((source: any, i: number) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-2 p-4 rounded-2xl bg-[#1e1f20] hover:bg-[#282a2d] transition-colors border border-[#333]"
              >
                <div className="flex items-center gap-2 text-blue-400">
                  <ExternalLink size={14} />
                  <p className="font-medium text-sm line-clamp-1">{source.title}</p>
                </div>
                <p className="text-gray-500 text-xs line-clamp-2">{source.snippet}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}