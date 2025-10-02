package org.core.service.stepik.section;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.model.CreateModelDTO;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.model.UpdateModelDTO;
import org.core.dto.stepik.section.StepikSectionResponse;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.exception.StepikSectionIntegrationException;
import org.core.service.crud.CourseService;
import org.core.service.crud.ModelService;
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
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class SyncAllCourseSectionsFromStepikService {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    private final HeaderBuilder headerBuilder;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final ModelService modelService;
    private final CourseService courseService;

    public List<ModelResponseDTO> syncAllCourseSectionFromStepik(Long courseId) {
        CourseResponseDTO course = courseService.getCourseByCourseId(courseId);
        if (course.getStepikCourseId() == null) {
            throw new StepikSectionIntegrationException("Course " + courseId + " is not synced with Stepik (no stepikCourseId)");
        }

        Long stepikCourseId = course.getStepikCourseId();
        try {
            List<Long> sectionIds = getCourseSectionIds(stepikCourseId);

            List<ModelResponseDTO> syncedModels = new ArrayList<>();
            List<ModelResponseDTO> localModels = modelService.getCourseModelsByCourseId(courseId);
            for (Long sectionId : sectionIds) {
                try {
                    log.info("Processing section {} from course {}", sectionId, stepikCourseId);
                    StepikSectionResponseData stepikSection = getSectionById(sectionId);
                    ModelResponseDTO syncedModel = syncSingleSectionFromStepik(courseId, stepikSection, localModels);
                    syncedModels.add(syncedModel);
                } catch (Exception e) {
                    log.error("Failed to sync section {}: {}", sectionId, e.getMessage());
                }
            }
            log.info("Successfully synced {}/{} sections for course {} from Stepik",
                    syncedModels.size(), sectionIds.size(), stepikCourseId);
            return syncedModels;
        } catch (Exception e) {
            log.error("Error syncing sections for course {} from Stepik: {}", stepikCourseId, e.getMessage());
            throw new StepikSectionIntegrationException("Failed to sync sections for course " + stepikCourseId +
                    " from Stepik: " + e.getMessage());
        }
    }

    private List<Long> getCourseSectionIds(Long stepikCourseId) {
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

    private StepikSectionResponseData getSectionById(Long sectionId) {
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

    private ModelResponseDTO syncSingleSectionFromStepik(Long courseId, StepikSectionResponseData stepikSection, List<ModelResponseDTO> localModels) {
        Optional<ModelResponseDTO> localModel = localModels.stream()
                .filter(model -> model.getStepikSectionId() != null && model.getStepikSectionId().equals(stepikSection.getId()))
                .findFirst();

        if (localModel.isPresent()) {
            log.info("Section {} already exists in database, updating it", stepikSection.getId());
            return updateExistingModelFromStepik(localModel.get(), stepikSection);
        } else {
            log.info("Section {} does not exist in database, creating new one", stepikSection.getId());
            return createNewModelFromStepik(courseId, stepikSection);
        }
    }

    private ModelResponseDTO updateExistingModelFromStepik(ModelResponseDTO existingModel, StepikSectionResponseData stepikSection) {
        UpdateModelDTO updateDTO = new UpdateModelDTO();
        updateDTO.setModelId(existingModel.getId());
        updateDTO.setTitle(stepikSection.getTitle());
        updateDTO.setDescription(stepikSection.getDescription());
        updateDTO.setPosition(stepikSection.getPosition());

        return modelService.updateModel(updateDTO);
    }

    private ModelResponseDTO createNewModelFromStepik(Long courseId, StepikSectionResponseData stepikSection) {
        CreateModelDTO createDTO = new CreateModelDTO();
        createDTO.setCourseId(courseId);
        createDTO.setTitle(stepikSection.getTitle());
        
        createDTO.setDescription(stepikSection.getDescription() != null && !stepikSection.getDescription().trim().isEmpty()
                ? stepikSection.getDescription() : stepikSection.getTitle());
        createDTO.setPosition(stepikSection.getPosition());

        ModelResponseDTO model = modelService.createModule(createDTO);
        modelService.updateModelStepikSectionId(model.getId(), stepikSection.getId());

        return modelService.getModelBuModelId(model.getId());
    }
}
