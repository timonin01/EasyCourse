package org.core.service.stepik.unit;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.unit.StepikUnitRequest;
import org.core.dto.stepik.unit.StepikUnitRequestData;
import org.core.dto.stepik.unit.StepikUnitResponse;
import org.core.dto.stepik.unit.StepikUnitResponseData;
import org.core.exception.exceptions.StepikUnitIntegrationException;
import org.core.util.HeaderBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.core.annotation.RequiresStepikToken;

import java.util.List;

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

    @RequiresStepikToken
    public StepikUnitResponse createUnit(Long stepikLessonId, Long stepikSectionId, Integer position) {
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
            if (response.getBody() != null && response.getBody().getUnits() != null && !response.getBody().getUnits().isEmpty()) {
                log.info("Successfully created unit in Stepik with ID: {}", response.getBody().getUnits().get(0).getId());
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

    @RequiresStepikToken
    public StepikUnitResponseData getUnitByLessonId(Long stepikLessonId) {
        try {
            String url = baseUrl + "/units?lesson=" + stepikLessonId;
            
            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            
            log.info("Sending GET request to: {}", url);
            
            ResponseEntity<StepikUnitResponse> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, StepikUnitResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<StepikUnitResponseData> units = response.getBody().getUnits();
                if (units != null && !units.isEmpty()) {
                    StepikUnitResponseData unit = units.get(0);
                    log.info("Successfully retrieved unit for lesson ID: {}, unit ID: {}, position: {}", 
                            stepikLessonId, unit.getId(), unit.getPosition());
                    return unit;
                } else throw new StepikUnitIntegrationException("No units found for lesson ID: " + stepikLessonId);
            } else {
                log.error("Failed to get unit. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new StepikUnitIntegrationException("Failed to get unit for lesson ID: " + stepikLessonId + ". Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error getting unit for lesson ID {}: {}", stepikLessonId, e.getMessage());
            throw new StepikUnitIntegrationException("Failed to get unit for lesson ID " + stepikLessonId + ": " + e.getMessage(), e);
        }
    }

    @RequiresStepikToken
    public StepikUnitResponseData updateUnitPosition(Long unitId, Integer newPosition, StepikUnitResponseData currentUnit) {
        try {
            String putUrl = baseUrl + "/units/" + unitId;
            HttpHeaders headers = headerBuilder.createHeaders();
            
            StepikUnitRequestData requestData = new StepikUnitRequestData();
            requestData.setPosition(newPosition);
            requestData.setSection(currentUnit.getSection().toString()); 
            requestData.setLesson(currentUnit.getLesson().toString());

            StepikUnitRequest request = new StepikUnitRequest(requestData);
            HttpEntity<StepikUnitRequest> putEntity = new HttpEntity<>(request, headers);

            ResponseEntity<StepikUnitResponse> putResponse = restTemplate.exchange(
                    putUrl, HttpMethod.PUT, putEntity, StepikUnitResponse.class);

            if (putResponse.getStatusCode().is2xxSuccessful() && putResponse.getBody() != null) {
                List<StepikUnitResponseData> updatedUnits = putResponse.getBody().getUnits();
                if (updatedUnits != null && !updatedUnits.isEmpty()) {
                    StepikUnitResponseData updatedUnit = updatedUnits.get(0);
                    log.info("Successfully updated unit {} position to {}", unitId, newPosition);
                    return updatedUnit;
                } else {
                    throw new StepikUnitIntegrationException("No unit data received from Stepik for unit ID: " + unitId);
                }
            } else {
                log.error("Failed to update unit position. Status: {}, Body: {}", putResponse.getStatusCode(), putResponse.getBody());
                throw new StepikUnitIntegrationException("Failed to update unit position. Status: " + putResponse.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error updating unit {} position: {}", unitId, e.getMessage());
            throw new StepikUnitIntegrationException("Failed to update unit position: " + e.getMessage(), e);
        }
    }
}
