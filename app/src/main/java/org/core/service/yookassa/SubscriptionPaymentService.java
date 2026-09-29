package org.core.service.yookassa;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.domain.User;
import org.core.domain.payments.yookassa.PaymentStatus;
import org.core.domain.payments.yookassa.SubscriptionPayment;
import org.core.domain.telegram.TelegramOutbox;
import org.core.domain.telegram.TelegramOutboxStatus;
import org.core.dto.payment.yookassa.PaymentCreationDTO;
import org.core.dto.payment.yookassa.YooKassaNotification;
import org.core.dto.payment.yookassa.YooKassaPayment;
import org.core.dto.payment.yookassa.YooKassaProperies;
import org.core.enums.UserRole;
import org.core.event.ActionType;
import org.core.event.SubscriptionStatus;
import org.core.exception.exceptions.PaymentServiceUnavailableException;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.repository.UserRepository;
import org.core.repository.telegram.TelegramOutboxRepository;
import org.core.repository.yookassa.SubscriptionPaymentRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionPaymentService {

    private final UserContextBean userContextBean;
    private final UserRepository userRepository;
    private final SubscriptionPaymentRepository subscriptionPaymentRepository;
    private final TelegramOutboxRepository telegramOutboxRepository;
    private final PaymentClient paymentClient;
    private final YooKassaProperies yooKassaProperies;
    private final TransactionTemplate transactionTemplate;

    public PaymentCreationDTO handleSubscriptionRequest() {
        SubscriptionPayment payment = SubscriptionPayment.builder()
                .user(findUserBiUserId(userContextBean.getUserId()))
                .idempotencyKey(UUID.randomUUID().toString())
                .paymentStatus(PaymentStatus.PENDING)
                .build();
        subscriptionPaymentRepository.save(payment);

        try {
            PaymentCreationDTO dto = paymentClient.holdNewYooKassaRequest(payment);
            payment.setYookassaPaymentId(dto.getPaymentId());
            subscriptionPaymentRepository.save(payment);
            return dto;
        } catch (PaymentServiceUnavailableException | HttpClientErrorException e) {
            payment.setPaymentStatus(PaymentStatus.CANCELED);
            subscriptionPaymentRepository.save(payment);
            throw e;
        }
    }

    public void processYooKassaNotification(YooKassaNotification notification) {
        String paymentId = notification.getObject().getId();
        YooKassaPayment remotePayment = paymentClient.fetchPayment(paymentId);
        transactionTemplate.executeWithoutResult(tx -> applyRemotePayment(remotePayment));
    }

    private void applyRemotePayment(YooKassaPayment remotePayment) {
        SubscriptionPayment payment = subscriptionPaymentRepository.findByYookassaPaymentId(remotePayment.getId())
                .orElseGet(() -> restoreFromMetadata(remotePayment));

        if (payment == null) {
            log.warn("Уведомление по платежу {} без записи в БД и без metadata — пропускаем", remotePayment.getId());
            return;
        }
        if (payment.getPaymentStatus() == PaymentStatus.SUCCEEDED) {
            return;
        }

        if ("succeeded".equals(remotePayment.getStatus())) {
            if (isAmountValid(remotePayment)) {
                payment.setPaymentStatus(PaymentStatus.SUCCEEDED);
                subscriptionPaymentRepository.save(payment);
                activatePro(payment.getUser());
            } else {
                log.error("Сумма платежа {} ({}) не совпадает с ценой подписки ({}) — PRO не активирован",
                        remotePayment.getId(),
                        remotePayment.getAmount().getValue(),
                        yooKassaProperies.price());
                payment.setPaymentStatus(PaymentStatus.CANCELED);
                subscriptionPaymentRepository.save(payment);
            }
        } else if ("canceled".equals(remotePayment.getStatus())) {
            payment.setPaymentStatus(PaymentStatus.CANCELED);
            subscriptionPaymentRepository.save(payment);
        }
    }

    private SubscriptionPayment restoreFromMetadata(YooKassaPayment remotePayment) {
        if (remotePayment.getMetadata() == null) {
            return null;
        }
        String userIdValue = remotePayment.getMetadata().get("userId");
        if (userIdValue == null) {
            return null;
        }
        try {
            User user = findUserBiUserId(Long.parseLong(userIdValue));
            return subscriptionPaymentRepository.save(SubscriptionPayment.builder()
                    .user(user)
                    .idempotencyKey(remotePayment.getId())
                    .paymentStatus(PaymentStatus.PENDING)
                    .yookassaPaymentId(remotePayment.getId())
                    .build());
        } catch (NumberFormatException | UserNotFoundException e) {
            log.error("Не удалось восстановить запись платежа {} из metadata: {}",
                    remotePayment.getId(), e.getMessage());
            return null;
        }
    }

    private boolean isAmountValid(YooKassaPayment remotePayment) {
        if (remotePayment.getAmount() == null || remotePayment.getAmount().getValue() == null) {
            return false;
        }
        return new BigDecimal(remotePayment.getAmount().getValue())
                .compareTo(new BigDecimal(yooKassaProperies.price())) == 0;
    }

    private void activatePro(User user) {
        user.setRole(UserRole.PRO);
        LocalDateTime localDateTime = user.getProUntil() != null && user.getProUntil().isAfter(LocalDateTime.now())
                ? user.getProUntil()
                : LocalDateTime.now();
        user.setProUntil(localDateTime.plusMonths(yooKassaProperies.periodMonths()));
        userRepository.save(user);

        telegramOutboxRepository.save(TelegramOutbox.builder()
                .userName(user.getName())
                .subscriptionStatus(SubscriptionStatus.PRO)
                .actionType(ActionType.SUBSCRIPTION)
                .status(TelegramOutboxStatus.READY_TO_SEND)
                .build());
    }

    private User findUserBiUserId(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User was not found"));
    }

}
