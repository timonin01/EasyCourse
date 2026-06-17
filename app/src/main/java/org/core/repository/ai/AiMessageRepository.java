package org.core.repository.ai;

import org.core.domain.ai.AiMessage;
import org.core.domain.ai.AiMessageRole;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    int countByAiSession_Id(Long aiSessionId);

    List<AiMessage> findByAiSession_IdAndMessageRoleNotOrderBySortOrderDesc(
            Long aiSessionId,
            AiMessageRole messageRole,
            Pageable pageable
    );
}
