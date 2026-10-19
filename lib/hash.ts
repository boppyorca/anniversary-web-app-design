/**
 * Computes SHA-256 hash using Web Crypto API
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifySaltedDate(
  normalizedDate: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const computedHash = await sha256(salt + normalizedDate)
  return computedHash.toLowerCase() === expectedHash.toLowerCase()
}
