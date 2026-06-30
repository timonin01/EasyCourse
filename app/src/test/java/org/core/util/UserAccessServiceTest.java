package org.core.util;

import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.domain.User;
import org.core.exception.exceptions.CourseDoesntBelongToUserException;
import org.core.exception.exceptions.CourseNotFoundException;
import org.core.exception.exceptions.LessonNotFoundException;
import org.core.exception.exceptions.ResourceAccessDeniedException;
import org.core.exception.exceptions.SectionNotFoundException;
import org.core.exception.exceptions.StepNotFoundException;
import org.core.repository.CourseRepository;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.core.repository.StepRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAccessServiceTest {

    @Mock
    private CourseRepository courseRepository;
    @Mock
    private SectionRepository sectionRepository;
    @Mock
    private LessonRepository lessonRepository;
    @Mock
    private StepRepository stepRepository;

    private UserAccessService userAccessService;

    private User owner;
    private Course course;
    private Section section;
    private Lesson lesson;
    private Step step;

    @BeforeEach
    void setUp() {
        userAccessService = new UserAccessService(
                courseRepository,
                sectionRepository,
                lessonRepository,
                stepRepository
        );

        owner = User.builder().id(1L).name("Owner").email("owner@test.com").password("hash").build();
        course = Course.builder().id(10L).title("Course").author(owner).build();
        section = Section.builder().id(20L).title("Section").course(course).position(1).build();
        lesson = Lesson.builder().id(30L).title("Lesson").section(section).position(1).build();
        step = Step.builder().id(40L).lesson(lesson).position(1).build();
    }

    @Test
    void validateUserAccessAllowsSameUser() {
        userAccessService.validateUserAccess(1L, 1L);
    }

    @Test
    void validateUserAccessRejectsDifferentUser() {
        assertThatThrownBy(() -> userAccessService.validateUserAccess(1L, 2L))
                .isInstanceOf(ResourceAccessDeniedException.class);
    }

    @Test
    void findByCourseIdAndVerifyOwnerReturnsCourseForOwner() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        Course result = userAccessService.findByCourseIdAndVerifyOwner(1L, 10L);

        assertThat(result.getId()).isEqualTo(10L);
    }

    @Test
    void findByCourseIdAndVerifyOwnerRejectsNonOwner() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> userAccessService.findByCourseIdAndVerifyOwner(2L, 10L))
                .isInstanceOf(CourseDoesntBelongToUserException.class)
                .hasMessage("Course does not belong to user");
    }

    @Test
    void findByCourseIdAndVerifyOwnerThrowsWhenCourseMissing() {
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAccessService.findByCourseIdAndVerifyOwner(1L, 99L))
                .isInstanceOf(CourseNotFoundException.class);
    }

    @Test
    void findSectionAndVerifyOwnerReturnsSectionForOwner() {
        when(sectionRepository.findById(20L)).thenReturn(Optional.of(section));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        Section result = userAccessService.findSectionAndVerifyOwner(1L, 20L);

        assertThat(result.getId()).isEqualTo(20L);
    }

    @Test
    void findSectionAndVerifyOwneRrejectsNonOwner() {
        when(sectionRepository.findById(20L)).thenReturn(Optional.of(section));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> userAccessService.findSectionAndVerifyOwner(2L, 20L))
                .isInstanceOf(CourseDoesntBelongToUserException.class);
    }

    @Test
    void findLessonAndVerifyOwnerRejectsNonOwner() {
        when(lessonRepository.findById(30L)).thenReturn(Optional.of(lesson));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> userAccessService.findLessonAndVerifyOwner(2L, 30L))
                .isInstanceOf(CourseDoesntBelongToUserException.class);
    }

    @Test
    void findStepAndVerifyOwnerRejectsNonOwner() {
        when(stepRepository.findById(40L)).thenReturn(Optional.of(step));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> userAccessService.findStepAndVerifyOwner(2L, 40L))
                .isInstanceOf(CourseDoesntBelongToUserException.class);
    }

    @Test
    void findSectionAndVerifyOwnerThrowsWhenSectionMissing() {
        when(sectionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAccessService.findSectionAndVerifyOwner(1L, 99L))
                .isInstanceOf(SectionNotFoundException.class);
    }

    @Test
    void findLessonAndVerifyOwnerThrowsWhenLessonMissing() {
        when(lessonRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAccessService.findLessonAndVerifyOwner(1L, 99L))
                .isInstanceOf(LessonNotFoundException.class);
    }

    @Test
    void findStepAndVerifyOwnerThrowsWhenStepMissing() {
        when(stepRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAccessService.findStepAndVerifyOwner(1L, 99L))
                .isInstanceOf(StepNotFoundException.class);
    }
}
