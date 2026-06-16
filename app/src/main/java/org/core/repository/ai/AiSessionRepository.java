package org.core.repository.ai;

import org.core.domain.ai.AiSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiSessionRepository extends JpaRepository<AiSession, Long> {
}