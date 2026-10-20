export interface DiscordField {
  name: string
  value: string
  inline?: boolean
}

export interface DiscordEmbedOptions {
  title: string
  description?: string
  color?: number // Default pink: 0xF27FA5 (15892389)
  fields?: DiscordField[]
  footerText?: string
}

/**
 * Sends a rich embedded notification to Discord via Webhook.
 * Requires environment variable:
 * - DISCORD_WEBHOOK_URL: Full webhook URL from Discord channel settings
 */
export async function sendDiscordNotification(options: DiscordEmbedOptions): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n[Discord Webhook - Chưa cấu hình DISCORD_WEBHOOK_URL]')
      console.log(options.title, options.description || '')
      console.log('---------------------------------------------------\n')
    }
    return false
  }

  try {
    const embed = {
      title: options.title,
      description: options.description,
      color: options.color ?? 15892389, // #F27FA5 (pink-500)
      fields: options.fields,
      footer: {
        text: options.footerText || 'Kỷ Niệm Của Chúng Mình 💖',
      },
      timestamp: new Date().toISOString(),
    }

    const payload = {
      username: 'Kỷ Niệm Của Chúng Mình 💖',
      avatar_url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f48c.png',
      embeds: [embed],
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('[Discord] Lỗi gửi webhook:', res.status, errText)
      return false
    }

    return true
  } catch (err) {
    console.error('[Discord] Lỗi kết nối Webhook:', err)
    return false
  }
}
