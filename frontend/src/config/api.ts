function parseTimeoutMs(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Обычные API-запросы (CRUD, настройки). По умолчанию 60 с. */
export const API_TIMEOUT_MS = parseTimeoutMs(import.meta.env.VITE_API_TIMEOUT_MS, 60_000);

/** AI / batch / генерация — дольше ждём ответ. По умолчанию 10 мин. */
export const API_AI_TIMEOUT_MS = parseTimeoutMs(import.meta.env.VITE_API_AI_TIMEOUT_MS, 600_000);

export const aiRequestConfig = { timeout: API_AI_TIMEOUT_MS };
