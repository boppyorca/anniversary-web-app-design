export interface QueuedRequest {
  id: string
  endpoint: string
  method: 'POST' | 'PUT'
  payload: unknown
  attempts: number
  nextAttemptAt: number
}

const QUEUE_STORAGE_KEY = 'anniv:v1:queue'
const MAX_ATTEMPTS = 5

export function getQueue(): QueuedRequest[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveQueue(queue: QueuedRequest[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // ignore
  }
}

export function enqueueRequest(
  endpoint: string,
  method: 'POST' | 'PUT',
  payload: unknown
): void {
  const queue = getQueue()
  const item: QueuedRequest = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    endpoint,
    method,
    payload,
    attempts: 0,
    nextAttemptAt: Date.now(),
  }
  queue.push(item)
  saveQueue(queue)
}

let isProcessing = false

export async function processQueue(
  sendFn: (endpoint: string, method: string, payload: unknown) => Promise<boolean>
): Promise<void> {
  if (typeof window === 'undefined' || isProcessing) return
  isProcessing = true

  try {
    const now = Date.now()
    const queue = getQueue()
    if (queue.length === 0) return

    const remaining: QueuedRequest[] = []

    for (const item of queue) {
      if (item.nextAttemptAt > now) {
        remaining.push(item)
        continue
      }

      try {
        const success = await sendFn(item.endpoint, item.method, item.payload)
        if (!success) {
          item.attempts += 1
          if (item.attempts < MAX_ATTEMPTS) {
            item.nextAttemptAt = Date.now() + Math.pow(2, item.attempts) * 1500
            remaining.push(item)
          }
        }
      } catch {
        item.attempts += 1
        if (item.attempts < MAX_ATTEMPTS) {
          item.nextAttemptAt = Date.now() + Math.pow(2, item.attempts) * 1500
          remaining.push(item)
        }
      }
    }

    saveQueue(remaining)
  } catch {
    // never throw to the UI
  } finally {
    isProcessing = false
  }
}

export function initQueueProcessor(
  sendFn: (endpoint: string, method: string, payload: unknown) => Promise<boolean>
): () => void {
  if (typeof window === 'undefined') return () => {}

  const run = () => {
    void processQueue(sendFn)
  }

  window.addEventListener('online', run)
  const timer = window.setInterval(run, 15000)

  // Trigger once immediately
  run()

  return () => {
    window.removeEventListener('online', run)
    window.clearInterval(timer)
  }
}
