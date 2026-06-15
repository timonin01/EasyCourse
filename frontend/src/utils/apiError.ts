type ApiErrorLike = {
  response?: {
    status?: number;
    data?: unknown;
  };
};

export function isNetworkError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'response' in error &&
      !(error as ApiErrorLike).response
  );
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    return undefined;
  }

  return (error as ApiErrorLike).response?.status;
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (isNetworkError(error)) {
    return 'Сервер недоступен. Проверьте, что backend запущен на порту 8080.';
  }

  if (!error || typeof error !== 'object' || !('response' in error)) {
    return fallback;
  }

  const responseData = (error as ApiErrorLike).response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  if (responseData && typeof responseData === 'object') {
    const data = responseData as { message?: string; error?: string };
    return data.message || data.error || fallback;
  }

  return fallback;
}
