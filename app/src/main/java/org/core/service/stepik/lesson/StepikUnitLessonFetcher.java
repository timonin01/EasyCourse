package org.core.service.stepik.lesson;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.annotation.RequiresStepikToken;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.exception.exceptions.StepikStepIntegrationException;
import org.core.util.HeaderBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikUnitLessonFetcher {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    private final HeaderBuilder headerBuilder;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @RequiresStepikToken
    @Bulkhead(name = "stepikService")
    @Retry(name = "stepikService")
    @CircuitBreaker(name = "stepikService", fallbackMethod = "processGetUnitIdsByStepikSectionIdFallbackFromStepik")
    public List<Long> getSectionUnitIds(Long stepikSectionId) {
        try {
            String url = baseUrl + "/sections/" + stepikSectionId;
            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                JsonNode sectionsNode = jsonNode.get("sections");

                if (sectionsNode != null && sectionsNode.isArray() && !sectionsNode.isEmpty()) {
                    JsonNode sectionNode = sectionsNode.get(0);
                    JsonNode unitsNode = sectionNode.get("units");

                    if (unitsNode != null && unitsNode.isArray()) {
                        List<Long> unitIds = new ArrayList<>();
                        for (JsonNode unitIdNode : unitsNode) {
                            unitIds.add(unitIdNode.asLong());
                        }
                        return unitIds;
                    }
                }
                log.warn("No units found for section {} in Stepik response", stepikSectionId);
                return new ArrayList<>();
            } else {
                log.error("Failed to get section {}. Status: {}, Body: {}",
                        stepikSectionId, response.getStatusCode(), response.getBody());
                throw new StepikStepIntegrationException("Failed to get section " + stepikSectionId +
                        ". Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error getting section {} from Stepik: {}", stepikSectionId, e.getMessage());
            throw new StepikStepIntegrationException("Failed to get section " + stepikSectionId +
                    " from Stepik: " + e.getMessage());
        }
    }

    @RequiresStepikToken
    @Bulkhead(name = "stepikService")
    @Retry(name = "stepikService")
    @CircuitBreaker(name = "stepikService", fallbackMethod = "processGetLessonByIdByStepikUnitIdFallbackFromStepik")
    public Long getLessonIdByUnitID(Long stepikUnitId) {
        try {
            String url = baseUrl + "/units/" + stepikUnitId;
            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                JsonNode unitsNode = jsonNode.get("units");

                if (unitsNode != null && unitsNode.isArray() && !unitsNode.isEmpty()) {
                    JsonNode unitNode = unitsNode.get(0);
                    JsonNode lessonNode = unitNode.get("lesson");

                    if (lessonNode != null && !lessonNode.isNull()) {
                        Long lessonId = lessonNode.asLong();
                        log.info("Retrieved lesson ID {} for unit {} from Stepik", lessonId, stepikUnitId);
                        return lessonId;
                    }
                }
                return null;
            } else {
                log.error("Failed to get unit {}. Status: {}, Body: {}",
                        stepikUnitId, response.getStatusCode(), response.getBody());
                throw new StepikStepIntegrationException("Failed to get unit " + stepikUnitId +
                        ". Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error getting unit {} from Stepik: {}", stepikUnitId, e.getMessage());
            throw new StepikStepIntegrationException("Failed to get unit " + stepikUnitId +
                    " from Stepik: " + e.getMessage());
        }
    }

    private List<Long> processGetUnitIdsByStepikSectionIdFallbackFromStepik(Long stepikSectionId, Throwable throwable){
        log.error("Не удалось выполнить получения id юнитов со степика по stepikSectionId: {}, ex: {}",stepikSectionId, throwable.getMessage());
        return List.of();
    }

    private Long processGetLessonByIdByStepikUnitIdFallbackFromStepik(Long stepikUnitId, Throwable throwable){
        log.error("Не удалось выполнить получения id урока со степика stepikUnitId: {}, ex: {}", stepikUnitId, throwable.getMessage());
        return null;
    }
}
