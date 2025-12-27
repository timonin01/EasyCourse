package org.core.service;

import org.core.domain.Course;
import org.core.domain.User;
import org.core.dto.course.CreateCourseDTO;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.course.UpdateCourseDTO;
import org.core.exception.exceptions.CourseNotFoundException;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.repository.CourseRepository;
import org.core.repository.UserRepository;
import org.core.service.crud.CourseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;
    
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CourseService courseService;

    private User testUser;
    private Course testCourse;

    @BeforeEach
    void setUp() {
        testUser = createTestUser();
        testCourse = createTestCourse();
    }

    private User createTestUser() {
        return User.builder()
                .id(1L)
                .name("Test User")
                .email("test@example.com")
                .password("password")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private Course createTestCourse() {
        return Course.builder()
                .id(1L)
                .title("Test Course")
                .description("Test Description")
                .author(testUser)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createNewCourseCorrect() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(courseRepository.save(any(Course.class))).thenReturn(testCourse);

        CreateCourseDTO testCreateDTO = new CreateCourseDTO(1L, "Test Course", "Test Description");

        CourseResponseDTO result = courseService.createCourse(testCreateDTO);

        assertThat(result.getTitle()).isEqualTo("Test Course");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getUserId()).isEqualTo(1L);
        
        verify(userRepository).findById(1L);
        verify(courseRepository).save(any(Course.class));
    }

    @Test
    void createNewCourseWhereUserNotExists() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        
        CreateCourseDTO nonExistentUserDTO = new CreateCourseDTO(999L, "Title", "Description");

        assertThatThrownBy(() -> courseService.createCourse(nonExistentUserDTO))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessage("User not found");
        
        verify(userRepository).findById(999L);
        verify(courseRepository, never()).save(any(Course.class));
    }

    @Test
    void getCourseByCourseIdSuccessful() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(testCourse));

        CourseResponseDTO result = courseService.getCourseByCourseId(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Test Course");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getUserId()).isEqualTo(1L);
        
        verify(courseRepository).findById(1L);
    }

    @Test
    void getCourseByCourseIdNotFound() {
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.getCourseByCourseId(999L))
                .isInstanceOf(CourseNotFoundException.class)
                .hasMessage("Course not found");
        
        verify(courseRepository).findById(999L);
    }

    @Test
    void getUserCoursesByUserIdSuccessful() {
        List<Course> courses = Arrays.asList(testCourse);
        when(courseRepository.findByAuthorId(1L)).thenReturn(courses);

        List<CourseResponseDTO> result = courseService.getUserCoursesByUserId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Test Course");
        assertThat(result.get(0).getUserId()).isEqualTo(1L);
        
        verify(courseRepository).findByAuthorId(1L);
    }

    @Test
    void getUserCoursesByUserIdEmptyList() {
        when(courseRepository.findByAuthorId(1L)).thenReturn(Arrays.asList());

        List<CourseResponseDTO> result = courseService.getUserCoursesByUserId(1L);

        assertThat(result).isEmpty();
        verify(courseRepository).findByAuthorId(1L);
    }

    @Test
    void updateCourseSuccessful() {
        UpdateCourseDTO updateDTO = new UpdateCourseDTO();
        updateDTO.setId(1L);
        updateDTO.setTitle("Updated Title");
        updateDTO.setDescription("Updated Description");

        when(courseRepository.findById(1L)).thenReturn(Optional.of(testCourse));
        when(courseRepository.save(any(Course.class))).thenReturn(testCourse);

        CourseResponseDTO result = courseService.updateCourse(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getDescription()).isEqualTo("Updated Description");
        
        verify(courseRepository).findById(1L);
        verify(courseRepository).save(any(Course.class));
    }

    @Test
    void updateCourseOnlyTitle() {
        UpdateCourseDTO updateDTO = new UpdateCourseDTO();
        updateDTO.setId(1L);
        updateDTO.setTitle("Updated Title");

        when(courseRepository.findById(1L)).thenReturn(Optional.of(testCourse));
        when(courseRepository.save(any(Course.class))).thenReturn(testCourse);

        CourseResponseDTO result = courseService.updateCourse(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        
        verify(courseRepository).findById(1L);
        verify(courseRepository).save(any(Course.class));
    }

    @Test
    void updateCourseOnlyDescription() {
        UpdateCourseDTO updateDTO = new UpdateCourseDTO();
        updateDTO.setId(1L);
        updateDTO.setDescription("Updated Description");

        when(courseRepository.findById(1L)).thenReturn(Optional.of(testCourse));
        when(courseRepository.save(any(Course.class))).thenReturn(testCourse);

        CourseResponseDTO result = courseService.updateCourse(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Test Course");
        assertThat(result.getDescription()).isEqualTo("Updated Description");

        verify(courseRepository).findById(1L);
        verify(courseRepository).save(any(Course.class));
    }

    @Test
    void updateCourseNotFound() {
        UpdateCourseDTO updateDTO = new UpdateCourseDTO();
        updateDTO.setId(999L);
        updateDTO.setTitle("Updated Title");

        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.updateCourse(updateDTO))
                .isInstanceOf(CourseNotFoundException.class)
                .hasMessage("Course not found");
        
        verify(courseRepository).findById(999L);
        verify(courseRepository, never()).save(any(Course.class));
    }

    @Test
    void deleteCourseSuccessful() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(testCourse));

        courseService.deleteCourse(1L);

        verify(courseRepository).findById(1L);
        verify(courseRepository).delete(testCourse);
    }

    @Test
    void deleteCourseNotFound() {
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.deleteCourse(999L))
                .isInstanceOf(CourseNotFoundException.class)
                .hasMessage("Course not found");
        
        verify(courseRepository).findById(999L);
        verify(courseRepository, never()).delete(any(Course.class));
    }
}
