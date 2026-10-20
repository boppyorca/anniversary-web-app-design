import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendTelegramNotification, escapeHtml } from '../lib/telegram'

describe('Feature: Telegram Bot Notifications (Thông báo Telegram)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
  })

  it('escapes HTML special characters to prevent Telegram formatting errors', () => {
    const raw = '<script>alert("hello & welcome\'s");</script>'
    const escaped = escapeHtml(raw)
    expect(escaped).toBe('&lt;script&gt;alert(&quot;hello &amp; welcome&#039;s&quot;);&lt;/script&gt;')
  })

  it('safely handles missing environment variables without crashing', async () => {
    const result = await sendTelegramNotification('Test message')
    expect(result).toBe(false)
  })

  it('calls Telegram Bot API with correct payload when configured', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'mock_bot_token_123'
    process.env.TELEGRAM_CHAT_ID = '987654321'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    globalThis.fetch = mockFetch

    const result = await sendTelegramNotification('<b>Love Note</b>')
    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.telegram.org/botmock_bot_token_123/sendMessage',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '987654321',
          text: '<b>Love Note</b>',
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      })
    )
  })
})
