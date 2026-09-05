package org.bot.listener;

import com.pengrad.telegrambot.TelegramBot;
import com.pengrad.telegrambot.model.Message;
import com.pengrad.telegrambot.model.Update;
import com.pengrad.telegrambot.UpdatesListener;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.bot.commandhandlers.CommandHandler;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
public class TelegramUpdateListener {

    private final TelegramBot telegramBot;
    private final Map<String, CommandHandler> handlersByCommand;

    public TelegramUpdateListener(TelegramBot telegramBot, List<CommandHandler> commandHandlers) {
        this.telegramBot = telegramBot;
        this.handlersByCommand = commandHandlers.stream()
                .collect(Collectors.toMap(CommandHandler::getCommand, Function.identity()));
    }

    @PostConstruct
    public void init() {
        telegramBot.setUpdatesListener(updates -> {
            for (Update update : updates) {
                handleUpdate(update);
            }
            return UpdatesListener.CONFIRMED_UPDATES_ALL;
        }, e -> log.error("Ошибка при получении обновлений Telegram", e));
        log.info("Telegram updates listener запущен, commands={}", handlersByCommand.keySet());
    }

    private void handleUpdate(Update update) {
        Message message = update.message();
        if (message == null || message.text() == null) {
            return;
        }
        String text = message.text().trim();
        CommandHandler handler = handlersByCommand.get(text);
        if (handler == null) {
            return;
        }
        Long chatId = message.chat().id();
        log.info("Обработка команды {} от chat_id={}", text, chatId);
        telegramBot.execute(handler.handleCommand(chatId));
    }
}
