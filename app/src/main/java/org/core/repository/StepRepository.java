package org.core.repository;

import org.core.domain.Step;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StepRepository extends JpaRepository<Step, Long> {

    List<Step> findByLessonIdOrderByPositionAsc(Long lessonId);
    
    Step findByStepikStepId(Long stepikStepId);

    @Query("SELECT MAX(s.position) FROM Step s WHERE s.lesson.id = :lessonId")
    Integer findMaxPositionByLessonId(@Param("lessonId") Long lessonId);

    @Modifying
    @Query("UPDATE Step s SET s.position = s.position + 1 WHERE s.lesson.id = :lessonId AND s.position >= :fromPosition")
    void incrementPositionsFrom(@Param("lessonId") Long lessonId, @Param("fromPosition") Integer fromPosition);

    @Modifying
    @Query("UPDATE Step s SET s.position = s.position - 1 WHERE s.lesson.id = :lessonId AND s.position BETWEEN :fromPosition AND :toPosition")
    void decrementPositionsFromTo(@Param("lessonId") Long lessonId, @Param("fromPosition") Integer fromPosition, @Param("toPosition") Integer toPosition);

    @Modifying
    @Query("UPDATE Step s SET s.position = s.position + 1 WHERE s.lesson.id = :lessonId AND s.position BETWEEN :fromPosition AND :toPosition")
    void incrementPositionsFromTo(@Param("lessonId") Long lessonId, @Param("fromPosition") Integer fromPosition, @Param("toPosition") Integer toPosition);

    @Modifying
    @Query("UPDATE Step s SET s.position = s.position - 1 WHERE s.lesson.id = :lessonId AND s.position >= :fromPosition")
    void decrementPositionsFrom(@Param("lessonId") Long lessonId, @Param("fromPosition") Integer fromPosition);
}