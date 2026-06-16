package org.core.repository.ai;

import org.core.domain.ai.BatchGeneration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BatchGenerationRepository extends JpaRepository<BatchGeneration, Long> {
}