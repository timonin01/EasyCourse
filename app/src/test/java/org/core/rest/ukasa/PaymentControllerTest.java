package org.core.rest.ukasa;

import org.core.dto.payment.yookassa.YooKassaNotification;
import org.core.dto.payment.yookassa.YooKassaPayment;
import org.core.exception.exceptions.PaymentServiceUnavailableException;
import org.core.service.yookassa.SubscriptionPaymentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock
    private SubscriptionPaymentService subscriptionPaymentService;

    @Test
    void webhookReturnsOkWhenNotificationProcessed() {
        PaymentController controller = new PaymentController(subscriptionPaymentService);
        ResponseEntity<Void> response = controller.handleWebhook(notification());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void webhookReturns500WhenProcessingFailsSoYooKassaRetries() {
        PaymentController controller = new PaymentController(subscriptionPaymentService);
        doThrow(new PaymentServiceUnavailableException("Сервис платежей недоступен"))
                .when(subscriptionPaymentService).processYooKassaNotification(any());

        ResponseEntity<Void> response = controller.handleWebhook(notification());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private YooKassaNotification notification() {
        return YooKassaNotification.builder()
                .type("notification")
                .event("payment.succeeded")
                .object(YooKassaPayment.builder().id("yoo-payment-1").build())
                .build();
    }
}
