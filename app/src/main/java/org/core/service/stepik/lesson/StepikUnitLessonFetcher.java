package org.core.service.stepik.lesson;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.annotation.RequiresStepikToken;
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
    public List<Long> getSectionUnitIds(Long sectionId) {
        try {
            String url = baseUrl + "/sections/" + sectionId;
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
                log.warn("No units found for section {} in Stepik response", sectionId);
                return new ArrayList<>();
            } else {
                log.error("Failed to get section {}. Status: {}, Body: {}",
                        sectionId, response.getStatusCode(), response.getBody());
                throw new StepikStepIntegrationException("Failed to get section " + sectionId +
                        ". Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error getting section {} from Stepik: {}", sectionId, e.getMessage());
            throw new StepikStepIntegrationException("Failed to get section " + sectionId +
                    " from Stepik: " + e.getMessage());
        }
    }

    @RequiresStepikToken
    public Long getLessonIdByUnitID(Long unitId) {
        try {
            String url = baseUrl + "/units/" + unitId;
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
                        log.info("Retrieved lesson ID {} for unit {} from Stepik", lessonId, unitId);
                        return lessonId;
                    }
                }
                return null;
            } else {
                log.error("Failed to get unit {}. Status: {}, Body: {}",
                        unitId, response.getStatusCode(), response.getBody());
                throw new StepikStepIntegrationException("Failed to get unit " + unitId +
                        ". Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error getting unit {} from Stepik: {}", unitId, e.getMessage());
            throw new StepikStepIntegrationException("Failed to get unit " + unitId +
                    " from Stepik: " + e.getMessage());
        }
    }
}
