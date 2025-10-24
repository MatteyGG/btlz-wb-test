/**
 * Возвращает дату в формате `ГГГГ-ММ-ДД`.
 *
 * @param {Date} [date=new Date()] Экземпляр Date (по умолчанию — текущая дата).
 * @returns {string} Строка в формате `YYYY-MM-DD`.
 *
 * @example
 * formatDate();              // "2025-10-24"
 * formatDate(new Date(2024, 8, 30)); // "2024-09-30"
 */
export function formatDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
