package org.bot.commandhandlers;

import com.pengrad.telegrambot.request.SendMessage;

public interface CommandHandler {

    SendMessage handleCommand(Long chatId);

    String getCommand();

    String getDescription();
}
