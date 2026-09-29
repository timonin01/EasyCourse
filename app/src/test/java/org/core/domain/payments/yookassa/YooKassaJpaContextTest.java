package org.core.domain.payments.yookassa;

import org.core.domain.User;
import org.core.repository.yookassa.SubscriptionPaymentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("mysql-local")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class YooKassaJpaContextTest {

    @Autowired
    private SubscriptionPaymentRepository subscriptionPaymentRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void jpaContextBootsWithSubscriptionEntities() {
        assertThat(subscriptionPaymentRepository).isNotNull();
        assertThat(subscriptionPaymentRepository.findByYookassaPaymentId("no-such-id")).isEmpty();
    }

    @Test
    void userSubscriptionPaymentsCollectionLoads() {
        User user = User.builder()
                .name("test")
                .email("yookassa-jpa-test@" + UUID.randomUUID() + ".ru")
                .password("password")
                .build();
        entityManager.persist(user);
        SubscriptionPayment subscriptionPayment = SubscriptionPayment.builder()
                .user(user)
                .idempotencyKey(UUID.randomUUID().toString())
                .paymentStatus(PaymentStatus.PENDING)
                .build();
        entityManager.persist(subscriptionPayment);
        entityManager.flush();
        entityManager.clear();

        User reloaded = entityManager.find(User.class, user.getId());
        assertThat(reloaded.getSubscriptionPayments()).hasSize(1);
    }
}
