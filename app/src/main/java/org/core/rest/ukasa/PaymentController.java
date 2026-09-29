package org.core.rest.ukasa;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.payment.yookassa.PaymentCreationDTO;
import org.core.dto.payment.yookassa.YooKassaNotification;
import org.core.service.yookassa.SubscriptionPaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final SubscriptionPaymentService subscriptionPaymentService;

    @PostMapping
    public PaymentCreationDTO handleRequestForProSubscription() {
        return subscriptionPaymentService.handleSubscriptionRequest();
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestBody YooKassaNotification yooKassaNotification) {
        try {
            subscriptionPaymentService.processYooKassaNotification(yooKassaNotification);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Ошибка обработки уведомления ЮKassa: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
