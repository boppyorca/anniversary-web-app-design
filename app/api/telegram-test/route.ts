import { NextResponse } from 'next/server'

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  const status = {
    hasBotToken: Boolean(botToken),
    botTokenPrefix: botToken ? `${botToken.slice(0, 6)}...` : null,
    hasChatId: Boolean(chatId),
    chatIdMasked: chatId ? `${String(chatId).slice(0, 3)}***` : null,
  }

  if (!botToken || !chatId) {
    return NextResponse.json(
      {
        success: false,
        status,
        error: !botToken
          ? 'Chưa tìm thấy biến TELEGRAM_BOT_TOKEN.'
          : 'Chưa tìm thấy biến TELEGRAM_CHAT_ID.',
        solution:
          '1. Nếu test trên Vercel: Thêm vào Settings -> Environment Variables, sau đó BẮT BUỘC bấm REDEPLOY để có hiệu lực.\n2. Nếu test trên localhost: Tạo file .env.local trong thư mục dự án.',
      },
      { status: 200 }
    )
  }

  try {
    const timeString = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    })

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🔔 <b>KIỂM TRA KẾT NỐI TELEGRAM BOT THÀNH CÔNG!</b>\n\nỨng dụng kỷ niệm đã kết nối thành công với Telegram của bạn.\n⏰ <i>${timeString}</i>`,
        parse_mode: 'HTML',
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      let advice = 'Kiểm tra lại cấu hình Telegram.'
      if (data.error_code === 403) {
        advice = 'BẠN ĐÃ CHẶN BOT: Hãy bỏ chặn bot trên Telegram để bot có thể gửi tin nhắn.'
      } else if (data.error_code === 400) {
        if (data.description?.includes('chat not found')) {
          advice = 'BẠN CHƯA BẤM START TRONG BOT: Telegram quy định bot không thể chủ động nhắn trước. Bạn hãy tìm Username con Bot của bạn trên Telegram và bấm nút "START" (hoặc gửi /start). Sau đó tải lại trang này.'
        } else {
          advice = 'CHAT_ID KHÔNG HỢP LỆ: Chat ID phải là dãy số nguyên (ví dụ: 123456789 từ @userinfobot), KHÔNG được dùng tên @username.'
        }
      } else if (data.error_code === 401) {
        advice = 'BOT_TOKEN KHÔNG ĐÚNG: Hãy kiểm tra và copy chính xác token được cấp từ @BotFather.'
      }

      return NextResponse.json(
        {
          success: false,
          status,
          telegramError: data,
          advice,
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      status,
      message: 'Tin nhắn thử nghiệm đã được gửi đến Telegram của bạn thành công!',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown network error'
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    )
  }
}
