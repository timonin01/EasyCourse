package org.core.service.stepik.section;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.annotation.RequiresStepikToken;
import org.core.domain.Section;
import org.core.dto.stepik.section.StepikSectionRequest;
import org.core.dto.stepik.section.StepikSectionResponse;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.exception.exceptions.StepikSectionIntegrationException;
import org.core.repository.SectionRepository;
import org.core.util.HeaderBuilder;
import org.core.util.StepikSectionRequestDataBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikSectionService {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    private final SectionRepository sectionRepository;
    private final StepikSectionRequestDataBuilder stepikSectionRequestDataBuilder;
    private final ObjectMapper objectMapper;
    private final HeaderBuilder headerBuilder;
    private final RestTemplate restTemplate;

    @RequiresStepikToken
    public StepikSectionResponse createSection(Section section) {
        try {
            String url = baseUrl + "/sections";
            StepikSectionRequest request = new StepikSectionRequest(stepikSectionRequestDataBuilder.createRequestDataForCreation(section));

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

    @RequiresStepikToken
    public StepikSectionResponse updateSection(Long sectionId) {
        try {
            Section section = sectionRepository.findByStepikSectionId(sectionId);

            String url = baseUrl + "/sections/" + sectionId;
            StepikSectionRequest request = new StepikSectionRequest(stepikSectionRequestDataBuilder.createRequestDataForUpdate(section));

            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<StepikSectionRequest> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<StepikSectionResponse> response = restTemplate.exchange(
                    url, HttpMethod.PUT, entity, StepikSectionResponse.class);

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

    @RequiresStepikToken
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

    @RequiresStepikToken
    public StepikSectionResponseData getSectionByStepikId(Long sectionId) {
        try {
            String url = baseUrl + "/sections/" + sectionId;
            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                StepikSectionResponse stepikResponse = objectMapper.readValue(
                        response.getBody(), StepikSectionResponse.class);

                if (stepikResponse.getSections() != null && !stepikResponse.getSections().isEmpty()) {
                    log.info("Successfully retrieved section {} from Stepik", sectionId);
                    return stepikResponse.getSections().get(0);
                } else {
                    throw new StepikSectionIntegrationException("No section data received from Stepik for section " + sectionId);
                }
            } else {
                throw new StepikSectionIntegrationException("Failed to get section " + sectionId +
                        ". Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error getting section {} from Stepik: {}", sectionId, e.getMessage());
            throw new StepikSectionIntegrationException("Failed to get section " + sectionId +
                    " from Stepik: " + e.getMessage());
        }
    }

    @RequiresStepikToken
    public List<Long> getCourseSectionIds(Long stepikCourseId) {
        try {
            String url = baseUrl + "/courses/" + stepikCourseId;
            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode coursesArray = root.path("courses");

                if (coursesArray.isArray() && !coursesArray.isEmpty()) {
                    JsonNode courseNode = coursesArray.get(0);
                    JsonNode sectionsArray = courseNode.path("sections");

                    if (sectionsArray.isArray()) {
                        List<Long> sectionIds = new ArrayList<>();
                        for (JsonNode sectionIdNode : sectionsArray) {
                            sectionIds.add(sectionIdNode.asLong());
                        }
                        return sectionIds;
                    }
                }
                throw new StepikSectionIntegrationException("No sections found in course " + stepikCourseId);
            } else {
                throw new StepikSectionIntegrationException("Failed to get course " + stepikCourseId +
                        ". Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error getting section IDs for course {} from Stepik: {}", stepikCourseId, e.getMessage());
            throw new StepikSectionIntegrationException("Failed to get section IDs for course " + stepikCourseId +
                    " from Stepik: " + e.getMessage());
        }
    }

}