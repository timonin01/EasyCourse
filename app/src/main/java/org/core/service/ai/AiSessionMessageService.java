package org.core.service.ai;

import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import org.core.domain.User;
import org.core.domain.ai.AiMessage;
import org.core.domain.ai.AiMessageRole;
import org.core.domain.ai.AiSession;
import org.core.domain.ai.ChatType;
import org.core.dto.ai.AiMessageHistoryDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.repository.UserRepository;
import org.core.repository.ai.AiMessageRepository;
import org.core.repository.ai.AiSessionRepository;
import org.core.service.ai.util.AiMessageHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class AiSessionMessageService {

    @Value("${message.history.limit:50}")
    private int messageLimit;

    private final UserRepository userRepository;
    private final AiSessionRepository aiSessionRepository;
    private final AiMessageRepository aiMessageRepository;
    private final AiMessageHelper aiMessageHelper;

    public void saveMessageToChatHistory(Long userId,
                                         String sessionId,
                                         AiMessageRole messageRole,
                                         ChatType chatType,
                                         String content,
                                         @Nullable String stepType,
                                         @Nullable StepikBlockRequest payload) {
        AiSession aiSession = resolveSession(userId, sessionId, chatType, messageRole, content, stepType);

        int nextOrder = aiMessageRepository.countByAiSession_Id(aiSession.getId()) + 1;

        AiMessage aiMessage = AiMessage.builder()
                .aiSession(aiSession)
                .messageRole(messageRole)
                .content(content)
                .stepType(stepType)
                .payloadJson(aiMessageHelper.serializePayload(payload))
                .sortOrder(nextOrder)
                .build();

        aiMessageRepository.save(aiMessage);

        aiSession.setUpdatedAt(LocalDateTime.now());
        aiSessionRepository.save(aiSession);
    }

    @Transactional(readOnly = true)
    public List<AiMessageHistoryDTO> getSessionHistory(Long userId, String sessionId) {
        Optional<AiSession> sessionOptional = aiSessionRepository.findBySessionId(sessionId);
        if (sessionOptional.isEmpty()) {
            return List.of();
        }
        AiSession aiSession = sessionOptional.get();
        if (!aiSession.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Session does not belong to user");
        }

        List<AiMessage> messages = aiMessageRepository.findByAiSession_IdAndMessageRoleNotOrderBySortOrderDesc(
                aiSession.getId(),
                AiMessageRole.SYSTEM,
                PageRequest.of(0, messageLimit)
        );

        List<AiMessage> aiMessages = new ArrayList<>(messages);
        Collections.reverse(aiMessages);
        return aiMessages.stream()
                .map(this::toHistoryDto)
                .toList();
    }

    public void clearSession(Long userId, String sessionId) {
        Optional<AiSession> sessionOptional = aiSessionRepository.findBySessionId(sessionId);
        if (sessionOptional.isEmpty()) {
            return;
        }
        AiSession aiSession = sessionOptional.get();
        if (!aiSession.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Session does not belong to user");
        }

        aiSessionRepository.delete(aiSession);
    }

    private AiMessageHistoryDTO toHistoryDto(AiMessage message) {
        return AiMessageHistoryDTO.builder()
                .role(message.getMessageRole().name().toLowerCase())
                .content(message.getContent())
                .stepType(message.getStepType())
                .generatedStep(aiMessageHelper.deserializePayload(message.getPayloadJson()))
                .build();
    }

    private AiSession resolveSession(Long userId,
                                     String sessionId,
                                     ChatType chatType,
                                     AiMessageRole messageRole,
                                     String content,
                                     @Nullable String stepType) {
        return aiSessionRepository.findBySessionId(sessionId)
                .map(session -> {
                    if (!session.getUser().getId().equals(userId)) {
                        throw new IllegalArgumentException("Session does not belong to user");
                    }
                    return session;
                })
                .orElseGet(() -> createSession(userId, sessionId, chatType, messageRole, content, stepType));
    }

    private AiSession createSession(Long userId,
                                    String sessionId,
                                    ChatType chatType,
                                    AiMessageRole messageRole,
                                    String content,
                                    @Nullable String stepType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User with " + userId + " not found"));

        String title = messageRole == AiMessageRole.USER ? aiMessageHelper.truncateTitle(content) : null;
        AiSession session = AiSession.builder()
                .user(user)
                .sessionId(sessionId)
                .chatType(chatType)
                .stepType(stepType)
                .title(title)
                .build();
        return aiSessionRepository.save(session);
    }

}
