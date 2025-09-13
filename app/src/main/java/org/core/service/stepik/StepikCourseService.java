package org.core.service.stepik;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.dto.CaptchaChallenge;
import org.core.dto.stepik.course.StepikCourseRequest;
import org.core.dto.stepik.course.StepikCourseRequestData;
import org.core.dto.stepik.course.StepikCourseResponse;
import org.core.dto.stepik.course.StepikCourseResponseData;
import org.core.exception.StepikIntegrationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikCourseService {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    @Value("${stepik.api.token}")
    private String apiToken;

    @Value("${stepik.api.default-language:ru}")
    private String defaultLanguage;

    @Value("${stepik.api.default-public:false}")
    private boolean defaultPublic;

    @Value("${stepik.api.default-course-type:basic}")
    private String defaultCourseType;

    @Value("${recaptcha.site-key}")
    private String recaptchaSiteKey;

    private final RestTemplate restTemplate;

    public StepikCourseResponseData createCourse(Course course){
        return createCourse(course, null);
    }

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

            HttpHeaders headers = createHeaders();
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
                    throw new StepikIntegrationException("No course data in Stepik response");
                }
            }
            throw new StepikIntegrationException("Failed to create course in Stepik");
        } catch (Exception e) {
            log.error("Error creating course in Stepik: {}", e.getMessage());
            throw new StepikIntegrationException("Failed to create course in Stepik: " + e.getMessage());
        }
    }

    public StepikCourseResponseData updateCourse(Long courseId, Course course) {
        try {
            String url = baseUrl + "/courses/" + courseId;

            StepikCourseRequest request = new StepikCourseRequest();
            StepikCourseRequestData requestData = createCourseRequestData(course);
            request.setCourse(requestData);

            HttpHeaders headers = createHeaders();
            HttpEntity<StepikCourseRequest> entity = new HttpEntity<>(request, headers);
            ResponseEntity<StepikCourseResponse> response = restTemplate.exchange(
                    url, HttpMethod.PUT, entity, StepikCourseResponse.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("Course updated in Stepik with ID: {}", courseId);
                return response.getBody().getCourse();
            }
            else throw new StepikIntegrationException("Failed to update course in Stepik");
        } catch (Exception e) {
            log.error("Error updating course in Stepik: {}", e.getMessage());
            throw new StepikIntegrationException("Failed to update course in Stepik: " + e.getMessage());
        }
    }

    public void deleteCourse(Long courseId) {
        try {
            String url = baseUrl + "/courses/" + courseId;

            HttpHeaders headers = createHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Void> response = restTemplate.exchange(
                    url, HttpMethod.DELETE, entity, Void.class);

            if (response.getStatusCode() == HttpStatus.NO_CONTENT) {
                log.info("Course deleted from Stepik with ID: {}", courseId);
            }
            else throw new StepikIntegrationException("Failed to delete course in Stepik");
        } catch (Exception e) {
            log.error("Error deleting course in Stepik: {}", e.getMessage());
            throw new StepikIntegrationException("Failed to delete course in Stepik: " + e.getMessage());
        }
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        
        if (apiToken == null || apiToken.trim().isEmpty()) {
            throw new StepikIntegrationException("Stepik API token is not configured");
        }
        headers.set("Authorization", "Bearer " + apiToken);
        return headers;
    }

    public CaptchaChallenge tryCreateCourseAndGetCaptcha(Course course, String captchaToken) {
        try {
            StepikCourseResponseData stepikCourse = createCourse(course, captchaToken);
            log.info("Course created successfully with Stepik ID: {} and captcha token: {}", 
                    stepikCourse.getId(), stepikCourse.getCaptcha() != null ? "present" : "absent");

            CaptchaChallenge result = CaptchaChallenge.noCaptchaNeeded(course.getId());
            result.setCaptchaKey(stepikCourse.getId().toString());
            if (stepikCourse.getCaptcha() != null) {
                result.setCaptchaImageUrl(stepikCourse.getCaptcha());
                result.setMessage("Course created successfully in Stepik with captcha token");
            } else {
                result.setMessage("Course created successfully in Stepik");
            }
            return result;
        } catch (StepikIntegrationException e) {
            if (e.getMessage().contains("captcha")) {
                log.warn("Captcha required for course creation: {}", e.getMessage());
                return CaptchaChallenge.requiresCaptcha(course.getId(), recaptchaSiteKey);
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
