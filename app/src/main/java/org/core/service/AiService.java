package org.core.service;

import org.core.dto.agent.ChatMessage;

import java.util.List;

public interface AiService {

    default String generateResponse(String prompt){ return "No overriding"; };

    default String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt){
        return "No overriding";
    };

}
