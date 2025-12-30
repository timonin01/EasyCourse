package org.core.service.stepik.course;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.annotation.RequiresStepikToken;
import org.core.domain.Course;
import org.core.dto.CourseCaptchaChallenge;
import org.core.dto.stepik.course.StepikCourseRequest;
import org.core.dto.stepik.course.StepikCourseRequestData;
import org.core.dto.stepik.course.StepikCourseResponse;
import org.core.dto.stepik.course.StepikCourseResponseData;
import org.core.exception.exceptions.StepikCourseIntegrationException;
import org.core.exception.exceptions.StepikLessonIntegrationException;
import org.core.util.HeaderBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikCourseService {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    @Value("${stepik.api.default-language:ru}")
    private String defaultLanguage;

    @Value("${stepik.api.default-public:false}")
    private boolean defaultPublic;

    @Value("${stepik.api.default-course-type:basic}")
    private String defaultCourseType;

    @Value("${recaptcha.site-key}")
    private String recaptchaSiteKey;

    private final HeaderBuilder headerBuilder;
    private final RestTemplate restTemplate;

    @RequiresStepikToken
    public StepikCourseResponseData createCourse(Course course, String captchaToken){
        try {
            String url = baseUrl + "/courses";

            StepikCourseRequest request = new StepikCourseRequest();
            StepikCourseRequestData requestData = createCourseRequestData(course);

            if (captchaToken != null && !captchaToken.trim().isEmpty()) {
                requestData.setCaptcha(captchaToken);
                log.info("Adding captcha token to course creation request. Token length: {}, starts with: {}", 
                        captchaToken.length(), 
                        captchaToken.substring(0, Math.min(captchaToken.length(), 20)) + "...");
            } else {
                log.info("No captcha token provided - creating course without captcha");
            }
            request.setCourse(requestData);

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<StepikCourseRequest> entity = new HttpEntity<>(request, headers);
            ResponseEntity<StepikCourseResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, StepikCourseResponse.class);

            log.info("Stepik response status: {}", response.getStatusCode());
            log.info("Stepik response body present: {}", response.getBody() != null);
            
            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                StepikCourseResponseData courseData = response.getBody().getCourse();
                if (courseData != null) {
                    log.info("Course created in Stepik with ID: {}", courseData.getId());
                    return courseData;
                } else {
                    log.error("Course data is null in response");
                    throw new StepikCourseIntegrationException("No course data in Stepik response");
                }
            }
            throw new StepikCourseIntegrationException("Failed to create course in Stepik");
        } catch (Exception e) {
            log.error("Error creating course in Stepik: {}", e.getMessage());
            throw new StepikCourseIntegrationException("Failed to create course in Stepik: " + e.getMessage());
        }
    }

    @RequiresStepikToken
    public StepikCourseResponseData updateCourse(Long stepikCourseId, Course course) {
        try {
            String url = baseUrl + "/courses/" + stepikCourseId;

            StepikCourseRequest request = new StepikCourseRequest();
            StepikCourseRequestData requestData = createCourseRequestData(course);
            request.setCourse(requestData);

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<StepikCourseRequest> entity = new HttpEntity<>(request, headers);
            ResponseEntity<StepikCourseResponse> response = restTemplate.exchange(
                    url, HttpMethod.PUT, entity, StepikCourseResponse.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("Course updated in Stepik with ID: {}", stepikCourseId);
                return response.getBody().getCourse();
            }
            else throw new StepikCourseIntegrationException("Failed to update course in Stepik");
        } catch (Exception e) {
            log.error("Error updating course in Stepik: {}", e.getMessage());
            throw new StepikCourseIntegrationException("Failed to update course in Stepik: " + e.getMessage());
        }
    }

    @RequiresStepikToken
    public void deleteCourse(Long stepikCourseId) {
        try {
            String url = baseUrl + "/courses/" + stepikCourseId;

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Void> response = restTemplate.exchange(
                    url, HttpMethod.DELETE, entity, Void.class);

            if (response.getStatusCode() == HttpStatus.NO_CONTENT) {
                log.info("Course deleted from Stepik with ID: {}", stepikCourseId);
            }
            else throw new StepikCourseIntegrationException("Failed to delete course in Stepik");
        } catch (Exception e) {
            log.error("Error deleting course in Stepik: {}", e.getMessage());
            throw new StepikCourseIntegrationException("Failed to delete course in Stepik: " + e.getMessage());
        }
    }

    @RequiresStepikToken
    public StepikCourseResponseData getCourse(Long stepikCourseId) {
        try {
            String url = baseUrl + "/courses/" + stepikCourseId;

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<StepikCourseResponse> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, StepikCourseResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                StepikCourseResponseData courseResponseData = response.getBody().getCourse();
                if (courseResponseData != null) {
                    log.info("Successfully retrieved course from Stepik. ID: {}, Title: '{}'", courseResponseData.getId(), courseResponseData.getTitle());
                    return courseResponseData;
                } else {
                    log.error("Course data is null in response");
                    throw new StepikLessonIntegrationException("Course data is null in Stepik response");
                }
            } else {
                log.error("Failed to get course. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new StepikLessonIntegrationException("Failed to get course from Stepik. Status: " + response.getStatusCode());
            }
        } catch (RuntimeException e) {
            log.error("Error getting course from Stepik with stepikCourseId: {}: {}", stepikCourseId, e.getMessage());
            throw new StepikLessonIntegrationException("Failed to get course from Stepik: " + e.getMessage());
        }
    }

    public CourseCaptchaChallenge tryCreateCourseAndGetCaptcha(Course course, String captchaToken) {
        try {
            StepikCourseResponseData stepikCourse = createCourse(course, captchaToken);
            log.info("Course created successfully with Stepik ID: {} and captcha token: {}", 
                    stepikCourse.getId(), stepikCourse.getCaptcha() != null ? "present" : "absent");

            CourseCaptchaChallenge result = CourseCaptchaChallenge.noCaptchaNeeded(course.getId());
            result.setCaptchaKey(stepikCourse.getId().toString());
            if (stepikCourse.getCaptcha() != null) {
                result.setCaptchaImageUrl(stepikCourse.getCaptcha());
                result.setMessage("Course created successfully in Stepik with captcha token");
            } else {
                result.setMessage("Course created successfully in Stepik");
            }
            return result;
        } catch (StepikCourseIntegrationException e) {
            if (e.getMessage().contains("captcha")) {
                log.warn("Captcha required for course creation: {}", e.getMessage());
                return CourseCaptchaChallenge.requiresCaptcha(course.getId(), recaptchaSiteKey);
            }
            log.error("Failed to create course in Stepik: {}", e.getMessage());
            throw e;
        }
    }

    private StepikCourseRequestData createCourseRequestData(Course course){
        StepikCourseRequestData requestData = new StepikCourseRequestData();
        requestData.setTitle(course.getTitle());
        requestData.setDescription(course.getDescription());
        requestData.setLanguage("ru");
        requestData.setIsPublic(true);
        requestData.setCourseType("basic");
        
        log.info("Creating course request with: title='{}', description='{}', courseType='{}', isPublic={}", 
                requestData.getTitle(), requestData.getDescription(), requestData.getCourseType(), requestData.getIsPublic());
        
        return requestData;
    }
}
