package org.core.service.agent.llmProvider;

import org.core.dto.agent.ChatMessage;
import java.util.List;

public interface LlmProvider {
    String chat(List<ChatMessage> messages);

    String chat(List<ChatMessage> messages, String modelUri);
}
