package org.core.service.stepik;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

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

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Храним сессии для повторения запросов с капчей
    private final Map<String, CourseCreationContext> captchaSessions = new ConcurrentHashMap<>();

    public StepikCourseResponseData createCourse(Course course){
        try {
            String url = baseUrl + "/courses";

            StepikCourseRequest request = new StepikCourseRequest();
            StepikCourseRequestData requestData = createCourseRequestData(course);
            request.setCourse(requestData);

            HttpHeaders headers = createHeaders();
            HttpEntity<StepikCourseRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<StepikCourseResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, StepikCourseResponse.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                log.info("Course created in Stepik with ID: {}", response.getBody().getCourse().getId());
                return response.getBody().getCourse();
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
            throw new StepikIntegrationException("Failed to update course in Stepik");
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

    public StepikCourseResponseData getCourse(Long courseId) {
        try {
            String url = baseUrl + "/courses/" + courseId;

            HttpHeaders headers = createHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<StepikCourseResponse> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, StepikCourseResponse.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("Course retrieved from Stepik with ID: {}", courseId);
                return response.getBody().getCourse();
            }
            throw new StepikIntegrationException("Failed to get course from Stepik");
        } catch (Exception e) {
            log.error("Error getting course from Stepik: {}", e.getMessage());
            throw new StepikIntegrationException("Failed to get course from Stepik: " + e.getMessage());
        }
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.set("Authorization", "Bearer " + apiToken);
        return headers;
    }

    /**
     * Пытается создать курс и извлекает капчу из ошибки если нужно
     */
    public CaptchaChallenge tryCreateCourseAndGetCaptcha(Course course) {
        try {
            String url = baseUrl + "/courses";

            StepikCourseRequest request = new StepikCourseRequest();
            StepikCourseRequestData requestData = createCourseRequestData(course);
            request.setCourse(requestData);

            HttpHeaders headers = createHeaders();
            HttpEntity<StepikCourseRequest> entity = new HttpEntity<>(request, headers);

            try {
                ResponseEntity<StepikCourseResponse> response = restTemplate.exchange(
                        url, HttpMethod.POST, entity, StepikCourseResponse.class);

                if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                    log.info("Course created without captcha with ID: {}", response.getBody().getCourse().getId());
                    return CaptchaChallenge.noCaptchaNeeded(course.getId());
                }
            } catch (HttpClientErrorException e) {
                if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                    String errorBody = e.getResponseBodyAsString();
                    log.info("Got error from Stepik, checking for captcha: {}", errorBody);
                    
                    if (errorBody.contains("captcha")) {
                        return extractCaptchaFromError(errorBody, course, request);
                    }
                }
                throw new StepikIntegrationException("Stepik API error: " + e.getMessage());
            }
            
            throw new StepikIntegrationException("Unexpected response from Stepik");
            
        } catch (Exception e) {
            if (e instanceof StepikIntegrationException) {
                throw e;
            }
            log.error("Error trying to create course: {}", e.getMessage());
            throw new StepikIntegrationException("Failed to create course: " + e.getMessage());
        }
    }

    /**
     * Создает курс с решенной капчей
     */
    public StepikCourseResponseData createCourseWithSolvedCaptcha(String sessionToken, String captchaKey, String captchaSolution) {
        CourseCreationContext context = captchaSessions.get(sessionToken);
        if (context == null) {
            throw new StepikIntegrationException("Invalid or expired captcha session");
        }

        try {
            String url = baseUrl + "/courses";
            
            // Добавляем решение капчи к оригинальному запросу
            StepikCourseRequest requestWithCaptcha = addCaptchaSolutionToRequest(
                context.getOriginalRequest(), captchaKey, captchaSolution);
            
            HttpHeaders headers = createHeaders();
            HttpEntity<StepikCourseRequest> entity = new HttpEntity<>(requestWithCaptcha, headers);

            ResponseEntity<StepikCourseResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, StepikCourseResponse.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                log.info("Course created with solved captcha, ID: {}", response.getBody().getCourse().getId());
                
                // Удаляем сессию после успешного создания
                captchaSessions.remove(sessionToken);
                
                return response.getBody().getCourse();
            }
            
            throw new StepikIntegrationException("Failed to create course with solved captcha");
            
        } catch (Exception e) {
            log.error("Error creating course with solved captcha: {}", e.getMessage());
            throw new StepikIntegrationException("Failed to create course with solved captcha: " + e.getMessage());
        }
    }

    /**
     * Извлекает данные капчи из ошибки Stepik API
     */
    private CaptchaChallenge extractCaptchaFromError(String errorBody, Course course, StepikCourseRequest originalRequest) {
        try {
            JsonNode errorJson = objectMapper.readTree(errorBody);
            
            // Создаем уникальный токен сессии
            String sessionToken = UUID.randomUUID().toString();
            
            // Сохраняем контекст для повторного запроса
            CourseCreationContext context = new CourseCreationContext(course, originalRequest);
            captchaSessions.put(sessionToken, context);
            
            // Пытаемся извлечь данные капчи из ответа
            String captchaKey = extractCaptchaKey(errorJson);
            String captchaImageUrl = extractCaptchaImageUrl(errorJson);
            
            log.info("Extracted captcha challenge for course: {}", course.getId());
            
            return CaptchaChallenge.withCaptcha(sessionToken, captchaImageUrl, captchaKey, course.getId());
            
        } catch (Exception e) {
            log.error("Failed to parse captcha from Stepik error: {}", e.getMessage());
            throw new StepikIntegrationException("Failed to extract captcha from Stepik response");
        }
    }

    /**
     * Извлекает ключ капчи из JSON ответа
     */
    private String extractCaptchaKey(JsonNode errorJson) {
        // TODO: Нужно изучить реальную структуру ответа Stepik
        // Возможные варианты:
        // errorJson.path("captcha_key").asText()
        // errorJson.path("captcha").path("key").asText()
        // errorJson.path("errors").path("captcha").path("key").asText()
        
        // Пока возвращаем заглушку
        return "stepik_captcha_key_" + System.currentTimeMillis();
    }

    /**
     * Извлекает URL изображения капчи из JSON ответа
     */
    private String extractCaptchaImageUrl(JsonNode errorJson) {
        // TODO: Нужно изучить реальную структуру ответа Stepik
        // Возможные варианты:
        // errorJson.path("captcha_image").asText()
        // errorJson.path("captcha").path("image_url").asText()
        // errorJson.path("errors").path("captcha").path("image").asText()
        
        // Пока возвращаем заглушку
        return baseUrl + "/captcha/image.png?key=" + extractCaptchaKey(errorJson);
    }

    /**
     * Добавляет решение капчи к запросу
     */
    private StepikCourseRequest addCaptchaSolutionToRequest(StepikCourseRequest originalRequest, String captchaKey, String captchaSolution) {
        // TODO: Нужно изучить, как Stepik принимает решение капчи
        // Возможные варианты добавления полей:
        // originalRequest.setCaptchaKey(captchaKey);
        // originalRequest.setCaptchaSolution(captchaSolution);
        // или в headers, или в отдельных полях запроса
        
        // Пока возвращаем оригинальный запрос
        log.info("Adding captcha solution to request: key={}, solution={}", captchaKey, captchaSolution);
        return originalRequest;
    }

    private StepikCourseRequestData createCourseRequestData(Course course){
        StepikCourseRequestData requestData = new StepikCourseRequestData();
        requestData.setTitle(course.getTitle());
        requestData.setDescription(course.getDescription());
        requestData.setLanguage("ru");
        requestData.setPublic(false);
        requestData.setCourseType("basic");
        return requestData;
    }

    /**
     * Класс для хранения контекста создания курса
     */
    private static class CourseCreationContext {
        private final Course course;
        private final StepikCourseRequest originalRequest;
        
        public CourseCreationContext(Course course, StepikCourseRequest originalRequest) {
            this.course = course;
            this.originalRequest = originalRequest;
        }
        
        public Course getCourse() { return course; }
        public StepikCourseRequest getOriginalRequest() { return originalRequest; }
    }

}
