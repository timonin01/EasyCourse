package org.core.service.telegram;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.telegram.TelegramOutbox;
import org.core.event.AccountUpdateEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutionException;

@Slf4j
@Component
@RequiredArgsConstructor
public class TelegramAccountNotificationClient {

    @Value("${app.kafka.account-update-topic}")
    private String topicName;

    private final KafkaTemplate<String, AccountUpdateEvent> kafkaTemplate;

    public void sendAccountUpdateEvent(TelegramOutbox telegramOutbox){
        AccountUpdateEvent accountUpdateEvent = AccountUpdateEvent.newBuilder()
                .setUserName(telegramOutbox.getUserName())
                .setActionType(telegramOutbox.getActionType())
                .setSubscriptionStatus(telegramOutbox.getSubscriptionStatus())
                .build();

        log.info("Создание сообщение AccountUpdateEvent: {}", accountUpdateEvent);
        try {
            kafkaTemplate.send(topicName, accountUpdateEvent).get();
            log.info("Сообщение {} отправлено в topic: {}", accountUpdateEvent, topicName);
        } catch (InterruptedException e) {
            log.error("Ошибка InterruptedException", e);
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting Kafka ack", e);
        } catch (ExecutionException e) {
            log.error("Ошибка при отправке сообщения в Kafka", e);
            throw new IllegalStateException("Failed to deliver message to Kafka", e.getCause());
        }
    }

}
