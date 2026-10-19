import { createHash, randomBytes } from 'node:crypto'

const salt = 'anniv_salt_20251020_love'
const targetDate = '2025-10-20'

const hash = createHash('sha256').update(salt + targetDate).digest('hex')

console.log(`Salt: ${salt}`)
console.log(`Target Date: ${targetDate}`)
console.log(`SHA-256 Hash: ${hash}`)
