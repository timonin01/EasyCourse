package org.core.dto.payment.yookassa;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class YooKassaCreatePaymentRequest {

    private YooKassaAmount amount;

    private Boolean capture;

    @JsonProperty("payment_method_data")
    private YooKassaPaymentMethodData paymentMethodData;

    private YooKassaConfirmation confirmation;

    private String description;

    private Map<String, String> metadata;
}
