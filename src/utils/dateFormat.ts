export interface FormatOption {
  id: string
  label: string
  format: string
  type: 'date' | 'time' | 'datetime'
}

export interface TimezoneOption {
  id: string
  label: string
  offset: number // hours offset from UTC
}

export const defaultFormats: FormatOption[] = [
  // 日期格式
  { id: 'date-1', label: 'YYYY-MM-DD', format: 'YYYY-MM-DD', type: 'date' },
  { id: 'date-2', label: 'YYYY/MM/DD', format: 'YYYY/MM/DD', type: 'date' },
  { id: 'date-3', label: 'YYYY年MM月DD日', format: 'YYYY年MM月DD日', type: 'date' },
  { id: 'date-4', label: 'MM-DD-YYYY', format: 'MM-DD-YYYY', type: 'date' },
  { id: 'date-5', label: 'DD/MM/YYYY', format: 'DD/MM/YYYY', type: 'date' },

  // 时间格式
  { id: 'time-1', label: 'HH:mm:ss', format: 'HH:mm:ss', type: 'time' },
  { id: 'time-2', label: 'HH:mm', format: 'HH:mm', type: 'time' },
  { id: 'time-3', label: 'hh:mm:ss A', format: 'hh:mm:ss A', type: 'time' },
  { id: 'time-4', label: 'hh:mm A', format: 'hh:mm A', type: 'time' },
  { id: 'time-5', label: 'HH时mm分ss秒', format: 'HH时mm分ss秒', type: 'time' },
  { id: 'time-6', label: 'HH时mm分', format: 'HH时mm分', type: 'time' },

  // 日期时间组合
  { id: 'datetime-1', label: 'YYYY-MM-DD HH:mm:ss', format: 'YYYY-MM-DD HH:mm:ss', type: 'datetime' },
  { id: 'datetime-2', label: 'YYYY-MM-DD HH:mm', format: 'YYYY-MM-DD HH:mm', type: 'datetime' },
  { id: 'datetime-3', label: 'YYYY年MM月DD日 HH:mm', format: 'YYYY年MM月DD日 HH:mm', type: 'datetime' },
]

export const timezones: TimezoneOption[] = [
  { id: 'local', label: '本地时间', offset: -(new Date().getTimezoneOffset() / 60) },
  { id: 'utc', label: 'UTC', offset: 0 },
  { id: 'utc+8', label: 'UTC+8 (北京/上海)', offset: 8 },
  { id: 'utc+9', label: 'UTC+9 (东京/首尔)', offset: 9 },
  { id: 'utc+5.5', label: 'UTC+5:30 (印度)', offset: 5.5 },
  { id: 'utc+1', label: 'UTC+1 (中欧)', offset: 1 },
  { id: 'utc+0', label: 'UTC+0 (伦敦)', offset: 0 },
  { id: 'utc-5', label: 'UTC-5 (纽约)', offset: -5 },
  { id: 'utc-8', label: 'UTC-8 (洛杉矶)', offset: -8 },
]

function padZero(num: number, length: number = 2): string {
  return String(num).padStart(length, '0')
}

export function getDateWithTimezone(date: Date, timezoneOffset: number): Date {
  // Get UTC time
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
  // Apply timezone offset
  return new Date(utc + (timezoneOffset * 3600000))
}

export function formatDate(date: Date, format: string, timezoneOffset?: number): string {
  // Apply timezone if specified
  const d = timezoneOffset !== undefined ? getDateWithTimezone(date, timezoneOffset) : date

  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = d.getHours()
  const minutes = d.getMinutes()
  const seconds = d.getSeconds()

  const hours12 = hours % 12 || 12
  const ampm = hours < 12 ? 'AM' : 'PM'

  const replacements: Record<string, string> = {
    'YYYY': String(year),
    'MM': padZero(month),
    'DD': padZero(day),
    'HH': padZero(hours),
    'hh': padZero(hours12),
    'mm': padZero(minutes),
    'ss': padZero(seconds),
    'A': ampm,
  }

  let result = format
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key, 'g'), value)
  }

  return result
}

export function getDateFormats(): FormatOption[] {
  return defaultFormats.filter(f => f.type === 'date')
}

export function getTimeFormats(): FormatOption[] {
  return defaultFormats.filter(f => f.type === 'time')
}

export function getDateTimeFormats(): FormatOption[] {
  return defaultFormats.filter(f => f.type === 'datetime')
}
