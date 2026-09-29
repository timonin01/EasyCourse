package org.core.service.yookassa;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.payments.yookassa.PaymentStatus;
import org.core.domain.payments.yookassa.SubscriptionPayment;
import org.core.dto.payment.yookassa.PaymentCreationDTO;
import org.core.dto.payment.yookassa.YooKassaCreatePaymentRequest;
import org.core.dto.payment.yookassa.YooKassaPayment;
import org.core.dto.payment.yookassa.YooKassaProperies;
import org.core.exception.exceptions.PaymentServiceUnavailableException;
import org.core.util.YooKassaRequestBuilder;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentClient {

    private final RestClient restClient;
    private final YooKassaProperies yooKassaProperies;
    private final YooKassaRequestBuilder yooKassaRequestBuilder;

    @Retryable(retryFor = { HttpServerErrorException.class, ResourceAccessException.class },
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public PaymentCreationDTO holdNewYooKassaRequest(SubscriptionPayment subscriptionPayment){
        YooKassaCreatePaymentRequest yooKassaCreatePaymentRequest = yooKassaRequestBuilder
                .buildCreatePaymentRequest(subscriptionPayment);
        YooKassaPayment yooKassaPayment = restClient.post()
                .uri(yooKassaProperies.postUrl())
                .header("Idempotence-Key", String.valueOf(subscriptionPayment.getIdempotencyKey()))
                .contentType(MediaType.APPLICATION_JSON)
                .body(yooKassaCreatePaymentRequest)
                .retrieve()
                .body(YooKassaPayment.class);

        if (yooKassaPayment == null || yooKassaPayment.getId() == null || yooKassaPayment.getConfirmation() == null
                || yooKassaPayment.getConfirmation().getConfirmationUrl() == null) {
            throw new PaymentServiceUnavailableException("ЮKassa вернула некорректный ответ на создание платежа");
        }

        return PaymentCreationDTO.builder()
                .paymentId(yooKassaPayment.getId())
                .status(PaymentStatus.valueOf(yooKassaPayment.getStatus().toUpperCase()))
                .confirmationUrl(yooKassaPayment.getConfirmation().getConfirmationUrl())
                .build();
    }

    @Recover
    public PaymentCreationDTO fallback(RestClientException ex, SubscriptionPayment subscriptionPayment) {
        log.error("Не удалось создать платёж в ЮKassa после {} повторов: {}", 3, ex.getMessage());
        throw new PaymentServiceUnavailableException("Сервис платежей недоступен: " + ex.getMessage());
    }

    @Retryable(retryFor = { HttpServerErrorException.class, ResourceAccessException.class },
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public YooKassaPayment fetchPayment(String yooKassaPaymentId) {
        return restClient.get()
                .uri(yooKassaProperies.postUrl() + "/{id}", yooKassaPaymentId)
                .retrieve()
                .body(YooKassaPayment.class);
    }

    @Recover
    public YooKassaPayment fetchPaymentFallback(RestClientException ex, String yooKassaPaymentId) {
        log.error("Не удалось получить платёж {} из ЮKassa: {}", yooKassaPaymentId, ex.getMessage());
        throw new PaymentServiceUnavailableException("Сервис платежей недоступен: " + ex.getMessage());
    }

}
