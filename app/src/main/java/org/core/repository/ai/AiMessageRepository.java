package org.core.repository.ai;

import org.core.domain.ai.AiMessage;
import org.core.domain.ai.AiMessageRole;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    int countByAiSession_Id(Long aiSessionId);

    List<AiMessage> findByAiSession_IdAndMessageRoleNotOrderBySortOrderDesc(
            Long aiSessionId,
            AiMessageRole messageRole,
            Pageable pageable
    );

    @Query("""
            SELECT m FROM AiMessage m
            JOIN FETCH m.aiSession s
            WHERE s.user.id = :userId
            AND s.chatType = org.core.domain.ai.ChatType.GENERATE
            AND m.messageRole = org.core.domain.ai.AiMessageRole.ASSISTANT
            AND m.payloadJson IS NOT NULL
            AND TRIM(m.payloadJson) <> ''
            ORDER BY m.createdAt DESC
            """)
    List<AiMessage> findGeneratedStepsByUserId(@Param("userId") Long userId, Pageable pageable);

    Optional<AiMessage> findFirstByAiSession_IdAndMessageRoleAndSortOrderLessThanOrderBySortOrderDesc(
            Long aiSessionId,
            AiMessageRole messageRole,
            Integer sortOrder
    );
}
