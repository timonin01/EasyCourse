package org.core.repository;

import org.core.domain.Model;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModelRepository extends JpaRepository<Model, Long> {

    List<Model> findByCourseIdOrderByPositionAsc(Long courseId);

    @Query("SELECT MAX(m.position) FROM Model m WHERE m.course.id = :courseId")
    Optional<Integer> findMaxPositionByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("UPDATE Model m SET m.position = m.position + 1 WHERE m.course.id = :courseId AND m.position >= :position")
    void incrementPositionsFromPosition(@Param("courseId") Long courseId, @Param("position") Integer position);

    @Modifying
    @Query("UPDATE Model m SET m.position = m.position - 1 WHERE m.course.id = :courseId AND m.position >= :position")
    void decrementPositionsFromPosition(@Param("courseId") Long courseId, @Param("position") Integer position);

    @Modifying
    @Query("UPDATE Model m SET m.position = m.position + 1 WHERE m.course.id = :courseId AND m.position >= :fromPosition AND m.position <= :toPosition")
    void incrementPositionsRange(@Param("courseId") Long courseId, @Param("fromPosition") Integer fromPosition, @Param("toPosition") Integer toPosition);

    @Modifying
    @Query("UPDATE Model m SET m.position = m.position - 1 WHERE m.course.id = :courseId AND m.position >= :fromPosition AND m.position <= :toPosition")
    void decrementPositionsRange(@Param("courseId") Long courseId, @Param("fromPosition") Integer fromPosition, @Param("toPosition") Integer toPosition);
}