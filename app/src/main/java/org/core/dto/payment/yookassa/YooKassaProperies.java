package org.core.dto.payment.yookassa;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.yookassa.subscription")
public record YooKassaProperies(
        String price,
        String currency,
        String type,
        String returnUrl,
        String postUrl,
        @DefaultValue("1") int periodMonths
) {
}
