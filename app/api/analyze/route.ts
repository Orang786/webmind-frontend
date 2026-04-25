import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "https://webmind-backend-g78c.onrender.com"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const isStream = body.stream === true

    const endpoint = isStream ? "/stream" : "/analyze"

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (isStream) {
      // Прокидываем стрим напрямую
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error: any) {
    console.error("Proxy error:", error)
    return NextResponse.json(
      {
        answer: "Ошибка соединения с сервером.",
        sources: [],
        is_search_performed: false,
        tokens_used: 0
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ status: "backend unavailable" }, { status: 503 })
  }
}