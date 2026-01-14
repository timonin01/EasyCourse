package org.core.repository;

import org.core.domain.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {

    Section findByStepikSectionId(Long stepikSectionId);

    List<Section> findByCourseIdOrderByPositionAsc(Long courseId);
    
    List<Section> findByCourseIdAndStepikSectionIdIsNullOrderByPositionAsc(Long courseId);

    @Query("SELECT MAX(m.position) FROM Section m WHERE m.course.id = :courseId")
    Optional<Integer> findMaxPositionByCourseId(@Param("courseId") Long courseId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Section m SET m.position = m.position + 1 WHERE m.course.id = :courseId AND m.position >= :position")
    void incrementPositionsFromPosition(@Param("courseId") Long courseId, @Param("position") Integer position);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Section m SET m.position = m.position - 1 WHERE m.course.id = :courseId AND m.position >= :position")
    void decrementPositionsFromPosition(@Param("courseId") Long courseId, @Param("position") Integer position);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Section m SET m.position = m.position + 1 WHERE m.course.id = :courseId AND m.position >= :fromPosition AND m.position <= :toPosition")
    void incrementPositionsRange(@Param("courseId") Long courseId, @Param("fromPosition") Integer fromPosition, @Param("toPosition") Integer toPosition);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Section m SET m.position = m.position - 1 WHERE m.course.id = :courseId AND m.position >= :fromPosition AND m.position <= :toPosition")
    void decrementPositionsRange(@Param("courseId") Long courseId, @Param("fromPosition") Integer fromPosition, @Param("toPosition") Integer toPosition);
}