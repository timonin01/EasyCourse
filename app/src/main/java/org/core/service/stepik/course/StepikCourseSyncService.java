package org.core.service.stepik.course;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.dto.CourseCaptchaChallenge;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.stepik.course.StepikCourseResponseData;
import org.core.service.crud.CourseService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class StepikCourseSyncService {

    private final StepikCourseService stepikCourseService;
    private final CourseService courseService;

    public CourseCaptchaChallenge syncCourseWithStepik(Long courseId, String captchaToken) {
        log.info("Starting sync course ID: {} with Stepik (captcha provided: {})", courseId, captchaToken != null);
        
        if (captchaToken != null) {
            log.info("Captcha token length: {}, starts with: {}", 
                    captchaToken.length(), 
                    captchaToken.substring(0, Math.min(captchaToken.length(), 30)) + "...");
        }
        CourseResponseDTO courseDTO = courseService.getCourseByCourseId(courseId);
        Course course = mapToCourse(courseDTO);

        CourseCaptchaChallenge result = stepikCourseService.tryCreateCourseAndGetCaptcha(course, captchaToken);
        return processStepikResponse(courseId, result);
    }

    public StepikCourseResponseData updateCourseInStepik(Long courseId) {
        log.info("Starting manual update of course ID: {} in Stepik", courseId);
        
        CourseResponseDTO courseDTO = courseService.getCourseByCourseId(courseId);
        if (courseDTO.getStepikCourseId() == null) {
            throw new IllegalStateException("Course is not synced with Stepik. Course ID: " + courseId);
        }
        Course course = mapToCourse(courseDTO);
        StepikCourseResponseData responseData = stepikCourseService.updateCourse(courseDTO.getStepikCourseId(), course);
        
        log.info("Course {} successfully updated in Stepik with course ID: {}", courseId, responseData.getId());
        return responseData;
    }

    public void deleteCourseFromStepik(Long courseId) {
        log.info("Starting manual deletion of course ID: {} from Stepik", courseId);
        
        CourseResponseDTO courseDTO = courseService.getCourseByCourseId(courseId);
        if (courseDTO.getStepikCourseId() == null) {
            throw new IllegalStateException("Course is not synced with Stepik. Course ID: " + courseId);
        }
        stepikCourseService.deleteCourse(courseDTO.getStepikCourseId());
        courseService.updateCourseStepikId(courseId, null);
        
        log.info("Course {} successfully deleted from Stepik and unlinked", courseId);
    }

    private Course mapToCourse(CourseResponseDTO courseDTO) {
        Course course = new Course();
        course.setId(courseDTO.getId());
        course.setTitle(courseDTO.getTitle());
        course.setDescription(courseDTO.getDescription());
        course.setStepikCourseId(courseDTO.getStepikCourseId());
        return course;
    }

    private CourseCaptchaChallenge processStepikResponse(Long courseId, CourseCaptchaChallenge result) {
        if (result.getCaptchaKey() != null && result.getCaptchaKey().matches("\\d+")) {
            return handleSuccessfulCourseCreation(courseId, result);
        }
        else if (result.getSiteKey() != null) {
            log.info("Captcha required for course creation");
            return result;
        }
        return result;
    }

    private CourseCaptchaChallenge handleSuccessfulCourseCreation(Long courseId, CourseCaptchaChallenge result) {
        Long stepikCourseId = Long.parseLong(result.getCaptchaKey());
        courseService.updateCourseStepikId(courseId, stepikCourseId);

        if (result.getCaptchaImageUrl() != null) {
            courseService.updateCourseStepikCaptchaToken(courseId, result.getCaptchaImageUrl());
            result.setMessage("Course created successfully in Stepik with ID: " + stepikCourseId + " and captcha token saved");
            log.info("Updated local course {} with Stepik ID: {} and captcha token", courseId, stepikCourseId);
        } else {
            result.setMessage("Course created successfully in Stepik with ID: " + stepikCourseId);
            log.info("Updated local course {} with Stepik ID: {}", courseId, stepikCourseId);
        }
        return result;
    }
}