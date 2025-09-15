package org.core.service.stepik.unit;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.unit.StepikUnitRequest;
import org.core.dto.stepik.unit.StepikUnitRequestData;
import org.core.dto.stepik.unit.StepikUnitResponse;
import org.core.exception.StepikUnitIntegrationException;
import org.core.util.HeaderBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikUnitService {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    @Value("${stepik.api.token}")
    private String stepikAccessToken;

    private final HeaderBuilder headerBuilder;
    private final RestTemplate restTemplate;

    public StepikUnitResponse createUnit(Long stepikLessonId, Long stepikSectionId, Integer position) {
        log.info("Creating unit in Stepik: lessonId={}, sectionId={}, position={}", 
                stepikLessonId, stepikSectionId, position);
        
        StepikUnitRequestData requestData = new StepikUnitRequestData();
        requestData.setLesson(stepikLessonId.toString());
        requestData.setSection(stepikSectionId.toString());
        requestData.setPosition(position);
        
        StepikUnitRequest request = new StepikUnitRequest(requestData);
        try {
            String url = baseUrl + "/units";
            HttpEntity<StepikUnitRequest> entity = new HttpEntity<>(request, headerBuilder.createHeaders());
            
            log.info("Sending unit creation request to: {}", url);
            log.info("Request data: lesson={}, section={}, position={}", 
                    requestData.getLesson(), requestData.getSection(), requestData.getPosition());
            
            ResponseEntity<StepikUnitResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, StepikUnitResponse.class);
            
            log.info("Unit creation response status: {}", response.getStatusCode());
            log.info("Unit creation response body: {}", response.getBody());
            if (response.getBody() != null && response.getBody().getUnit() != null) {
                log.info("Successfully created unit in Stepik with ID: {}", response.getBody().getUnit().getId());
            } else {
                log.error("Unit data is null in response from Stepik");
                throw new StepikUnitIntegrationException("No unit data received from Stepik");
            }
            return response.getBody();
        } catch (Exception e) {
            log.error("Error creating unit in Stepik: {}", e.getMessage());
            throw new StepikUnitIntegrationException("Failed to create unit in Stepik: " + e.getMessage(), e);
        }
    }
}
