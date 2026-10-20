import { enqueueRequest, initQueueProcessor } from './queue'

const SESSION_STORAGE_KEY = 'anniv:v1:session'

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server_session'
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      localStorage.setItem(SESSION_STORAGE_KEY, id)
    }
    return id
  } catch {
    return 'fallback_session'
  }
}

async function executeHttpCall(
  endpoint: string,
  method: string,
  payload: unknown
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || ''
  const apiPath = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`
  const url = baseUrl ? `${baseUrl.replace(/\/+$/, '')}${apiPath}` : apiPath

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return response.ok
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API offline/fallback] ${method} ${url}`, err)
    }
    return false
  }
}

// Initialize queue processor once in browser
if (typeof window !== 'undefined') {
  initQueueProcessor(executeHttpCall)
}

function fireAndForget(endpoint: string, method: 'POST' | 'PUT', payload: unknown): void {
  // Fire immediately
  void (async () => {
    try {
      const ok = await executeHttpCall(endpoint, method, payload)
      if (!ok) {
        enqueueRequest(endpoint, method, payload)
      }
    } catch {
      enqueueRequest(endpoint, method, payload)
    }
  })()
}

export function createSession(): void {
  const sessionId = getSessionId()
  fireAndForget('/session', 'POST', {
    sessionId,
    startedAt: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  })
}

export function saveAnswer(
  questionKey: 'q1' | 'q2' | 'q3',
  answerText: string
): void {
  const sessionId = getSessionId()
  // Save local backup copy on client
  if (typeof window !== 'undefined') {
    try {
      const prev = JSON.parse(localStorage.getItem('anniv:v1:quiz_answers') || '{}')
      prev[questionKey] = { answerText, timestamp: Date.now() }
      localStorage.setItem('anniv:v1:quiz_answers', JSON.stringify(prev))
    } catch {
      // ignore
    }
  }

  fireAndForget('/answers', 'PUT', {
    sessionId,
    questionKey,
    answerText,
  })
}

export function trackEvent(
  name: string,
  stage: string,
  meta?: Record<string, unknown>
): void {
  const sessionId = getSessionId()
  fireAndForget('/events', 'POST', {
    sessionId,
    events: [
      {
        name,
        stage,
        meta,
        ts: Date.now(),
      },
    ],
  })
}

export function sendFinalReply(message: string, choice?: string): void {
  const sessionId = getSessionId()
  // Save local backup copy on client
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        'anniv:v1:last_reply',
        JSON.stringify({ message, choice, timestamp: Date.now() })
      )
    } catch {
      // ignore
    }
  }

  fireAndForget('/final-reply', 'POST', {
    sessionId,
    message,
    choice,
  })
}
