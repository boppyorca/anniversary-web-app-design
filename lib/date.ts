const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000

export interface ElapsedTime {
  totalDays: number
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isAtLeastOneYear: boolean
}

/**
 * Normalizes input date string into YYYY-MM-DD.
 * Strips non-digits, checks for 8 digits DD MM YYYY,
 * validates against calendar constraints.
 */
export function normalizeDateInput(input: string): string | null {
  if (!input) return null
  const digits = input.replace(/\D/g, '')
  if (digits.length !== 8) return null

  const day = parseInt(digits.slice(0, 2), 10)
  const month = parseInt(digits.slice(2, 4), 10)
  const year = parseInt(digits.slice(4, 8), 10)

  if (year < 1900 || year > 2100) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

/**
 * Calculates elapsed time from start date (default: 2025-10-20T00:00:00+07:00)
 * in Asia/Ho_Chi_Minh (UTC+7) timezone by shifting both instants +7h.
 */
export function getElapsed(
  nowInput: Date | number | string = new Date(),
  startStr: string = '2025-10-20T00:00:00+07:00'
): ElapsedTime {
  const startDate = new Date(startStr)
  const nowDate =
    typeof nowInput === 'string' || typeof nowInput === 'number'
      ? new Date(nowInput)
      : nowInput

  const diffMs = Math.max(0, nowDate.getTime() - startDate.getTime())
  const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  const startShifted = new Date(startDate.getTime() + VIETNAM_OFFSET_MS)
  const nowShifted = new Date(nowDate.getTime() + VIETNAM_OFFSET_MS)

  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
  const seconds = Math.floor((diffMs % (60 * 1000)) / 1000)

  let years = nowShifted.getUTCFullYear() - startShifted.getUTCFullYear()
  let months = nowShifted.getUTCMonth() - startShifted.getUTCMonth()
  let days = nowShifted.getUTCDate() - startShifted.getUTCDate()

  if (days < 0) {
    months -= 1
    const prevMonthDays = new Date(
      Date.UTC(nowShifted.getUTCFullYear(), nowShifted.getUTCMonth(), 0)
    ).getUTCDate()
    days += prevMonthDays
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years < 0) {
    years = 0
    months = 0
    days = 0
  }

  return {
    totalDays,
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    isAtLeastOneYear: totalDays >= 365,
  }
}
