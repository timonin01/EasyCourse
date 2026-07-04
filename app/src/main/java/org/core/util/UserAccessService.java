package org.core.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.exception.exceptions.*;
import org.core.repository.CourseRepository;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.core.repository.StepRepository;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public final class UserAccessService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final StepRepository stepRepository;

    public void validateUserAccess(Long contextUserId, Long requestUserId){
        if(!contextUserId.equals(requestUserId)){
            throw new ResourceAccessDeniedException("You specify another user's ID in the request");
        }
    }

    public Course findByCourseIdAndVerifyOwner(Long userId, Long courseId) {
        if (courseId == null) {
            throw new IllegalArgumentException("Course id is required");
        }
        if (userId == null) {
            throw new ResourceAccessDeniedException("User is not authenticated");
        }
        Course course = findCourseByCourseId(courseId);
        Long authorId = course.getAuthor().getId();
        if (!authorId.equals(userId)) {
            log.warn("Course ownership check failed: courseId={}, authorId={}, requestUserId={}",
                    courseId, authorId, userId);
            throw new CourseDoesntBelongToUserException("Course does not belong to user");
        }
        return course;
    }

    public Section findSectionAndVerifyOwner(Long userId, Long sectionId) {
        Section section = findSectionBySectionId(sectionId);
        findByCourseIdAndVerifyOwner(userId, section.getCourse().getId());
        return section;
    }
    public Lesson findLessonAndVerifyOwner(Long userId, Long lessonId) {
        Lesson lesson = findLessonByLessonId(lessonId);
        findByCourseIdAndVerifyOwner(userId, lesson.getSection().getCourse().getId());
        return lesson;
    }
    public Step findStepAndVerifyOwner(Long userId, Long stepId) {
        Step step = findStepByStepId(stepId);
        findByCourseIdAndVerifyOwner(userId, step.getLesson().getSection().getCourse().getId());
        return step;
    }

    private Course findCourseByCourseId(Long courseId){
        return courseRepository.findById(courseId)
                .orElseThrow(()->new CourseNotFoundException("Course not found"));
    }

    private Section findSectionBySectionId(Long sectionId){
        return sectionRepository.findById(sectionId)
                .orElseThrow(() -> new SectionNotFoundException("Section not found"));
    }

    private Lesson findLessonByLessonId(Long lessonId){
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found"));
    }

    private Step findStepByStepId(Long stepId){
        return stepRepository.findById(stepId)
                .orElseThrow(() -> new StepNotFoundException("Step not found"));
    }

}
