package org.core.service.crud;

import org.core.context.UserContextBean;
import org.core.domain.Course;
import org.core.domain.User;
import org.core.dto.course.CreateCourseDTO;
import org.core.dto.course.UpdateCourseDTO;
import org.core.exception.exceptions.CourseDoesntBelongToUserException;
import org.core.exception.exceptions.ResourceAccessDeniedException;
import org.core.repository.CourseRepository;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.core.repository.StepRepository;
import org.core.repository.UserRepository;
import org.core.util.UserAccessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceOwnershipTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private SectionRepository sectionRepository;
    @Mock
    private LessonRepository lessonRepository;
    @Mock
    private StepRepository stepRepository;

    private UserContextBean userContextBean;
    private UserAccessService userAccessService;
    private CourseService courseService;

    private User owner;
    private Course ownersCourse;

    @BeforeEach
    void setUp() {
        userContextBean = new UserContextBean();
        userAccessService = new UserAccessService(
                courseRepository,
                sectionRepository,
                lessonRepository,
                stepRepository
        );
        courseService = new CourseService(
                userRepository,
                courseRepository,
                userContextBean,
                userAccessService
        );

        owner = User.builder().id(1L).name("Owner").email("owner@test.com").password("hash").build();
        ownersCourse = Course.builder()
                .id(10L)
                .title("My course")
                .description("Desc")
                .author(owner)
                .build();
    }

    @Test
    void createCourseUsesUserFromJwtContextNotBody() {
        userContextBean.setUserId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> {
            Course saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        CreateCourseDTO dto = new CreateCourseDTO("New course", "Description");
        var response = courseService.createCourse(dto);

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository).save(captor.capture());
        assertThat(captor.getValue().getAuthor().getId()).isEqualTo(1L);
        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("New course");
    }

    @Test
    void getCourseByCourseIdAllowsOwner() {
        userContextBean.setUserId(1L);
        when(courseRepository.findById(10L)).thenReturn(Optional.of(ownersCourse));

        var response = courseService.getCourseByCourseId(10L);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getUserId()).isEqualTo(1L);
    }

    @Test
    void getCourseByCourseIdRejectsNonOwner() {
        userContextBean.setUserId(2L);
        when(courseRepository.findById(10L)).thenReturn(Optional.of(ownersCourse));

        assertThatThrownBy(() -> courseService.getCourseByCourseId(10L))
                .isInstanceOf(CourseDoesntBelongToUserException.class);
    }

    @Test
    void updateCourseRejectsNonOwner() {
        userContextBean.setUserId(2L);
        when(courseRepository.findById(10L)).thenReturn(Optional.of(ownersCourse));

        UpdateCourseDTO dto = new UpdateCourseDTO(10L, "Hacked", null);

        assertThatThrownBy(() -> courseService.updateCourse(dto))
                .isInstanceOf(CourseDoesntBelongToUserException.class);
        verify(courseRepository, never()).save(any());
    }

    @Test
    void updateCourseAllowsOwner() {
        userContextBean.setUserId(1L);
        when(courseRepository.findById(10L)).thenReturn(Optional.of(ownersCourse));
        when(courseRepository.save(ownersCourse)).thenReturn(ownersCourse);

        UpdateCourseDTO dto = new UpdateCourseDTO(10L, "Updated title", null);
        var response = courseService.updateCourse(dto);

        assertThat(response.getTitle()).isEqualTo("Updated title");
        verify(courseRepository).save(ownersCourse);
    }

    @Test
    void deleteCourseRejectsNonOwner() {
        userContextBean.setUserId(2L);
        when(courseRepository.findById(10L)).thenReturn(Optional.of(ownersCourse));

        assertThatThrownBy(() -> courseService.deleteCourse(10L))
                .isInstanceOf(CourseDoesntBelongToUserException.class);
        verify(courseRepository, never()).delete(any());
    }

    @Test
    void deleteCourseAllowsOwner() {
        userContextBean.setUserId(1L);
        when(courseRepository.findById(10L)).thenReturn(Optional.of(ownersCourse));

        courseService.deleteCourse(10L);

        verify(courseRepository).delete(ownersCourse);
    }

    @Test
    void getUserCoursesByUserIdRejectsOtherUsersList() {
        userContextBean.setUserId(1L);

        assertThatThrownBy(() -> courseService.getUserCoursesByUserId(2L))
                .isInstanceOf(ResourceAccessDeniedException.class);
        verify(courseRepository, never()).findByAuthorId(any());
    }

    @Test
    void getUserCoursesByUserIdAllowsOwnList() {
        userContextBean.setUserId(1L);
        when(courseRepository.findByAuthorId(1L)).thenReturn(List.of(ownersCourse));

        var courses = courseService.getUserCoursesByUserId(1L);

        assertThat(courses).hasSize(1);
        assertThat(courses.getFirst().getId()).isEqualTo(10L);
    }
}
