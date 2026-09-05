package org.core.service;

import lombok.RequiredArgsConstructor;
import org.core.domain.telegram.TelegramOutbox;
import org.core.domain.telegram.TelegramOutboxStatus;
import org.core.repository.telegram.TelegramOutboxRepository;
import org.core.service.telegram.TelegramAccountNotificationClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class TelegramAccountUpdateScheduler {

    private final TelegramOutboxRepository telegramOutboxRepository;
    private final TelegramAccountNotificationClient telegramAccountNotificationClient;

    @Scheduled(fixedDelayString = "${app.scheduler.minutes-fixdelay}", timeUnit = TimeUnit.MINUTES)
    public void sendAccountUpdateToTelegramBot(){
        List<TelegramOutbox> telegramOutboxList = telegramOutboxRepository.findAllByStatusOrderByCreatedAtAsc(TelegramOutboxStatus.READY_TO_SEND);
        for(TelegramOutbox telegramOutbox : telegramOutboxList){
            telegramAccountNotificationClient.sendAccountUpdateEvent(telegramOutbox);

            telegramOutbox.setStatus(TelegramOutboxStatus.ALREADY_SENT);
            telegramOutboxRepository.save(telegramOutbox);
        }
    }

}
