package org.core.service.yookassa;

import org.core.context.UserContextBean;
import org.core.domain.User;
import org.core.domain.payments.yookassa.PaymentStatus;
import org.core.domain.payments.yookassa.SubscriptionPayment;
import org.core.domain.telegram.TelegramOutbox;
import org.core.dto.payment.yookassa.PaymentCreationDTO;
import org.core.dto.payment.yookassa.YooKassaAmount;
import org.core.dto.payment.yookassa.YooKassaNotification;
import org.core.dto.payment.yookassa.YooKassaPayment;
import org.core.dto.payment.yookassa.YooKassaProperies;
import org.core.enums.UserRole;
import org.core.exception.exceptions.PaymentServiceUnavailableException;
import org.core.repository.UserRepository;
import org.core.repository.telegram.TelegramOutboxRepository;
import org.core.repository.yookassa.SubscriptionPaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallbackWithoutResult;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionPaymentServiceTest {

    private static final String YOOKASSA_PAYMENT_ID = "yoo-payment-1";
    private static final String PRICE = "399.00";

    @Mock private UserRepository userRepository;
    @Mock private SubscriptionPaymentRepository subscriptionPaymentRepository;
    @Mock private TelegramOutboxRepository telegramOutboxRepository;
    @Mock private PaymentClient paymentClient;
    @Mock private TransactionTemplate transactionTemplate;

    private UserContextBean userContextBean;
    private SubscriptionPaymentService service;

    private User user;
    private SubscriptionPayment localPayment;

    @BeforeEach
    void setUp() {
        userContextBean = new UserContextBean();
        userContextBean.setUserId(1L);
        YooKassaProperies properties = new YooKassaProperies(PRICE, "RUB", "redirect",
                "http://return", "http://api", 1);
        service = new SubscriptionPaymentService(userContextBean, userRepository,
                subscriptionPaymentRepository, telegramOutboxRepository, paymentClient,
                properties, transactionTemplate);

        user = User.builder()
                .name("test")
                .email("test@test.ru")
                .password("password")
                .build();
        user.setId(1L);

        localPayment = SubscriptionPayment.builder()
                .user(user)
                .idempotencyKey("idempotency-key")
                .paymentStatus(PaymentStatus.PENDING)
                .yookassaPaymentId(YOOKASSA_PAYMENT_ID)
                .build();
    }

    private void stubTransactionPassThrough() {
        doAnswer(invocation -> {
            Consumer<TransactionStatus> callback = invocation.getArgument(0);
            callback.accept(mock(TransactionStatus.class));
            return null;
        }).when(transactionTemplate).executeWithoutResult(any());
    }

    private YooKassaPayment remotePayment(String status, String amountValue) {
        return YooKassaPayment.builder()
                .id(YOOKASSA_PAYMENT_ID)
                .status(status)
                .amount(YooKassaAmount.builder().value(amountValue).currency("RUB").build())
                .metadata(Map.of("userId", "1"))
                .build();
    }

    private YooKassaNotification notificationFor(YooKassaPayment remote) {
        return YooKassaNotification.builder()
                .type("notification")
                .event("payment." + remote.getStatus())
                .object(remote)
                .build();
    }

    @Test
    void webhookSucceededWithValidAmountActivatesPro() {
        stubTransactionPassThrough();
        when(paymentClient.fetchPayment(YOOKASSA_PAYMENT_ID)).thenReturn(remotePayment("succeeded", PRICE));
        when(subscriptionPaymentRepository.findByYookassaPaymentId(YOOKASSA_PAYMENT_ID))
                .thenReturn(Optional.of(localPayment));

        service.processYooKassaNotification(notificationFor(remotePayment("succeeded", PRICE)));

        ArgumentCaptor<SubscriptionPayment> paymentCaptor = ArgumentCaptor.forClass(SubscriptionPayment.class);
        verify(subscriptionPaymentRepository).save(paymentCaptor.capture());
        assertThat(paymentCaptor.getValue().getPaymentStatus()).isEqualTo(PaymentStatus.SUCCEEDED);

        assertThat(user.getRole()).isEqualTo(UserRole.PRO);
        LocalDateTime now = LocalDateTime.now();
        assertThat(user.getProUntil())
                .isAfter(now.plusDays(27))
                .isBefore(now.plusDays(32));

        verify(telegramOutboxRepository).save(any(TelegramOutbox.class));
    }

    @Test
    void webhookSucceededWithWrongAmountCancelsPaymentWithoutPro() {
        stubTransactionPassThrough();
        when(paymentClient.fetchPayment(YOOKASSA_PAYMENT_ID)).thenReturn(remotePayment("succeeded", "999.00"));
        when(subscriptionPaymentRepository.findByYookassaPaymentId(YOOKASSA_PAYMENT_ID))
                .thenReturn(Optional.of(localPayment));

        service.processYooKassaNotification(notificationFor(remotePayment("succeeded", "999.00")));

        ArgumentCaptor<SubscriptionPayment> paymentCaptor = ArgumentCaptor.forClass(SubscriptionPayment.class);
        verify(subscriptionPaymentRepository).save(paymentCaptor.capture());
        assertThat(paymentCaptor.getValue().getPaymentStatus()).isEqualTo(PaymentStatus.CANCELED);

        assertThat(user.getRole()).isEqualTo(UserRole.DEFAULT);
        assertThat(user.getProUntil()).isNull();
        verify(userRepository, never()).save(any());
        verify(telegramOutboxRepository, never()).save(any());
    }

    @Test
    void webhookCanceledMarksPaymentCanceledWithoutPro() {
        stubTransactionPassThrough();
        when(paymentClient.fetchPayment(YOOKASSA_PAYMENT_ID)).thenReturn(remotePayment("canceled", PRICE));
        when(subscriptionPaymentRepository.findByYookassaPaymentId(YOOKASSA_PAYMENT_ID))
                .thenReturn(Optional.of(localPayment));

        service.processYooKassaNotification(notificationFor(remotePayment("canceled", PRICE)));

        ArgumentCaptor<SubscriptionPayment> paymentCaptor = ArgumentCaptor.forClass(SubscriptionPayment.class);
        verify(subscriptionPaymentRepository).save(paymentCaptor.capture());
        assertThat(paymentCaptor.getValue().getPaymentStatus()).isEqualTo(PaymentStatus.CANCELED);

        assertThat(user.getRole()).isEqualTo(UserRole.DEFAULT);
        verify(telegramOutboxRepository, never()).save(any());
    }

    @Test
    void webhookForAlreadySucceededPaymentIsIgnored() {
        stubTransactionPassThrough();
        when(paymentClient.fetchPayment(YOOKASSA_PAYMENT_ID)).thenReturn(remotePayment("succeeded", PRICE));
        localPayment.setPaymentStatus(PaymentStatus.SUCCEEDED);
        when(subscriptionPaymentRepository.findByYookassaPaymentId(YOOKASSA_PAYMENT_ID))
                .thenReturn(Optional.of(localPayment));

        service.processYooKassaNotification(notificationFor(remotePayment("succeeded", PRICE)));

        verify(subscriptionPaymentRepository, never()).save(any());
        verify(userRepository, never()).save(any());
        verify(telegramOutboxRepository, never()).save(any());
    }

    @Test
    void webhookForUnknownPaymentWithoutMetadataIsSkipped() {
        stubTransactionPassThrough();
        YooKassaPayment remote = remotePayment("succeeded", PRICE);
        remote.setMetadata(null);
        when(paymentClient.fetchPayment(YOOKASSA_PAYMENT_ID)).thenReturn(remote);
        when(subscriptionPaymentRepository.findByYookassaPaymentId(YOOKASSA_PAYMENT_ID))
                .thenReturn(Optional.empty());

        service.processYooKassaNotification(notificationFor(remote));

        verify(subscriptionPaymentRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void webhookRestoresMissingPaymentFromMetadataAndActivatesPro() {
        stubTransactionPassThrough();
        when(paymentClient.fetchPayment(YOOKASSA_PAYMENT_ID)).thenReturn(remotePayment("succeeded", PRICE));
        when(subscriptionPaymentRepository.findByYookassaPaymentId(YOOKASSA_PAYMENT_ID))
                .thenReturn(Optional.empty());
        when(subscriptionPaymentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        service.processYooKassaNotification(notificationFor(remotePayment("succeeded", PRICE)));

        ArgumentCaptor<SubscriptionPayment> paymentCaptor = ArgumentCaptor.forClass(SubscriptionPayment.class);
        verify(subscriptionPaymentRepository, times(2)).save(paymentCaptor.capture());
        // обе записи — один и тот же мутируемый инстанс: сначала восстановлен (PENDING), затем помечен SUCCEEDED
        SubscriptionPayment restored = paymentCaptor.getAllValues().get(0);
        assertThat(restored).isSameAs(paymentCaptor.getAllValues().get(1));
        assertThat(restored.getYookassaPaymentId()).isEqualTo(YOOKASSA_PAYMENT_ID);
        assertThat(restored.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
        assertThat(user.getRole()).isEqualTo(UserRole.PRO);
    }

    @Test
    void webhookPendingStatusDoesNotChangeAnything() {
        stubTransactionPassThrough();
        when(paymentClient.fetchPayment(YOOKASSA_PAYMENT_ID)).thenReturn(remotePayment("pending", PRICE));
        when(subscriptionPaymentRepository.findByYookassaPaymentId(YOOKASSA_PAYMENT_ID))
                .thenReturn(Optional.of(localPayment));

        service.processYooKassaNotification(notificationFor(remotePayment("pending", PRICE)));

        verify(subscriptionPaymentRepository, never()).save(any());
        verify(userRepository, never()).save(any());
        assertThat(localPayment.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void repeatedProPaymentExtendsFromExistingExpiryDate() {
        stubTransactionPassThrough();
        user.setRole(UserRole.PRO);
        user.setProUntil(LocalDateTime.now().plusDays(10));
        when(paymentClient.fetchPayment(YOOKASSA_PAYMENT_ID)).thenReturn(remotePayment("succeeded", PRICE));
        when(subscriptionPaymentRepository.findByYookassaPaymentId(YOOKASSA_PAYMENT_ID))
                .thenReturn(Optional.of(localPayment));

        service.processYooKassaNotification(notificationFor(remotePayment("succeeded", PRICE)));

        LocalDateTime now = LocalDateTime.now();
        assertThat(user.getProUntil())
                .isAfter(now.plusDays(37))
                .isBefore(now.plusDays(43));
    }

    @Test
    void subscriptionRequestCreatesPendingPaymentAndSavesYookassaId() {
        PaymentCreationDTO dto = PaymentCreationDTO.builder()
                .paymentId(YOOKASSA_PAYMENT_ID)
                .status(PaymentStatus.PENDING)
                .confirmationUrl("http://confirmation")
                .build();
        when(paymentClient.holdNewYooKassaRequest(any())).thenReturn(dto);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        PaymentCreationDTO result = service.handleSubscriptionRequest();

        assertThat(result).isSameAs(dto);

        ArgumentCaptor<SubscriptionPayment> paymentCaptor = ArgumentCaptor.forClass(SubscriptionPayment.class);
        verify(subscriptionPaymentRepository, times(2)).save(paymentCaptor.capture());
        SubscriptionPayment firstSave = paymentCaptor.getAllValues().get(0);
        assertThat(firstSave.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(firstSave.getIdempotencyKey()).isNotBlank();

        SubscriptionPayment secondSave = paymentCaptor.getAllValues().get(1);
        assertThat(secondSave.getYookassaPaymentId()).isEqualTo(YOOKASSA_PAYMENT_ID);
    }

    @Test
    void subscriptionRequestCancelsPaymentWhenYooKassaFails() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(paymentClient.holdNewYooKassaRequest(any()))
                .thenThrow(new PaymentServiceUnavailableException("Сервис платежей недоступен"));

        assertThatThrownBy(() -> service.handleSubscriptionRequest())
                .isInstanceOf(PaymentServiceUnavailableException.class);

        ArgumentCaptor<SubscriptionPayment> paymentCaptor = ArgumentCaptor.forClass(SubscriptionPayment.class);
        verify(subscriptionPaymentRepository, times(2)).save(paymentCaptor.capture());
        assertThat(paymentCaptor.getAllValues().get(1).getPaymentStatus()).isEqualTo(PaymentStatus.CANCELED);
    }

    @Test
    void subscriptionRequestCancelsPaymentOnYooKassaClientError() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(paymentClient.holdNewYooKassaRequest(any()))
                .thenThrow(HttpClientErrorException.create(
                        org.springframework.http.HttpStatus.UNAUTHORIZED, "Unauthorized",
                        null, null, null));

        assertThatThrownBy(() -> service.handleSubscriptionRequest())
                .isInstanceOf(HttpClientErrorException.class);

        ArgumentCaptor<SubscriptionPayment> paymentCaptor = ArgumentCaptor.forClass(SubscriptionPayment.class);
        verify(subscriptionPaymentRepository, times(2)).save(paymentCaptor.capture());
        assertThat(paymentCaptor.getAllValues().get(1).getPaymentStatus()).isEqualTo(PaymentStatus.CANCELED);
        verify(telegramOutboxRepository, never()).save(any());
    }
}
