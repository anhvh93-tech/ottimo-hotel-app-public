/** Business "today" as YYYY-MM-DD in the property time zone (BR-001, BR-010 – server is the source of truth). */
export function todayLocal(timeZone = 'Asia/Ho_Chi_Minh', now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return parts; // en-CA formats as YYYY-MM-DD
}

export function timeHHmm(d: Date, timeZone = 'Asia/Ho_Chi_Minh'): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function weekdayDate(
  locale: 'vi' | 'en',
  timeZone = 'Asia/Ho_Chi_Minh',
  now = new Date(),
): string {
  const tag = locale === 'vi' ? 'vi-VN' : 'en-GB';
  const weekday = new Intl.DateTimeFormat(tag, { timeZone, weekday: 'long' }).format(now);
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date}`;
}
