package org.core.service.ai;

import org.core.exception.exceptions.ProvodAiException;

import java.io.InterruptedIOException;
import java.net.SocketTimeoutException;

/**
 * Maps Provod/OpenAI client failures to clear user-facing messages.
 */
public final class ProvodAiErrorMapper {

    private ProvodAiErrorMapper() {
    }

    public static ProvodAiException toUserFacingException(Throwable error) {
        if (isTimeout(error)) {
            return new ProvodAiException(
                    "Превышено время ожидания ответа модели. Аудит или генерация заняли слишком долго — попробуйте ещё раз.");
        }
        return new ProvodAiException(
                "Не удалось получить ответ от AI. Попробуйте ещё раз чуть позже.");
    }

    public static boolean isTimeout(Throwable error) {
        for (Throwable current = error; current != null; current = current.getCause()) {
            if (current instanceof InterruptedIOException
                    || current instanceof SocketTimeoutException) {
                return true;
            }
            String className = current.getClass().getSimpleName();
            String message = current.getMessage();
            if (className.contains("Timeout") || className.contains("InterruptedIO")) {
                return true;
            }
            if (message != null) {
                String lower = message.toLowerCase();
                if (lower.contains("timeout")
                        || lower.contains("timed out")
                        || lower.contains("stream was reset: cancel")) {
                    return true;
                }
            }
        }
        return false;
    }
}
