package org.core.service.crud;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.domain.User;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.course.CreateCourseDTO;
import org.core.dto.course.UpdateCourseDTO;
import org.core.exception.CourseNotFoundException;
import org.core.exception.StepikCourseIntegrationException;
import org.core.exception.UserNotFoundException;
import org.core.repository.CourseRepository;
import org.core.repository.UserRepository;
import org.core.service.stepik.StepikCourseService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class CourseService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public CourseResponseDTO createCourse(CreateCourseDTO createDTO){
        User user = userRepository.findById(createDTO.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Course course = new Course();
        course.setAuthor(user);
        course.setTitle(createDTO.getTitle());
        course.setDescription(createDTO.getDescription());
        Course savedCourse = courseRepository.save(course);
        log.info("Course created locally with ID: {} for user: {}", savedCourse.getId(), user.getId());
        log.info("Course can be synced with Stepik later using /sync endpoint");
        
        return mapToResponseDTO(savedCourse);
    }

    public CourseResponseDTO getCourseByCourseId(Long courseId){
        Course course = findCourseByCourseId(courseId);
        return mapToResponseDTO(course);
    }

    public List<CourseResponseDTO> getUserCoursesByUserId(Long userId){
        List<Course> courses = courseRepository.findByAuthorId(userId);
        return courses.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<CourseResponseDTO> getUnsyncedCoursesByUserId(Long userId){
        List<Course> unsyncedCourses = courseRepository.findByAuthorIdAndStepikCourseIdIsNull(userId);
        log.info("Found {} unsynced courses for user: {}", unsyncedCourses.size(), userId);
        return unsyncedCourses.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public CourseResponseDTO updateCourse(UpdateCourseDTO updateDTO){
        Course course = findCourseByCourseId(updateDTO.getId());
        if(updateDTO.getTitle() != null && !updateDTO.getTitle().equals(course.getTitle())){
            course.setTitle(updateDTO.getTitle());
        }
        if(updateDTO.getDescription() != null && !updateDTO.getDescription().equals(course.getDescription())){
            course.setDescription(updateDTO.getDescription());
        }
        Course savedCourse = courseRepository.save(course);
        return mapToResponseDTO(savedCourse);
    }

    public void deleteCourse(Long courseId){
        Course course = findCourseByCourseId(courseId);
        log.info("Course successfully deleted from Stepik with ID: {}", course.getStepikCourseId());
        courseRepository.delete(course);
    }

    public CourseResponseDTO updateCourseStepikId(Long courseId, Long stepikCourseId) {
        Course course = findCourseByCourseId(courseId);
        course.setStepikCourseId(stepikCourseId);
        Course savedCourse = courseRepository.save(course);
        log.info("Updated course ID: {} with Stepik course ID: {}", courseId, stepikCourseId);
        return mapToResponseDTO(savedCourse);
    }

    public CourseResponseDTO updateCourseStepikCaptchaToken(Long courseId, String captchaToken) {
        Course course = findCourseByCourseId(courseId);
        course.setStepikCaptchaToken(captchaToken);
        Course savedCourse = courseRepository.save(course);
        log.info("Updated course ID: {} with Stepik captcha token", courseId);
        return mapToResponseDTO(savedCourse);
    }

    private Course findCourseByCourseId(Long courseId){
        return courseRepository.findById(courseId)
                .orElseThrow(()->new CourseNotFoundException("Course not found"));
    }

    private CourseResponseDTO mapToResponseDTO(Course course){
        return CourseResponseDTO.builder()
                .id(course.getId())
                .userId(course.getAuthor().getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .stepikCourseId(course.getStepikCourseId())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}
