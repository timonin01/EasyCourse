package org.core.service.stepik.section;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.model.CreateModelDTO;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.model.UpdateModelDTO;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.exception.exceptions.StepikSectionIntegrationException;
import org.core.service.crud.CourseService;
import org.core.service.crud.ModelService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class SyncAllCourseSectionsFromStepikService {

    @Value("${stepik.api.base-url}")
    private String baseUrl;

    private final StepikSectionService stepikSectionService;
    private final ModelService modelService;
    private final CourseService courseService;

    public List<ModelResponseDTO> syncAllCourseSectionFromStepik(Long courseId) {
        CourseResponseDTO course = courseService.getCourseByCourseId(courseId);
        if (course.getStepikCourseId() == null) {
            throw new StepikSectionIntegrationException("Course " + courseId + " is not synced with Stepik (no stepikCourseId)");
        }

        Long stepikCourseId = course.getStepikCourseId();
        try {
            List<Long> sectionIds = stepikSectionService.getCourseSectionIds(stepikCourseId);

            List<ModelResponseDTO> syncedModels = new ArrayList<>();
            List<ModelResponseDTO> localModels = modelService.getCourseModelsByCourseId(courseId);
            for (Long sectionId : sectionIds) {
                try {
                    log.info("Processing section {} from course {}", sectionId, stepikCourseId);
                    StepikSectionResponseData stepikSection = stepikSectionService.getSectionByStepikId(sectionId);
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

        ModelResponseDTO model = modelService.createModule(createDTO);
        modelService.updateModelStepikSectionId(model.getId(), stepikSection.getId());

        if (!stepikSection.getPosition().equals(model.getPosition())) {
            UpdateModelDTO updateDTO = new UpdateModelDTO();
            updateDTO.setModelId(model.getId());
            updateDTO.setPosition(stepikSection.getPosition());
            model = modelService.updateModel(updateDTO);
        }

        return modelService.getModelBuModelId(model.getId());
    }
}
