/**
 * Telegram Bot Notification Helper
 * Sends formatted alert messages to your personal Telegram via Bot API
 *
 * Configured via environment variables:
 * - TELEGRAM_BOT_TOKEN: From @BotFather (e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ)
 * - TELEGRAM_CHAT_ID: Your personal Telegram Chat ID (e.g. 123456789)
 */

export async function sendTelegramNotification(htmlMessage: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n[Telegram Bot - Chưa cấu hình TOKEN hoặc CHAT_ID]')
      console.log(htmlMessage.replace(/<[^>]+>/g, ''))
      console.log('---------------------------------------------------\n')
    }
    return false
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.ok) {
      console.error('[Telegram] Lỗi phản hồi từ Telegram API:', data)
      return false
    }

    return true
  } catch (err) {
    console.error('[Telegram] Lỗi mạng khi gọi Telegram API:', err)
    return false
  }
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
