package org.core.service.stepik.lesson;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.annotation.RequiresStepikToken;
import org.core.domain.Lesson;
import org.core.dto.LessonCaptchaChallenge;
import org.core.dto.stepik.lesson.StepikLessonRequest;
import org.core.dto.stepik.lesson.StepikLessonRequestData;
import org.core.dto.stepik.lesson.StepikLessonResponse;
import org.core.dto.stepik.lesson.StepikLessonResponseData;
import org.core.exception.exceptions.StepikLessonIntegrationException;
import org.core.repository.LessonRepository;
import org.core.util.HeaderBuilder;
import org.core.util.StepikLessonRequestDataBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikLessonService {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    @Value("${stepik.api.token}")
    private String stepikAccessToken;

    @Value("${recaptcha.site-key}")
    private String recaptchaSiteKey;

    private final LessonRepository lessonRepository;
    private final StepikLessonRequestDataBuilder stepikLessonRequestDataBuilder;
    private final HeaderBuilder headerBuilder;
    private final RestTemplate restTemplate;

    public StepikLessonResponse createLesson(Lesson lesson) {
        return createLesson(lesson, null);
    }

    @RequiresStepikToken
    public StepikLessonResponse createLesson(Lesson lesson, String captchaToken) {
        StepikLessonRequestData requestData = stepikLessonRequestDataBuilder.createRequestDataForCreate(lesson, captchaToken);
        
        StepikLessonRequest request = new StepikLessonRequest(requestData);
        try {
            String url = baseUrl + "/lessons";

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<StepikLessonRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<StepikLessonResponse> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, StepikLessonResponse.class);

            if (response.getBody() != null) {
                log.info("Stepik response lessons: {}", response.getBody().getLessons());
            }
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                StepikLessonResponse responseBody = response.getBody();
                if (responseBody.getLesson() != null) {
                    log.info("Successfully created lesson in Stepik for lesson ID: {}", lesson.getId());
                    return responseBody;
                } else {
                    log.error("Lesson data is null in Stepik response. Full response: {}", responseBody);
                    throw new StepikLessonIntegrationException("No lesson data in Stepik response");
                }
            } else throw new StepikLessonIntegrationException("Failed to create lesson in Stepik");
        } catch (Exception e) {
            log.error("Error creating lesson in Stepik for lesson ID: {}: {}", lesson.getId(), e.getMessage());
            throw new StepikLessonIntegrationException("Failed to create lesson in Stepik: " + e.getMessage());
        }
    }

    @RequiresStepikToken
    public StepikLessonResponse updateLesson(Long stepikLessonId) {
        Lesson lesson = lessonRepository.findByStepikLessonId(stepikLessonId);

        StepikLessonRequest request = new StepikLessonRequest(stepikLessonRequestDataBuilder
                .createRequestDataForUpdate(lesson));
        try {
            String url = baseUrl +"/lessons/" + stepikLessonId;

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<StepikLessonRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<StepikLessonResponse> response = restTemplate.exchange(
                url, HttpMethod.PUT, entity, StepikLessonResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                StepikLessonResponseData lessonData = response.getBody().getLesson();
                if (lessonData != null) {
                    log.info("Successfully updated lesson in Stepik. ID: {}, Title: '{}', Units: {}", 
                            lessonData.getId(), lessonData.getTitle(), lessonData.getUnits());
                } else {
                    log.warn("Lesson data is null in update response for stepikLessonId: {}", stepikLessonId);
                }
                return response.getBody();
            } else {
                log.error("Failed to update lesson. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new StepikLessonIntegrationException("Failed to update lesson in Stepik. Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error updating lesson in Stepik with stepikLessonId: {}: {}", stepikLessonId, e.getMessage());
            throw new StepikLessonIntegrationException("Failed to update lesson in Stepik: " + e.getMessage());
        }
    }

    @RequiresStepikToken
    public void deleteLesson(Long stepikLessonId) {
        try {
            String url = baseUrl + "/lessons/" + stepikLessonId;

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);

            log.info("Successfully deleted lesson in Stepik with stepikLessonId: {}", stepikLessonId);
        } catch (Exception e) {
            log.error("Error deleting lesson in Stepik with stepikLessonId: {}: {}", stepikLessonId, e.getMessage());
            throw new StepikLessonIntegrationException("Failed to delete lesson in Stepik: " + e.getMessage());
        }
    }

    @RequiresStepikToken
    public StepikLessonResponseData getLessonByStepikId(Long stepikLessonId) {
        try {
            String url = baseUrl + "/lessons/" + stepikLessonId;

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<StepikLessonResponse> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, StepikLessonResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                StepikLessonResponseData lessonData = response.getBody().getLesson();
                if (lessonData != null) {
                    log.info("Successfully retrieved lesson from Stepik. ID: {}, Title: '{}', Units: {}",
                            lessonData.getId(), lessonData.getTitle(), lessonData.getUnits());
                    return lessonData;
                } else {
                    log.warn("Lesson data is null in GET response for stepikLessonId: {}", stepikLessonId);
                    throw new StepikLessonIntegrationException("No lesson data received from Stepik for ID: " + stepikLessonId);
                }
            } else {
                log.error("Failed to get lesson. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new StepikLessonIntegrationException("Failed to get lesson from Stepik. Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error getting lesson from Stepik with stepikLessonId: {}: {}", stepikLessonId, e.getMessage());
            throw new StepikLessonIntegrationException("Failed to get lesson from Stepik: " + e.getMessage());
        }
    }

    public LessonCaptchaChallenge tryCreateLessonAndGetCaptcha(Lesson lesson, String captchaToken) {
        try {
            StepikLessonResponse stepikLesson = createLesson(lesson, captchaToken);
            
            if (stepikLesson.getLesson() == null) {
                log.error("Lesson data is null in response from Stepik");
                throw new StepikLessonIntegrationException("No lesson data received from Stepik");
            }
            
            log.info("Lesson created successfully with Stepik ID: {} and captcha token: {}", 
                    stepikLesson.getLesson().getId(), stepikLesson.getLesson().getCaptcha() != null ? "present" : "absent");

            LessonCaptchaChallenge result = LessonCaptchaChallenge.noCaptchaNeeded(lesson.getId());
            result.setCaptchaKey(stepikLesson.getLesson().getId().toString());
            if (stepikLesson.getLesson().getCaptcha() != null) {
                result.setCaptchaImageUrl(stepikLesson.getLesson().getCaptcha());
                result.setMessage("Lesson created successfully in Stepik with captcha token");
            } else {
                result.setMessage("Lesson created successfully in Stepik");
            }
            return result;
        } catch (StepikLessonIntegrationException e) {
            if (e.getMessage().contains("captcha")) {
                log.warn("Captcha required for lesson creation: {}", e.getMessage());
                return LessonCaptchaChallenge.requiresCaptcha(lesson.getId(), recaptchaSiteKey);
            }
            log.error("Failed to create lesson in Stepik: {}", e.getMessage());
            throw e;
        }
    }
}
