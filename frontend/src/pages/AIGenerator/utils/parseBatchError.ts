export function parseBatchGenerationError(error: unknown): string {
  const err = error as {
    response?: { data?: string | { message?: string; details?: string; error?: string } };
    message?: string;
  };

  let errorMessage = 'Ошибка при генерации batch шагов';
  let errorDetails = '';

  if (err.response?.data) {
    const responseData = err.response.data;

    if (typeof responseData === 'string') {
      errorMessage = responseData;
    } else if (responseData.message) {
      errorMessage = responseData.message;
      errorDetails = responseData.details || '';
    } else if (responseData.error) {
      errorMessage = responseData.error || 'Ошибка при генерации batch шагов';
      errorDetails = responseData.message || '';
    } else {
      errorMessage = 'Ошибка при генерации batch шагов';
      errorDetails = JSON.stringify(responseData, null, 2);
    }
  } else if (err.message) {
    errorMessage = err.message;
    if (err.message.includes('\n\n')) {
      const parts = err.message.split('\n\n');
      errorMessage = parts[0];
      errorDetails = parts.slice(1).join('\n\n');
    }
  }

  let fullErrorMessage = errorMessage;
  if (errorDetails) {
    fullErrorMessage += '\n\nДетали:\n' + errorDetails;
  }

  const isFallback = errorMessage.includes('falling back') || errorMessage.includes('Falling back');
  if (isFallback) {
    fullErrorMessage += '\n\n⚠️ Система автоматически переключилась на генерацию шагов по одному.';
  }

  return fullErrorMessage;
}
