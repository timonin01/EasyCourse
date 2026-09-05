package org.bot.commandhandlers;

import com.pengrad.telegrambot.request.SendMessage;
import org.springframework.stereotype.Component;

@Component
public class StartCommandHandler implements CommandHandler {

    @Override
    public SendMessage handleCommand(Long chatId) {
        String text = """
                ✅ Бот активен!
                Этот бот присылает алерты о новых регистрациях и оформленных подписках.
                🆔 Ваш chat_id: <b>%d</b>
                Добавьте его в переменную окружения TELEGRAM_ADMIN_CHAT_ID, чтобы получать алерты сюда.
                """.formatted(chatId);

        return new SendMessage(chatId, text).parseMode(com.pengrad.telegrambot.model.request.ParseMode.HTML);
    }

    @Override
    public String getCommand() {
        return "/start";
    }

    @Override
    public String getDescription() {
        return "Активировать бота и узнать свой chat_id";
    }
}
