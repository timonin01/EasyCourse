package org.bot;

import com.pengrad.telegrambot.TelegramBot;
import com.pengrad.telegrambot.model.BotCommand;
import com.pengrad.telegrambot.request.SetMyCommands;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bot.commandhandlers.CommandHandler;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class SetTelegramCommands {

    private final TelegramBot telegramBot;

    private final HashMap<String, CommandHandler> commandMap;

    @PostConstruct
    public void setMyCommands() {
        BotCommand[] botCommandsArray = new BotCommand[commandMap.size()];
        int i = 0;
        for (Map.Entry<String, CommandHandler> entry : commandMap.entrySet()) {
            String commandName = entry.getValue().getCommand();
            String commandNameWithoutFirstSymbol = commandName.substring(1);
            String description = entry.getValue().getDescription();
            botCommandsArray[i++] = new BotCommand(commandNameWithoutFirstSymbol, description);
        }
        SetMyCommands setMyCommands = new SetMyCommands(botCommandsArray);
        try {
            telegramBot.execute(setMyCommands);
            log.info("setMyCommands успешно отработан, commands_count={}", commandMap.size());
        } catch (RuntimeException e) {
            log.error("Ошибка при вызове setMyCommands, commands_count={}", commandMap.size(), e);
        }
    }
}

