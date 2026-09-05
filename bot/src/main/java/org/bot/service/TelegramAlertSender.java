package org.bot.service;

import com.pengrad.telegrambot.TelegramBot;
import com.pengrad.telegrambot.request.SendMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.event.AccountUpdateEvent;
import org.core.event.ActionType;
import org.core.event.SubscriptionStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramAlertSender {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");

    private final TelegramBot telegramBot;

    @Value("${app.telegram.admin-chat-id}")
    private long adminChatId;

    public void send(AccountUpdateEvent event) {
        try {
            telegramBot.execute(new SendMessage(adminChatId, formatEvent(event)));
            log.info("Уведомление отправлен в Telegram: user={}, action={}", event.getUserName(), event.getActionType());
        } catch (RuntimeException e) {
            log.error("Не удалось отправить алерт в Telegram: user={}, action={}",
                    event.getUserName(), event.getActionType(), e);
        }
    }

    private String formatEvent(AccountUpdateEvent event) {
        String title = event.getActionType() == ActionType.REGISTRATION
                ? "🟢 Новая регистрация"
                : "💰 Оформлена подписка";
        String status = event.getSubscriptionStatus() == SubscriptionStatus.PRO
                ? "⭐ PRO"
                : "📦 Default";

        return title + "\n\n"
                + "👤 Пользователь: " + event.getUserName() + "\n"
                + "💳 Тариф: " + status + "\n"
                + "🕐 Время: " + LocalDateTime.now().format(TIME_FORMAT);
    }
}
