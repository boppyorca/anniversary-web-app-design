import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getQueue,
  saveQueue,
  enqueueRequest,
  processQueue,
  type QueuedRequest,
} from '../lib/queue'

const storageMap = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, val: string) => {
    storageMap.set(key, String(val))
  },
  removeItem: (key: string) => {
    storageMap.delete(key)
  },
  clear: () => {
    storageMap.clear()
  },
}

describe('Feature: Offline Queue & Telemetry Resilience (Hàng đợi ngoại tuyến)', () => {
  beforeEach(() => {
    // @ts-expect-error polyfill for test
    globalThis.window = globalThis
    // @ts-expect-error polyfill for test
    globalThis.localStorage = mockLocalStorage
    mockLocalStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts with an empty queue', () => {
    expect(getQueue()).toEqual([])
  })

  it('enqueues requests into queue storage', () => {
    enqueueRequest('/api/event', 'POST', { event: 'stage_complete', stage: 'gate' })
    const queue = getQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].endpoint).toBe('/api/event')
    expect(queue[0].method).toBe('POST')
    expect(queue[0].attempts).toBe(0)
    expect(queue[0].payload).toEqual({ event: 'stage_complete', stage: 'gate' })
  })

  it('processes pending requests when sendFn returns true', async () => {
    enqueueRequest('/api/test', 'POST', { hello: 'world' })
    expect(getQueue()).toHaveLength(1)

    const sendFn = vi.fn().mockResolvedValue(true)
    await processQueue(sendFn)

    expect(sendFn).toHaveBeenCalledTimes(1)
    expect(getQueue()).toHaveLength(0)
  })

  it('retries with exponential backoff when sendFn returns false', async () => {
    enqueueRequest('/api/retry', 'POST', { val: 123 })
    const sendFn = vi.fn().mockResolvedValue(false)

    await processQueue(sendFn)

    const queue = getQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].attempts).toBe(1)
    // nextAttemptAt should be in the future
    expect(queue[0].nextAttemptAt).toBeGreaterThan(Date.now())
  })

  it('discards request when max attempts reached (5 attempts)', async () => {
    const expiredItem: QueuedRequest = {
      id: 'test-1',
      endpoint: '/api/max',
      method: 'POST',
      payload: {},
      attempts: 4, // 5th attempt will fail and be discarded
      nextAttemptAt: Date.now() - 1000,
    }
    saveQueue([expiredItem])

    const sendFn = vi.fn().mockResolvedValue(false)
    await processQueue(sendFn)

    expect(getQueue()).toHaveLength(0)
  })
})
