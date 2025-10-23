export async function notify_Error(title: string, details: Record<string, any> = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // без конфигов - не отправляем

  const text =
    `❌ *${escape(title)}*\n` +
    Object.entries(details)
      .map(([k,v]) => `• *${escape(k)}*: ${escape(String(v))}`)
      .join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "MarkdownV2" }),
  });
}

function escape(s: string) { return s.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&"); }
