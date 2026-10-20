import { NextResponse } from 'next/server'
import { sendTelegramNotification, escapeHtml } from '@/lib/telegram'
import { sendDiscordNotification } from '@/lib/discord'
import { content } from '@/content/content'

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const questionKey = typeof body.questionKey === 'string' ? body.questionKey : ''
    const answerText = typeof body.answerText === 'string' ? body.answerText.trim() : ''

    if (!answerText) {
      return NextResponse.json({ success: true })
    }

    // Find readable question title from content
    const matchedQ = content.quiz.questions.find((item) => item.key === questionKey)
    const questionTitle = matchedQ ? matchedQ.title : questionKey

    const timeString = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    // 1. Send to Discord
    await sendDiscordNotification({
      title: '✨ Câu Trả Lời Quiz Từ Bạn Gái',
      color: 7251686, // Blue #6EA6E6
      fields: [
        { name: '❓ Câu hỏi', value: questionTitle },
        { name: '💬 Câu trả lời', value: `"${answerText}"` },
        { name: '⏰ Thời gian', value: timeString, inline: true },
      ],
      footerText: 'Anniversary Web App 💖',
    })

    // 2. Send to Telegram
    const text = `✨ <b>CÂU TRẢ LỜI QUIZ TỪ BẠN GÁI</b>\n\n❓ <b>Câu hỏi:</b> ${escapeHtml(questionTitle)}\n💬 <b>Em trả lời:</b> "${escapeHtml(answerText)}"\n\n⏰ <i>${timeString}</i>`
    await sendTelegramNotification(text)

    return NextResponse.json({ success: true, timestamp: Date.now() })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API answers] Lỗi xử lý:', errorMsg)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
