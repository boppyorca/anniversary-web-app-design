import { NextResponse } from 'next/server'
import { sendDiscordNotification } from '@/lib/discord'

export async function GET() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  const status = {
    hasWebhookUrl: Boolean(webhookUrl),
    webhookUrlMasked: webhookUrl
      ? `${webhookUrl.slice(0, 35)}...${webhookUrl.slice(-8)}`
      : null,
  }

  if (!webhookUrl) {
    return NextResponse.json(
      {
        success: false,
        status,
        error: 'Chưa tìm thấy biến môi trường DISCORD_WEBHOOK_URL.',
        solution:
          '1. Mở Discord -> Chọn kênh nhận tin nhắn -> Bấm bánh răng Cài đặt -> Tích hợp (Integrations) -> Tạo Webhook -> Sao chép URL Webhook.\n2. Vào Vercel -> Settings -> Environment Variables -> Thêm DISCORD_WEBHOOK_URL.\n3. Redeploy lại dự án.',
      },
      { status: 200 }
    )
  }

  const timeString = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })

  const sent = await sendDiscordNotification({
    title: '🔔 Kiểm Tra Kết Nối Discord Webhook Thành Công!',
    description: 'Ứng dụng kỷ niệm đã kết nối thành công với kênh Discord của bạn.',
    color: 15892389,
    fields: [{ name: '⏰ Thời gian kiểm tra', value: timeString, inline: true }],
    footerText: 'Anniversary Web App 💖',
  })

  if (!sent) {
    return NextResponse.json(
      {
        success: false,
        status,
        error: 'Không thể gửi tin nhắn đến Discord Webhook.',
        advice: 'Vui lòng kiểm tra lại đường link Webhook xem có bị thiếu ký tự nào không.',
      },
      { status: 200 }
    )
  }

  return NextResponse.json({
    success: true,
    status,
    message: 'Đã gửi tin nhắn thử nghiệm đến kênh Discord của bạn thành công!',
  })
}
