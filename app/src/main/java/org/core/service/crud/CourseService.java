package org.core.service.crud;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.domain.Course;
import org.core.domain.User;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.course.CreateCourseDTO;
import org.core.dto.course.UpdateCourseDTO;
import org.core.dto.stepik.FullCourseResponseDTO;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.repository.CourseRepository;
import org.core.repository.UserRepository;
import org.core.util.UserAccessService;
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
    private final UserContextBean userContextBean;
    private final UserAccessService userAccessService;

    public CourseResponseDTO createCourse(CreateCourseDTO createDTO){
        Long contextUserId = userContextBean.getUserId();
        User user = userRepository.findById(contextUserId)
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

    public Course createCourseFromDTO(FullCourseResponseDTO courseResponseDTO){
        User user = userRepository.findById(courseResponseDTO.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Long contextUserId = userContextBean.getUserId();
        userAccessService.validateUserAccess(contextUserId, courseResponseDTO.getUserId());

        Course course = Course.builder()
                .author(user)
                .title(courseResponseDTO.getTitle())
                .description(courseResponseDTO.getDescription())
                .stepikCourseId(courseResponseDTO.getStepikCourseId())
                .createdAt(courseResponseDTO.getCreatedAt())
                .updatedAt(courseResponseDTO.getUpdatedAt())
                .needsStepikSync(courseResponseDTO.isNeedsStepikSync())
                .build();
        return courseRepository.save(course);
    }

    public CourseResponseDTO getCourseByCourseId(Long courseId){
        Long contextUserId = userContextBean.getUserId();
        Course course = userAccessService.findByCourseIdAndVerifyOwner(contextUserId, courseId);
        return mapToResponseDTO(course);
    }

    public List<CourseResponseDTO> getUserCoursesByUserId(Long userId){
        Long contextUserId = userContextBean.getUserId();
        userAccessService.validateUserAccess(contextUserId, userId);

        List<Course> courses = courseRepository.findByAuthorId(userId);
        return courses.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<CourseResponseDTO> getUnsyncedCoursesByUserId(Long userId){
        Long contextUserId = userContextBean.getUserId();
        userAccessService.validateUserAccess(contextUserId, userId);

        List<Course> unsyncedCourses = courseRepository.findByAuthorIdAndStepikCourseIdIsNull(userId);
        log.info("Found {} unsynced courses for user: {}", unsyncedCourses.size(), userId);
        return unsyncedCourses.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public CourseResponseDTO updateCourse(UpdateCourseDTO updateDTO){
        Long contextUserId = userContextBean.getUserId();
        Course course = userAccessService.findByCourseIdAndVerifyOwner(contextUserId, updateDTO.getId());
        boolean contentChanged = false;
        if(updateDTO.getTitle() != null && !updateDTO.getTitle().equals(course.getTitle())){
            course.setTitle(updateDTO.getTitle());
            contentChanged = true;
        }
        if(updateDTO.getDescription() != null && !updateDTO.getDescription().equals(course.getDescription())){
            course.setDescription(updateDTO.getDescription());
            contentChanged = true;
        }
        if (course.getStepikCourseId() != null && contentChanged) {
            course.setNeedsStepikSync(true);
        }
        Course savedCourse = courseRepository.save(course);
        return mapToResponseDTO(savedCourse);
    }

    public void deleteCourse(Long courseId){
        Long contextUserId = userContextBean.getUserId();
        Course course = userAccessService.findByCourseIdAndVerifyOwner(contextUserId, courseId);
        log.info("Course successfully deleted from Stepik with ID: {}", course.getStepikCourseId());
        courseRepository.delete(course);
    }

    public CourseResponseDTO updateCourseStepikId(Long courseId, Long stepikCourseId) {
        Long contextUserId = userContextBean.getUserId();
        Course course = userAccessService.findByCourseIdAndVerifyOwner(contextUserId, courseId);

        course.setStepikCourseId(stepikCourseId);
        course.setNeedsStepikSync(false);
        Course savedCourse = courseRepository.save(course);
        log.info("Updated course ID: {} with Stepik course ID: {}", courseId, stepikCourseId);
        return mapToResponseDTO(savedCourse);
    }

    public void clearNeedsStepikSync(Long courseId) {
        Long contextUserId = userContextBean.getUserId();
        Course course = userAccessService.findByCourseIdAndVerifyOwner(contextUserId, courseId);
        if (course.isNeedsStepikSync()) {
            course.setNeedsStepikSync(false);
            courseRepository.save(course);
            log.info("Cleared needsStepikSync for course ID: {}", courseId);
        }
    }

    public CourseResponseDTO updateCourseStepikCaptchaToken(Long courseId, String captchaToken) {
        Long contextUserId = userContextBean.getUserId();
        Course course = userAccessService.findByCourseIdAndVerifyOwner(contextUserId, courseId);
        course.setStepikCaptchaToken(captchaToken);
        Course savedCourse = courseRepository.save(course);
        log.info("Updated course ID: {} with Stepik captcha token", courseId);
        return mapToResponseDTO(savedCourse);
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
                .fullySynced(isFullySynced(course))
                .needsStepikSync(course.isNeedsStepikSync())
                .build();
    }

    private boolean isFullySynced(Course course){
        if (course.getStepikCourseId() == null || course.isNeedsStepikSync()) {
            return false;
        }
        return course.getSections().stream().allMatch(section ->
                section.getStepikSectionId() != null && !section.isNeedsStepikSync() &&
                section.getLessons().stream().allMatch(lesson ->
                        lesson.getStepikLessonId() != null && !lesson.isNeedsStepikSync() &&
                        lesson.getSteps().stream().allMatch(step ->
                                step.getStepikStepId() != null && !step.isNeedsStepikSync()
                        )
                )
        );
    }
}
