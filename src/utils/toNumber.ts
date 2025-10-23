
/**
 * Преобразует значение в число, очищая строки от пробелов, неразрывных пробелов и запятых.
 * @param value Любое значение, которое требуется привести к числу.
 * @returns Число, если преобразование прошло успешно, иначе `null`.
 */
export default function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/\u00A0/g, "").replace(/\s+/g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
