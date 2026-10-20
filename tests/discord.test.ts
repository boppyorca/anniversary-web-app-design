import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendDiscordNotification } from '../lib/discord'

describe('Feature: Discord Webhook Notifications (Thông báo Discord)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    delete process.env.DISCORD_WEBHOOK_URL
  })

  it('safely handles missing DISCORD_WEBHOOK_URL without crashing', async () => {
    const result = await sendDiscordNotification({
      title: 'Test Note',
      description: 'Hello',
    })
    expect(result).toBe(false)
  })

  it('sends formatted rich embed to Discord Webhook URL', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/123/abc'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'ok',
    })
    globalThis.fetch = mockFetch

    const result = await sendDiscordNotification({
      title: '💌 Love Note',
      description: 'I love you',
      fields: [{ name: 'Time', value: '20:30' }],
    })

    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/123/abc',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Love Note'),
      })
    )
  })
})
