package org.core.repository;

import org.core.domain.Model;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModelRepository extends JpaRepository<Model, Long> {
    
    List<Model> findByCourseIdOrderByPositionAsc(Long courseId);
    
    Optional<Model> findByCourseIdAndPosition(Long courseId, Integer position);
    
    @Query("SELECT MAX(m.position) FROM Model m WHERE m.course.id = :courseId")
    Integer findMaxPositionByCourseId(@Param("courseId") Long courseId);
    
    @Query("SELECT m FROM Model m WHERE m.course.id = :courseId AND m.position >= :fromPosition")
    List<Model> findModelsFromPosition(@Param("courseId") Long courseId, @Param("fromPosition") Integer fromPosition);
}
