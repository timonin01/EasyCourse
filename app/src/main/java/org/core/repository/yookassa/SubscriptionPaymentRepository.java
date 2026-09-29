package org.core.repository.yookassa;

import org.core.domain.payments.yookassa.SubscriptionPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionPaymentRepository extends JpaRepository<SubscriptionPayment, Long> {

    Optional<SubscriptionPayment> findByYookassaPaymentId(String yookassaPaymentId);
}
