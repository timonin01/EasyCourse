package org.core.service.stepik.section;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.lesson.CreateLessonDTO;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.lesson.UpdateLessonDTO;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.stepik.lesson.StepikLessonResponse;
import org.core.dto.stepik.lesson.StepikLessonResponseData;
import org.core.exception.StepikStepIntegrationException;
import org.core.service.crud.LessonService;
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
public class SyncAllSectionLessonsFromStepikService {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    private final HeaderBuilder headerBuilder;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final LessonService lessonService;
    private final ModelService modelService;

    public List<LessonResponseDTO> syncAllSectionLessonsFromStepik(Long modelId) {
        ModelResponseDTO model = modelService.getModelBuModelId(modelId);
        if (model.getStepikSectionId() == null) {
            throw new StepikStepIntegrationException("Model " + modelId + " is not synced with Stepik (no stepikSectionId)");
        }

        Long sectionId = model.getStepikSectionId();
        try {
            List<Long> unitIds = getSectionUnitIds(sectionId);

            List<LessonResponseDTO> syncedLessons = new ArrayList<>();
            List<LessonResponseDTO> localLessons = lessonService.getModelLessonsByModelId(modelId);
            for (Long unitId : unitIds) {
                try {
                    Long lessonId = getUnitLessonId(unitId);
                    if (lessonId != null) {
                        log.info("Processing lesson {} from unit {}", lessonId, unitId);
                        StepikLessonResponseData stepikLesson = getLessonById(lessonId);
                        LessonResponseDTO syncedLesson = syncSingleLessonFromStepik(modelId, stepikLesson, localLessons);
                        syncedLessons.add(syncedLesson);
                        log.info("Successfully synced lesson {} from Stepik", lessonId);
                    }
                } catch (Exception e) {
                    log.error("Failed to sync lesson from unit {}: {}", unitId, e.getMessage());
                }
            }

            return syncedLessons;
        } catch (Exception e) {
            log.error("Error syncing lessons for section {} from Stepik: {}", sectionId, e.getMessage());
            throw new StepikStepIntegrationException("Failed to sync lessons for section " + sectionId + 
                " from Stepik: " + e.getMessage());
        }
    }

    private List<Long> getSectionUnitIds(Long sectionId) {
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

    private Long getUnitLessonId(Long unitId) {
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

    private StepikLessonResponseData getLessonById(Long lessonId) {
        try {
            String url = baseUrl + "/lessons/" + lessonId;
            HttpHeaders headers = headerBuilder.createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                StepikLessonResponse stepikResponse = objectMapper.readValue(
                        response.getBody(), StepikLessonResponse.class);

                if (stepikResponse.getLesson() != null) {
                    log.info("Successfully retrieved lesson {} from Stepik", lessonId);
                    return stepikResponse.getLesson();
                } else {
                    throw new StepikStepIntegrationException("No lesson data received from Stepik for lesson " + lessonId);
                }
            } else {
                throw new StepikStepIntegrationException("Failed to get lesson " + lessonId +
                        ". Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error getting lesson {} from Stepik: {}", lessonId, e.getMessage());
            throw new StepikStepIntegrationException("Failed to get lesson " + lessonId +
                    " from Stepik: " + e.getMessage());
        }
    }

    private LessonResponseDTO syncSingleLessonFromStepik(Long modelId, StepikLessonResponseData stepikLesson, List<LessonResponseDTO> localLessons) {
        Optional<LessonResponseDTO> localLesson = localLessons.stream()
                .filter(lesson -> lesson.getStepikLessonId() != null && lesson.getStepikLessonId().equals(stepikLesson.getId()))
                .findFirst();

        if (localLesson.isPresent()) {
            log.info("Lesson {} already exists in database, updating it", stepikLesson.getId());
            return updateExistingLessonFromStepik(localLesson.get(), stepikLesson);
        } else {
            log.info("Lesson {} does not exist in database, creating new one", stepikLesson.getId());
            return createNewLessonFromStepik(modelId, stepikLesson);
        }
    }

    private LessonResponseDTO updateExistingLessonFromStepik(LessonResponseDTO existingLesson, StepikLessonResponseData stepikLesson) {
        UpdateLessonDTO updateDTO = new UpdateLessonDTO();
        updateDTO.setLessonId(existingLesson.getId());
        updateDTO.setTitle(stepikLesson.getTitle());
        updateDTO.setPosition(stepikLesson.getPosition());

        return lessonService.updateLesson(updateDTO);
    }

    private LessonResponseDTO createNewLessonFromStepik(Long modelId, StepikLessonResponseData stepikLesson) {
        CreateLessonDTO createDTO = new CreateLessonDTO();
        createDTO.setModelId(modelId);
        createDTO.setTitle(stepikLesson.getTitle());
        createDTO.setPosition(stepikLesson.getPosition());

        LessonResponseDTO lesson = lessonService.createLesson(createDTO);
        lessonService.updateLessonStepikLessonId(lesson.getId(), stepikLesson.getId());

        return lessonService.getLessonByLessonID(lesson.getId());
    }
}
