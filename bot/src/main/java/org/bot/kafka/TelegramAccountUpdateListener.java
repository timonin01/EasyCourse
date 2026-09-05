package org.bot.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.event.AccountUpdateEvent;
import org.bot.service.TelegramAlertSender;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TelegramAccountUpdateListener {

    private final TelegramAlertSender telegramAlertSender;

    @KafkaListener(topics = "${app.kafka.account-update-topic}")
    public void listenAccountUpdate(AccountUpdateEvent event) {
        try {
            log.info("Получен AccountUpdateEvent: user={}, action={}",
                    event.getUserName(), event.getActionType());
            telegramAlertSender.send(event);
        } catch (Exception e) {
            log.error("Не удалось обработать AccountUpdateEvent", e);
        }
    }
}
