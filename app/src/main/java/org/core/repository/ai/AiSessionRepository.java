package org.core.repository.ai;

import org.core.domain.ai.AiSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiSessionRepository extends JpaRepository<AiSession, Long> {
    Optional<AiSession> findBySessionId(String sessionId);
}