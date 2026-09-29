package org.core.util;

import lombok.RequiredArgsConstructor;
import org.core.domain.payments.yookassa.SubscriptionPayment;
import org.core.dto.payment.yookassa.YooKassaAmount;
import org.core.dto.payment.yookassa.YooKassaConfirmation;
import org.core.dto.payment.yookassa.YooKassaCreatePaymentRequest;
import org.core.dto.payment.yookassa.YooKassaProperies;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class YooKassaRequestBuilder {

    private final YooKassaProperies yooKassaProperies;

    public YooKassaCreatePaymentRequest buildCreatePaymentRequest(SubscriptionPayment subscriptionPayment){
        return YooKassaCreatePaymentRequest.builder()
                .amount(YooKassaAmount.builder()
                        .value(formatPrice(yooKassaProperies.price()))
                        .currency(yooKassaProperies.currency())
                        .build())
                .capture(true)
                .confirmation(YooKassaConfirmation.builder()
                        .type(yooKassaProperies.type())
                        .returnUrl(yooKassaProperies.returnUrl())
                        .build())
                .description("PRO-подписка EasyCourse на " + yooKassaProperies.periodMonths() + " мес.")
                .metadata(buildMetadata(subscriptionPayment))
                .build();
    }

    private Map<String, String> buildMetadata(SubscriptionPayment subscriptionPayment) {
        return Map.of(
                "userId", String.valueOf(subscriptionPayment.getUser().getId()),
                "periodMonths", String.valueOf(yooKassaProperies.periodMonths())
        );
    }

    private String formatPrice(String price) {
        return new BigDecimal(price).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
