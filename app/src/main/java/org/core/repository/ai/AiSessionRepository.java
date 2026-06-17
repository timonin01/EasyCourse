package org.core.repository.ai;

import org.core.domain.ai.AiSession;
import org.core.domain.ai.ChatType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiSessionRepository extends JpaRepository<AiSession, Long> {
    Optional<AiSession> findBySessionId(String sessionId);

    Optional<AiSession> findFirstByUser_IdAndChatTypeOrderByUpdatedAtDesc(Long userId, ChatType chatType);

    Optional<AiSession> findFirstByUser_IdAndChatTypeAndStepTypeOrderByUpdatedAtDesc(
            Long userId, ChatType chatType, String stepType);
}