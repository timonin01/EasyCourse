package org.core.repository;

import org.core.domain.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    Lesson findByStepikLessonId(Long stepikLessonId);

    @Query("SELECT l from Lesson l where l.section.id = :modelId order by l.position asc")
    List<Lesson> findByModelIdOrderByPositionAsc(@Param("modelId") Long modelId);
    
    @Query("SELECT MAX(l.position) FROM Lesson l WHERE l.section.id = :modelId")
    Optional<Integer> findMaxPositionByModelId(@Param("modelId") Long modelId);
    
    @Modifying
    @Query("UPDATE Lesson l SET l.position = l.position + 1 WHERE l.section.id = :modelId AND l.position >= :position")
    void incrementPositionsFromPosition(@Param("modelId") Long modelId, @Param("position") Integer position);
    
    @Modifying
    @Query("UPDATE Lesson l SET l.position = l.position - 1 WHERE l.section.id = :modelId AND l.position >= :position")
    void decrementPositionsFromPosition(@Param("modelId") Long modelId, @Param("position") Integer position);
    
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Lesson l SET l.position = l.position + 1 WHERE l.section.id = :modelId AND l.position >= :fromPosition AND l.position <= :toPosition")
    void incrementPositionsRange(@Param("modelId") Long modelId, @Param("fromPosition") Integer fromPosition, @Param("toPosition") Integer toPosition);
    
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Lesson l SET l.position = l.position - 1 WHERE l.section.id = :modelId AND l.position >= :fromPosition AND l.position <= :toPosition")
    void decrementPositionsRange(@Param("modelId") Long modelId, @Param("fromPosition") Integer fromPosition, @Param("toPosition") Integer toPosition);

    @Query("SELECT l FROM Lesson l where l.section.id = :modelId AND l.stepikLessonId is null ORDER BY l.position ASC")
    List<Lesson> findByModelIdAndStepikLessonIdIsNullOrderByPositionAsc(@Param("modelId") Long modelId);
    
    @Modifying
    @Query("UPDATE Lesson l SET l.stepikLessonId = :stepikLessonId WHERE l.id = :lessonId")
    void updateStepikLessonId(@Param("lessonId") Long lessonId, @Param("stepikLessonId") Long stepikLessonId);

    @Modifying
    @Query("UPDATE Lesson l SET l.stepikLessonId = NULL WHERE l.id = :lessonId")
    void updateStepikLessonId(@Param("lessonId") Long lessonId);

    @Modifying
    @Query("UPDATE Lesson l SET l.stepikLessonId = NULL WHERE l.section.id = :modelId")
    int clearStepikLessonIdsByModelId(@Param("modelId") Long modelId);
}