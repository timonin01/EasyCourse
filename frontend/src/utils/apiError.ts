export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    return fallback;
  }

  const responseData = (error as { response?: { data?: unknown } }).response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  if (responseData && typeof responseData === 'object') {
    const data = responseData as { message?: string; error?: string };
    return data.message || data.error || fallback;
  }

  return fallback;
}
