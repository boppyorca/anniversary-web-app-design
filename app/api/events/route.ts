import { NextResponse } from 'next/server'
import { sendTelegramNotification } from '@/lib/telegram'
import { sendDiscordNotification } from '@/lib/discord'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const events = Array.isArray(body.events) ? body.events : []

    // If gate unlock event occurs, notify Discord & Telegram
    const gateUnlock = events.find((e: any) => e.name === 'gate_unlock_success')
    if (gateUnlock) {
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
        title: '🎉 Bạn Gái Đã Mở Khóa Thành Công!',
        description: 'Cổng bí mật đã mở, em bắt đầu xem hành trình kỷ niệm của hai đứa.',
        color: 5763719, // Green
        fields: [{ name: '⏰ Thời gian', value: timeString, inline: true }],
        footerText: 'Anniversary Web App 💖',
      })

      // 2. Send to Telegram
      await sendTelegramNotification(
        `🎉 <b>BẠN GÁI ĐÃ MỞ KHÓA THÀNH CÔNG!</b>\n\nCổng bí mật đã mở, em bắt đầu xem hành trình kỷ niệm của hai đứa.\n\n⏰ <i>${timeString}</i>`
      )
    }

    return NextResponse.json({ success: true, timestamp: Date.now() })
  } catch {
    return NextResponse.json({ success: true })
  }
}
