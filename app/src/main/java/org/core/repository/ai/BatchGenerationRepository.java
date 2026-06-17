package org.core.repository.ai;

import org.core.domain.ai.BatchGeneration;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BatchGenerationRepository extends JpaRepository<BatchGeneration, Long> {

    List<BatchGeneration> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Modifying
    @Query("DELETE FROM BatchGeneration b WHERE b.user.id = :userId")
    void deleteAllByUser_Id(@Param("userId") Long userId);
}
