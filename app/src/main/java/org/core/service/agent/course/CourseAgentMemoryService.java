package org.core.service.agent.course;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.core.domain.ai.AiMessageRole;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.course.CourseAgentResponse;
import org.core.dto.ai.AiMessageHistoryDTO;
import org.core.service.ai.AiSessionMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CourseAgentMemoryService {

    @Value("${course.agent.memory.message-limit}")
    private int memoryMessageLimit;

    private final AiSessionMessageService sessionMessageService;
    private final ObjectMapper objectMapper;

    public void saveUserMessage(Long userId, Long courseId, String sessionId, String content) {
        if (content == null || content.isBlank()) {
            return;
        }
        sessionMessageService.saveCourseAgentMessage(userId, sessionId, courseId, AiMessageRole.USER, content.trim(),null);
    }

    public void saveAssistantResponse(Long userId, Long courseId, String sessionId,
                                      CourseAgentResponse response) {
        if (response == null) {
            return;
        }
        String content = response.getMessage() == null || response.getMessage().isBlank()
                ? "Ответ агента курса"
                : response.getMessage();
        sessionMessageService.saveCourseAgentMessage(userId, sessionId, courseId, AiMessageRole.ASSISTANT, content, serialize(response));
    }

    public List<ChatMessage> getLlmHistory(Long userId, Long courseId, String sessionId) {
        List<AiMessageHistoryDTO> history = sessionMessageService.getCourseAgentSessionHistory(userId, courseId, sessionId);
        int from = Math.max(0, history.size() - Math.max(0, memoryMessageLimit));
        return history.subList(from, history.size()).stream()
                .filter(message -> "user".equals(message.getRole()) || "assistant".equals(message.getRole()))
                .map(message -> ChatMessage.builder()
                        .role(message.getRole())
                        .content(message.getContent())
                        .build())
                .toList();
    }

    public List<AiMessageHistoryDTO> getHistory(Long userId, Long courseId, String sessionId) {
        return sessionMessageService.getCourseAgentSessionHistory(userId, courseId, sessionId);
    }

    public Optional<String> getLatestSessionId(Long userId, Long courseId) {
        return sessionMessageService.getLatestCourseAgentSessionId(userId, courseId);
    }

    public void clearSession(Long userId, Long courseId, String sessionId) {
        getHistory(userId, courseId, sessionId);
        sessionMessageService.clearSession(userId, sessionId);
    }

    private String serialize(CourseAgentResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize course agent response", e);
        }
    }
}