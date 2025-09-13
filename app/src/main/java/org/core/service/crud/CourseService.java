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
import org.core.dto.stepik.course.StepikCourseResponseData;
import org.core.exception.CourseNotFoundException;
import org.core.exception.StepikIntegrationException;
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
    private final StepikCourseService stepikCourseService;

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
        log.info("Updated course with ID: {}", updateDTO.getId());
        try {
            Long stepikCourseId = course.getStepikCourseId();
            if (stepikCourseId != null) {
                stepikCourseService.updateCourse(stepikCourseId, savedCourse);
                log.info("Course successfully updated in Stepik with ID: {}", stepikCourseId);
            }
            log.warn("Stepik course update not implemented yet - need stepikCourseId field");
        } catch (StepikIntegrationException e) {
            log.error("Failed to update course in Stepik: {}", e.getMessage());
        }
        return mapToResponseDTO(savedCourse);
    }

    public void deleteCourse(Long courseId){
        Course course = findCourseByCourseId(courseId);
        try {
            Long stepikCourseId = course.getStepikCourseId();
            if (stepikCourseId != null) {
                stepikCourseService.deleteCourse(stepikCourseId);
                log.info("Course successfully deleted from Stepik with ID: {}", stepikCourseId);
            }
            courseRepository.delete(course);
            log.info("Deleted course with ID: {} for user: {}", course.getId(), course.getAuthor().getId());
        } catch (StepikIntegrationException e) {
            log.error("Failed to delete course from Stepik: {}", e.getMessage());
        }
    }

    public CourseResponseDTO syncCourseWithStepik(Long courseId) {
        Course course = findCourseByCourseId(courseId);
        
        try {
            Long stepikCourseId = course.getStepikCourseId();
            if (stepikCourseId == null) {
                log.info("Attempting to sync course with ID: {} to Stepik", courseId);
                StepikCourseResponseData stepikResponse = stepikCourseService.createCourse(course);
                log.info("Course successfully synced with Stepik, Stepik ID: {}", stepikResponse.getId());
                course.setStepikCourseId(stepikResponse.getId());
                courseRepository.save(course);
            } else {
                log.info("Course already synced with Stepik, Stepik ID: {}", stepikCourseId);
            }
        } catch (StepikIntegrationException e) {
            String errorMessage = e.getMessage();
            log.error("Failed to sync course with Stepik: {}", errorMessage);
            
            // Проверяем, является ли ошибка капчей
            if (errorMessage.contains("captcha") || errorMessage.contains("Wrong captcha")) {
                String stepikUrl = String.format("https://stepik.org/teach/?create_course=true&title=%s&description=%s", 
                    course.getTitle(), course.getDescription());
                throw new RuntimeException(String.format(
                    "Stepik requires captcha verification. Please create the course manually at: %s " +
                    "Then update the course with Stepik ID using: PUT /api/v1/courses/%d/stepik-id/{stepikCourseId}. Error: %s", 
                    stepikUrl, courseId, errorMessage));
            } else {
                throw new RuntimeException("Failed to sync course with Stepik: " + errorMessage);
            }
        }

        return mapToResponseDTO(course);
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
