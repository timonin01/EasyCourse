package org.core.repository;

import org.core.domain.ai.AiUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiUsageRepository extends JpaRepository<AiUsage, Long> {

    Optional<AiUsage> findByUserIdAndUsageMonth(Long userId, String usageMonth);
}
