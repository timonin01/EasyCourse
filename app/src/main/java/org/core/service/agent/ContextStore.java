package org.core.service.agent;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class ContextStore {
    
    private final Map<String, List<ChatMessage>> sessions = new ConcurrentHashMap<>();
    
    public List<ChatMessage> getHistory(String sessionId) {
        return sessions.computeIfAbsent(sessionId, id -> new ArrayList<>());
    }
    
    public void addMessage(String sessionId, ChatMessage message) {
        List<ChatMessage> history = getHistory(sessionId);
        history.add(message);
        log.debug("Added message to session {}: {} - {}", sessionId, message.getRole(), message.getContent());
    }
    
    public void clearSession(String sessionId) {
        sessions.remove(sessionId);
        log.debug("Cleared session: {}", sessionId);
    }
    
    public boolean hasSession(String sessionId) {
        return sessions.containsKey(sessionId) && !sessions.get(sessionId).isEmpty();
    }
    
}
