package org.core.service.stepik.step;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Step;
import org.core.dto.stepik.step.*;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
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

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikStepService {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    private final StepRepository stepRepository;
    private final HeaderBuilder headerBuilder;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public StepikStepSourceResponse createStep(Step step) {
        log.info("Creating step in Stepik for step ID: {}", step.getId());
        
        StepikStepSourceRequestData requestData = createRequestDataForCreate(step);
        StepikStepSourceRequest request = new StepikStepSourceRequest(requestData);
        
        try {
            String url = baseUrl + "/step-sources";

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<StepikStepSourceRequest> entity = new HttpEntity<>(request, headers);
            try {
                String requestJson = objectMapper.writeValueAsString(request);
                log.info("Sending request to Stepik: URL={}, Headers={}, Body={}", url, headers, requestJson);
            } catch (Exception e) {
                log.info("Sending request to Stepik: URL={}, Headers={}, Body={}", url, headers, request);
            }
            ResponseEntity<String> rawResponse = restTemplate.exchange(
                url, HttpMethod.POST, entity, String.class);
            
            log.info("Raw Stepik response: {}", rawResponse.getBody());
            
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
        log.info("Updating step in Stepik with stepikStepId: {}", stepikStepId);

        Step step = stepRepository.findByStepikStepId(stepikStepId);

        StepikStepSourceRequest request = new StepikStepSourceRequest(createRequestDataForUpdate(step));
        try {
            String url = baseUrl + "/step-sources/" + stepikStepId;

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<StepikStepSourceRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<StepikStepSourceResponse> response = restTemplate.exchange(
                url, HttpMethod.PUT, entity, StepikStepSourceResponse.class);
            
            log.info("Response status: {}", response.getStatusCode());
            log.info("Response body: {}", response.getBody());
            
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
        log.info("Deleting step in Stepik with stepikStepId: {}", stepikStepId);
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
    
    public boolean stepExistsInStepik(Long stepikStepId) {
        try {
            String url = baseUrl + "/step-sources/" + stepikStepId;
            
            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, String.class);
            
            boolean exists = response.getStatusCode().is2xxSuccessful();
            log.info("Step {} exists in Stepik: {}", stepikStepId, exists);
            return exists;
        } catch (Exception e) {
            log.error("Error checking if step {} exists in Stepik: {}", stepikStepId, e.getMessage());
            return false;
        }
    }
    
    private StepikStepSourceRequestData createRequestDataForCreate(Step step) {
        StepikStepSourceRequestData requestData = new StepikStepSourceRequestData();
        requestData.setLesson(step.getLesson().getStepikLessonId().toString());
        requestData.setPosition(step.getPosition());
        requestData.setCost(step.getCost() != null ? step.getCost().intValue() : 0);
        requestData.setStatus("ready");
        requestData.setIsEnabled(true);

        try {
            if (step.getStepikBlockData() != null && !step.getStepikBlockData().trim().isEmpty()) {
                StepikBlockRequest stepikBlockRequest = objectMapper.readValue(step.getStepikBlockData(), StepikBlockRequest.class);
                requestData.setBlock(stepikBlockRequest);
            } else {
                log.warn("No stepikBlockData found for step ID: {}, creating default text block", step.getId());
                StepikBlockTextRequest defaultBlock = new StepikBlockTextRequest();
                defaultBlock.setText(step.getContent());
                requestData.setBlock(defaultBlock);
            }
        } catch (JsonProcessingException e) {
            log.error("Error parsing stepikBlockData for step ID: {}: {}", step.getId(), e.getMessage());
            throw new StepikStepIntegrationException("Failed to parse stepikBlockData: " + e.getMessage());
        }
        
        return requestData;
    }

    private StepikStepSourceRequestData createRequestDataForUpdate(Step step) {
        StepikStepSourceRequestData requestData = new StepikStepSourceRequestData();
        requestData.setLesson(step.getLesson().getStepikLessonId().toString());
        requestData.setPosition(step.getPosition());
        requestData.setCost(step.getCost() != null ? step.getCost().intValue() : 0);
        requestData.setStatus("ready");
        requestData.setIsEnabled(true);

        try {
            if (step.getStepikBlockData() != null && !step.getStepikBlockData().trim().isEmpty()) {
                StepikBlockRequest stepikBlockRequest = objectMapper.readValue(step.getStepikBlockData(), StepikBlockRequest.class);
                requestData.setBlock(stepikBlockRequest);
            } else {
                log.warn("No stepikBlockData found for step ID: {}, creating default text block", step.getId());
                StepikBlockTextRequest defaultBlock = new StepikBlockTextRequest();
                defaultBlock.setText(step.getContent());
                requestData.setBlock(defaultBlock);
            }
        } catch (JsonProcessingException e) {
            log.error("Error parsing stepikBlockData for step ID: {}: {}", step.getId(), e.getMessage());
            throw new StepikStepIntegrationException("Failed to parse stepikBlockData: " + e.getMessage());
        }
        
        return requestData;
    }
}