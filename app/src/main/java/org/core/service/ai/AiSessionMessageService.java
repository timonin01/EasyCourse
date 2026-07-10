package org.core.service.ai;

import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import org.core.domain.User;
import org.core.domain.ai.AiMessage;
import org.core.domain.ai.AiMessageRole;
import org.core.domain.ai.AiSession;
import org.core.domain.ai.ChatType;
import org.core.dto.ai.AiMessageHistoryDTO;
import org.core.dto.ai.GeneratedStepHistoryDTO;
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

    @Value("${message.history.limit}")
    private int messageLimit;

    @Value("${generated.steps.history.limit}")
    private int generatedStepsHistoryLimit;

    private final UserRepository userRepository;
    private final AiSessionRepository aiSessionRepository;
    private final AiMessageRepository aiMessageRepository;
    private final AiMessageHelper aiMessageHelper;

    public void saveMessageToChatHistory(Long userId, String sessionId, AiMessageRole messageRole, ChatType chatType,
                                         String content, @Nullable String stepType, @Nullable StepikBlockRequest payload) {
        saveMessage(userId, sessionId, messageRole, chatType, content, stepType, null,
                aiMessageHelper.serializePayload(payload));
    }

    public void saveCourseAgentMessage(Long userId, String sessionId, Long courseId, AiMessageRole messageRole,
                                       String content, @Nullable String payloadJson) {
        saveMessage(userId, sessionId, messageRole, ChatType.COURSE_AGENT, content, null, courseContextKey(courseId),
                payloadJson);
    }

    private void saveMessage(Long userId, String sessionId, AiMessageRole messageRole, ChatType chatType, String content,
                             @Nullable String stepType, @Nullable String contextKey, @Nullable String payloadJson) {
        AiSession aiSession = resolveSession(userId, sessionId, chatType, messageRole, content, stepType, contextKey);

        int nextOrder = aiMessageRepository.countByAiSession_Id(aiSession.getId()) + 1;

        AiMessage aiMessage = AiMessage.builder()
                .aiSession(aiSession)
                .messageRole(messageRole)
                .content(content)
                .stepType(stepType)
                .payloadJson(payloadJson)
                .sortOrder(nextOrder)
                .build();

        aiMessageRepository.save(aiMessage);

        aiSession.setUpdatedAt(LocalDateTime.now());
        aiSessionRepository.save(aiSession);
    }

    @Transactional(readOnly = true)
    public Optional<String> getLatestSessionId(Long userId, ChatType chatType, @Nullable String stepType) {
        if (chatType == ChatType.GENERATE && stepType != null && !stepType.isBlank()) {
            return aiSessionRepository
                    .findFirstByUser_IdAndChatTypeAndStepTypeOrderByUpdatedAtDesc(userId, chatType, stepType)
                    .map(AiSession::getSessionId);
        }
        return aiSessionRepository
                .findFirstByUser_IdAndChatTypeOrderByUpdatedAtDesc(userId, chatType)
                .map(AiSession::getSessionId);
    }

    @Transactional
    public Optional<String> getLatestCourseAgentSessionId(Long userId, Long courseId) {
        String contextKey = courseContextKey(courseId);
        Optional<AiSession> session = aiSessionRepository
                .findFirstByUser_IdAndChatTypeAndContextKeyOrderByUpdatedAtDesc(
                        userId,
                        ChatType.COURSE_AGENT,
                        contextKey);
        if (session.isPresent()) {
            return session.map(AiSession::getSessionId);
        }

        return aiSessionRepository
                .findFirstByUser_IdAndChatTypeAndContextKeyIsNullOrderByUpdatedAtDesc(
                        userId,
                        ChatType.COURSE_AGENT)
                .map(legacySession -> {
                    legacySession.setContextKey(contextKey);
                    aiSessionRepository.save(legacySession);
                    return legacySession.getSessionId();
                });
    }

    @Transactional(readOnly = true)
    public List<GeneratedStepHistoryDTO> getGeneratedStepsHistory(Long userId) {
        List<AiMessage> messages = aiMessageRepository.findGeneratedStepsByUserId(
                userId,
                PageRequest.of(0, generatedStepsHistoryLimit)
        );

        return messages.stream()
                .map(this::toGeneratedStepHistoryDto)
                .toList();
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

    @Transactional
    public List<AiMessageHistoryDTO> getCourseAgentSessionHistory(
            Long userId, Long courseId, String sessionId) {
        AiSession session = aiSessionRepository.findBySessionId(sessionId)
                .orElse(null);
        if (session == null) {
            return List.of();
        }
        validateSessionOwner(session, userId);
        if (session.getChatType() != ChatType.COURSE_AGENT) {
            throw new IllegalArgumentException("Session does not belong to course");
        }
        String contextKey = courseContextKey(courseId);
        if (session.getContextKey() == null) {
            session.setContextKey(contextKey);
            aiSessionRepository.save(session);
        } else if (!contextKey.equals(session.getContextKey())) {
            throw new IllegalArgumentException("Session does not belong to course");
        }
        return loadSessionHistory(session);
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
                .generatedStep(message.getAiSession().getChatType() == ChatType.GENERATE
                        ? aiMessageHelper.deserializePayload(message.getPayloadJson())
                        : null)
                .payloadJson(message.getPayloadJson())
                .build();
    }

    private GeneratedStepHistoryDTO toGeneratedStepHistoryDto(AiMessage message) {
        String userPrompt = aiMessageRepository
                .findFirstByAiSession_IdAndMessageRoleAndSortOrderLessThanOrderBySortOrderDesc(
                        message.getAiSession().getId(),
                        AiMessageRole.USER,
                        message.getSortOrder()
                )
                .map(AiMessage::getContent)
                .orElse(message.getAiSession().getTitle());

        return GeneratedStepHistoryDTO.builder()
                .id(message.getId())
                .sessionId(message.getAiSession().getSessionId())
                .stepType(message.getStepType())
                .userPrompt(userPrompt)
                .content(message.getContent())
                .generatedStep(aiMessageHelper.deserializePayload(message.getPayloadJson()))
                .createdAt(message.getCreatedAt())
                .build();
    }

    private AiSession resolveSession(Long userId, String sessionId, ChatType chatType, AiMessageRole messageRole, String content,
                                     @Nullable String stepType, @Nullable String contextKey) {
        return aiSessionRepository.findBySessionId(sessionId)
                .map(session -> {
                    validateSessionOwner(session, userId);
                    if (session.getChatType() != chatType) {
                        throw new IllegalArgumentException("Session has incompatible chat type");
                    }
                    if (contextKey != null) {
                        if (session.getContextKey() == null) {
                            session.setContextKey(contextKey);
                            aiSessionRepository.save(session);
                        } else if (!contextKey.equals(session.getContextKey())) {
                            throw new IllegalArgumentException("Session does not belong to course");
                        }
                    }
                    return session;
                })
                .orElseGet(() -> createSession(
                        userId, sessionId, chatType, messageRole, content, stepType, contextKey));
    }

    private AiSession createSession(Long userId,
                                    String sessionId,
                                    ChatType chatType,
                                    AiMessageRole messageRole,
                                    String content,
                                    @Nullable String stepType,
                                    @Nullable String contextKey) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User with " + userId + " not found"));

        String title = messageRole == AiMessageRole.USER ? aiMessageHelper.truncateTitle(content) : null;
        AiSession session = AiSession.builder()
                .user(user)
                .sessionId(sessionId)
                .chatType(chatType)
                .stepType(stepType)
                .contextKey(contextKey)
                .title(title)
                .build();
        return aiSessionRepository.save(session);
    }

    private List<AiMessageHistoryDTO> loadSessionHistory(AiSession session) {
        List<AiMessage> messages = aiMessageRepository.findByAiSession_IdAndMessageRoleNotOrderBySortOrderDesc(
                session.getId(),
                AiMessageRole.SYSTEM,
                PageRequest.of(0, messageLimit)
        );
        List<AiMessage> ordered = new ArrayList<>(messages);
        Collections.reverse(ordered);
        return ordered.stream().map(this::toHistoryDto).toList();
    }

    private void validateSessionOwner(AiSession session, Long userId) {
        if (!session.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Session does not belong to user");
        }
    }

    private String courseContextKey(Long courseId) {
        if (courseId == null) {
            throw new IllegalArgumentException("Course id is required");
        }
        return "course:" + courseId;
    }

}
