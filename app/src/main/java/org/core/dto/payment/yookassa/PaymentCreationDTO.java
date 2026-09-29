package org.core.dto.payment.yookassa;

import lombok.*;
import org.core.domain.payments.yookassa.PaymentStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCreationDTO {

    private String paymentId;
    private PaymentStatus status;
    private String confirmationUrl;

}
