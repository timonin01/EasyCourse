package org.core.repository.ai;

import org.core.domain.ai.BatchGeneration;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BatchGenerationRepository extends JpaRepository<BatchGeneration, Long> {

    List<BatchGeneration> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
