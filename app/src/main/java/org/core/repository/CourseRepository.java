package org.core.repository;

import org.core.domain.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByAuthorId(Long authorId);
    
    List<Course> findByAuthorIdAndStepikCourseIdIsNull(Long authorId);

}