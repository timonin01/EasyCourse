package org.core.util;

import lombok.RequiredArgsConstructor;
import org.core.domain.Course;
import org.core.exception.exceptions.CourseDoesntBelongToUserException;
import org.core.exception.exceptions.CourseNotFoundException;
import org.core.exception.exceptions.ResourceAccessDeniedException;
import org.core.repository.CourseRepository;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public final class UserAccessService {

    private final CourseRepository courseRepository;

    public void validateUserAccess(Long contextUserId, Long requestUserId){
        if(!contextUserId.equals(requestUserId)){
            throw new ResourceAccessDeniedException("You specify another user's ID in the request");
        }
    }

    public Course findByCourseIdAndVerifyOwner(Long userId, Long courseId) {
        if (courseId == null) {
            throw new IllegalArgumentException("Course id is required");
        }
        Course course = findCourseByCourseId(courseId);
        if (!course.getAuthor().getId().equals(userId)) {
            throw new CourseDoesntBelongToUserException("Course does not belong to user");
        }
        return course;
    }

    private Course findCourseByCourseId(Long courseId){
        return courseRepository.findById(courseId)
                .orElseThrow(()->new CourseNotFoundException("Course not found"));
    }

}
