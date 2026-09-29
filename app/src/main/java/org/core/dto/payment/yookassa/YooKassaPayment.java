package org.core.dto.payment.yookassa;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class YooKassaPayment {

    private String id;

    private String status;

    private Boolean paid;

    private YooKassaAmount amount;

    private YooKassaConfirmation confirmation;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    private String description;

    private Map<String, String> metadata;

    @JsonProperty("payment_method")
    private YooKassaPaymentMethod paymentMethod;

    private YooKassaRecipient recipient;

    private Boolean refundable;

    private Boolean test;

}
