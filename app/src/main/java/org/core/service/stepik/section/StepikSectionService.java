package org.core.service.stepik.section;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Model;
import org.core.dto.stepik.section.StepikSectionRequest;
import org.core.dto.stepik.section.StepikSectionResponse;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.exception.StepikSectionIntegrationException;
import org.core.util.HeaderBuilder;
import org.core.util.StepikSectionRequestDataBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikSectionService {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    private final StepikSectionRequestDataBuilder stepikSectionRequestDataBuilder;
    private final HeaderBuilder headerBuilder;
    private final RestTemplate restTemplate;

    public StepikSectionResponse createSection(Model model) {
        try {
            String url = baseUrl + "/sections";

            StepikSectionRequest request = new StepikSectionRequest(stepikSectionRequestDataBuilder
                    .createRequestDataForCreation(model));

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<StepikSectionRequest> entity = new HttpEntity<>(request, headers);
            ResponseEntity<StepikSectionResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, StepikSectionResponse.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                StepikSectionResponseData responseData = response.getBody().getSection();
                log.info("Section created in Stepik with ID: {}", responseData.getId());
                return response.getBody();
            } else {
                throw new StepikSectionIntegrationException("Failed to create section in Stepik");
            }
        } catch (Exception e) {
            log.error("Error creating section in Stepik: {}", e.getMessage());
            throw new StepikSectionIntegrationException("Failed to create section in Stepik: " + e.getMessage());
        }
    }

    public StepikSectionResponse updateSection(Long sectionId, Model model) {
        try {
            String url = baseUrl + "/sections/" + sectionId;
            log.info("Updating section {} in Stepik with URL: {}", sectionId, url);

            StepikSectionRequest request = new StepikSectionRequest(stepikSectionRequestDataBuilder
                    .createRequestDataForUpdate(model));
            log.info("Request data for section update: {}", request);

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<StepikSectionRequest> entity = new HttpEntity<>(request, headers);
            
            log.info("Sending PUT request to Stepik API...");
            ResponseEntity<StepikSectionResponse> response = restTemplate.exchange(
                    url, HttpMethod.PUT, entity, StepikSectionResponse.class);

            log.info("Stepik response status: {}", response.getStatusCode());
            log.info("Stepik response body: {}", response.getBody());

            if ((response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) && response.getBody() != null) {
                StepikSectionResponseData responseData = response.getBody().getSection();
                if (responseData != null) {
                    log.info("Section updated in Stepik with ID: {} - Title: '{}', Position: {} (Status: {})", 
                            responseData.getId(), responseData.getTitle(), responseData.getPosition(), response.getStatusCode());
                    return response.getBody();
                } else {
                    log.error("Section data is null in update response. Full response: {}", response.getBody());
                    throw new StepikSectionIntegrationException("No section data in Stepik update response");
                }
            } else {
                log.error("Unexpected response status: {} or null body", response.getStatusCode());
                throw new StepikSectionIntegrationException("Failed to update section in Stepik - Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error updating section in Stepik: {}", e.getMessage(), e);
            throw new StepikSectionIntegrationException("Failed to update section in Stepik: " + e.getMessage());
        }
    }

    public void deleteSection(Long sectionId) {
        try {
            String url = baseUrl + "/sections/" + sectionId;

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Void> response = restTemplate.exchange(
                    url, HttpMethod.DELETE, entity, Void.class);
            if (response.getStatusCode() == HttpStatus.NO_CONTENT) {
                log.info("Section deleted from Stepik with ID: {}", sectionId);
            } else {
                throw new StepikSectionIntegrationException("Failed to delete section in Stepik");
            }
        } catch (Exception e) {
            log.error("Error deleting section in Stepik: {}", e.getMessage());
            throw new StepikSectionIntegrationException("Failed to delete section in Stepik: " + e.getMessage());
        }
    }

}