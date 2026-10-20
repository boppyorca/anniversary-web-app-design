import { NextResponse } from 'next/server'
import { sendTelegramNotification, escapeHtml } from '@/lib/telegram'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    if (!message) {
      return NextResponse.json({ success: false, error: 'Tin nhắn trống' }, { status: 400 })
    }

    const timeString = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    const text = `💌 <b>LỜI NHẮN MỚI TỪ BẠN GÁI (KỶ NIỆM)</b>\n\n"${escapeHtml(message)}"\n\n⏰ <i>Gửi lúc: ${timeString}</i>\n📱 <i>Phiên duyệt: ${escapeHtml(String(body.sessionId || 'Ẩn danh'))}</i>`

    const sent = await sendTelegramNotification(text)

    return NextResponse.json({
      success: true,
      deliveredToTelegram: sent,
      timestamp: Date.now(),
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API final-reply] Lỗi xử lý:', errorMsg)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
