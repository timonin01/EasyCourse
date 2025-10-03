package org.core.service.stepik.step;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Step;
import org.core.dto.stepik.step.*;
import org.core.exception.StepikStepIntegrationException;
import org.core.repository.StepRepository;
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
public class StepikStepService {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    private final StepikStepSourceDataRequestBuilder stepikStepSourceDataRequestBuilder;
    private final StepRepository stepRepository;
    private final HeaderBuilder headerBuilder;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public StepikStepSourceResponse createStep(Step step) {
        StepikStepSourceRequestData requestData = stepikStepSourceDataRequestBuilder.createRequestDataForCreate(step);
        StepikStepSourceRequest request = new StepikStepSourceRequest(requestData);
        
        try {
            String url = baseUrl + "/step-sources";

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<StepikStepSourceRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<String> rawResponse = restTemplate.exchange(
                url, HttpMethod.POST, entity, String.class);

            ObjectMapper objectMapper = new ObjectMapper();
            StepikStepSourceResponse response = objectMapper.readValue(rawResponse.getBody(), StepikStepSourceResponse.class);
            if (rawResponse.getStatusCode().is2xxSuccessful() && response != null) {
                if (response.getStepSource() != null) {
                    log.info("Successfully created step in Stepik for step ID: {}", step.getId());
                    return response;
                } else {
                    log.error("Step data is null in Stepik response. Full response: {}", response);
                    throw new StepikStepIntegrationException("No step data in Stepik response");
                }
            } else {
                throw new StepikStepIntegrationException("Failed to create step in Stepik");
            }
        } catch (Exception e) {
            log.error("Error creating step in Stepik for step ID: {}: {}", step.getId(), e.getMessage());
            throw new StepikStepIntegrationException("Failed to create step in Stepik: " + e.getMessage());
        }
    }

    public StepikStepSourceResponse updateStep(Long stepikStepId) {
        Step step = stepRepository.findByStepikStepId(stepikStepId);

        StepikStepSourceRequest request = new StepikStepSourceRequest(stepikStepSourceDataRequestBuilder.createRequestDataForUpdate(step));
        try {
            String url = baseUrl + "/step-sources/" + stepikStepId;

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<StepikStepSourceRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<StepikStepSourceResponse> response = restTemplate.exchange(
                url, HttpMethod.PUT, entity, StepikStepSourceResponse.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                StepikStepSourceResponseData stepData = response.getBody().getStepSource();
                if (stepData != null) {
                    log.info("Successfully updated step in Stepik. ID: {}, Position: {}", 
                            stepData.getId(), stepData.getPosition());
                } else {
                    log.warn("Step data is null in update response for stepikStepId: {}", stepikStepId);
                }
                return response.getBody();
            } else {
                log.error("Failed to update step. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new StepikStepIntegrationException("Failed to update step in Stepik. Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error updating step in Stepik with stepikStepId: {}: {}", stepikStepId, e.getMessage());
            throw new StepikStepIntegrationException("Failed to update step in Stepik: " + e.getMessage());
        }
    }

    public void deleteStep(Long stepikStepId) {
        try {
            String url = baseUrl + "/step-sources/" + stepikStepId;

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);

            log.info("Successfully deleted step in Stepik with stepikStepId: {}", stepikStepId);
        } catch (Exception e) {
            log.error("Error deleting step in Stepik with stepikStepId: {}: {}", stepikStepId, e.getMessage());
            throw new StepikStepIntegrationException("Failed to delete step in Stepik: " + e.getMessage());
        }
    }

    public List<Long> getLessonStepIdsFromStepik(Long stepikLessonId) {
        try {
            String url = baseUrl + "/lessons/" + stepikLessonId;

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                JsonNode lessonsNode = jsonNode.get("lessons");

                if (lessonsNode != null && lessonsNode.isArray() && lessonsNode.size() > 0) {
                    JsonNode lessonNode = lessonsNode.get(0);
                    JsonNode stepsNode = lessonNode.get("steps");

                    if (stepsNode != null && stepsNode.isArray()) {
                        List<Long> stepIds = new ArrayList<>();
                        for (JsonNode stepIdNode : stepsNode) {
                            stepIds.add(stepIdNode.asLong());
                        }
                        log.info("Retrieved {} step IDs for lesson {} from Stepik", stepIds.size(), stepikLessonId);
                        return stepIds;
                    }
                }
                log.warn("No steps found for lesson {} in Stepik response", stepikLessonId);
                return new ArrayList<>();
            } else {
                log.error("Failed to get lesson {}. Status: {}, Body: {}",
                        stepikLessonId, response.getStatusCode(), response.getBody());
                throw new StepikStepIntegrationException("Failed to get lesson " + stepikLessonId +
                        ". Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error getting step IDs for lesson {} from Stepik: {}", stepikLessonId, e.getMessage());
            throw new StepikStepIntegrationException("Failed to get step IDs for lesson " + stepikLessonId +
                    " from Stepik: " + e.getMessage());
        }
    }

    public StepikStepSourceResponseData getStepikStepById(Long stepikStepId) {
        try {
            String url = baseUrl + "/step-sources/" + stepikStepId;

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                StepikStepSourceResponse stepikResponse = objectMapper.readValue(
                        response.getBody(), StepikStepSourceResponse.class);

                StepikStepSourceResponseData stepData = stepikResponse.getStepSource();
                if (stepData != null) {
                    log.info("Successfully retrieved step {} from Stepik", stepikStepId);
                    return stepData;
                } else {
                    log.warn("Step data is null in response for stepikStepId: {}", stepikStepId);
                    throw new StepikStepIntegrationException("No step data received from Stepik for step " + stepikStepId);
                }
            } else {
                log.error("Failed to get step {}. Status: {}, Body: {}",
                        stepikStepId, response.getStatusCode(), response.getBody());
                throw new StepikStepIntegrationException("Failed to get step " + stepikStepId +
                        ". Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error getting step {} from Stepik: {}", stepikStepId, e.getMessage());
            throw new StepikStepIntegrationException("Failed to get step " + stepikStepId +
                    " from Stepik: " + e.getMessage());
        }
    }
}