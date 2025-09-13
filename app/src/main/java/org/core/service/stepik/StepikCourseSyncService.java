package org.core.service.stepik;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.dto.CaptchaChallenge;
import org.core.dto.course.CourseResponseDTO;
import org.core.service.crud.CourseService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class StepikCourseSyncService {

    private final StepikCourseService stepikCourseService;
    private final CourseService courseService;

    public CaptchaChallenge syncCourseWithStepik(Long courseId, String captchaToken) {
        log.info("Starting sync course ID: {} with Stepik (captcha provided: {})", courseId, captchaToken != null);
        
        if (captchaToken != null) {
            log.info("Captcha token length: {}, starts with: {}", 
                    captchaToken.length(), 
                    captchaToken.substring(0, Math.min(captchaToken.length(), 30)) + "...");
        }
        CourseResponseDTO courseDTO = courseService.getCourseByCourseId(courseId);
        Course course = mapToCourse(courseDTO);

        CaptchaChallenge result = stepikCourseService.tryCreateCourseAndGetCaptcha(course, captchaToken);
        return processStepikResponse(courseId, result);
    }

    private Course mapToCourse(CourseResponseDTO courseDTO) {
        Course course = new Course();
        course.setId(courseDTO.getId());
        course.setTitle(courseDTO.getTitle());
        course.setDescription(courseDTO.getDescription());
        return course;
    }

    private CaptchaChallenge processStepikResponse(Long courseId, CaptchaChallenge result) {
        if (result.getCaptchaKey() != null && result.getCaptchaKey().matches("\\d+")) {
            return handleSuccessfulCourseCreation(courseId, result);
        }
        else if (result.getSiteKey() != null) {
            log.info("Captcha required for course creation");
            return result;
        }
        return result;
    }

    private CaptchaChallenge handleSuccessfulCourseCreation(Long courseId, CaptchaChallenge result) {
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
