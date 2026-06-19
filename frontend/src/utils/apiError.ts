import axios from 'axios';
import { API_TIMEOUT_MS } from '../config/api';

type ApiErrorLike = {
  response?: {
    status?: number;
    data?: unknown;
  };
  code?: string;
};

export function isTimeoutError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.code === 'ECONNABORTED';
}

export function isNetworkError(error: unknown): boolean {
  if (isTimeoutError(error)) {
    return false;
  }

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
  if (isTimeoutError(error)) {
    const timeoutSec = Math.round(API_TIMEOUT_MS / 1000);
    return `Превышено время ожидания ответа (${timeoutSec} с). Попробуйте ещё раз.`;
  }

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
