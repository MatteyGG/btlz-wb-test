/**
 * Отправляет простое текстовое уведомление в Telegram без форматирования.
 * Используется для отправки системных или отладочных сообщений вроде:
 * ```
 * Заголовок: Ошибка API
 * Код ошибки: 400
 * Описание: Неверный формат тела запроса
 * ```
 * Требует наличия двух переменных окружения:
 * - `TELEGRAM_BOT_TOKEN`
 * - `TELEGRAM_CHAT_ID` 
 *
 * Без указания этих переменных функция просто завершится без ошибок.
 * @param {string} title - Заголовок уведомления (например, "Ошибка API").
 * @param {string | number} [errorCode] - Код ошибки или статус, необязателен.
 * @param {string} [description] - Текст описания или пояснение.
 * @returns {Promise<void>} Возвращает промис без значения. В случае ошибки логирует статус и ответ Telegram.
 *
 * @example
 * await telegram_notify("Ошибка оплаты", 502, "Stripe вернул 5xx при создании PaymentIntent");
 */
export async function telegram_notify(
  title: string,
  errorCode?: string | number,
  description?: string
): Promise<void>{
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const lines = [
    `${String(title ?? "")}`,
    errorCode !== undefined ? `Код ошибки: ${String(errorCode)}` : undefined,
    description !== undefined ? `Описание: ${String(description)}` : undefined,
  ].filter(Boolean);

  const text = lines.join("\n");

  for (const chunk of chunkForTelegram(text)) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk }),
    });

    const body = await res.text();
    if (!res.ok) {
      console.error("Telegram error:", res.status, body);
    }
  }
}

/**
 * Разбивает сообщение на куски, если оно длиннее 4096 символов.
 * Telegram ограничивает размер одного сообщения этим лимитом.
 *
 * @param {string} s - Исходное сообщение
 * @param {number} [limit=4096] - Максимальная длина сообщения
 * @returns {string[]} Массив частей текста
 */
function chunkForTelegram(s: string, limit: number = 4096): string[] {
  if (s.length <= limit) return [s];
  const out = [];
  let start = 0;
  while (start < s.length) {
    let end = Math.min(start + limit, s.length);
    const lastNL = s.lastIndexOf("\n", end);
    if (lastNL > start && lastNL >= end - 200) end = lastNL + 1;
    out.push(s.slice(start, end));
    start = end;
  }
  return out;
}
