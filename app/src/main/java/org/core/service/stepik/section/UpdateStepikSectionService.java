package org.core.service.stepik.section;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Model;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.model.UpdateModelDTO;
import org.core.dto.stepik.section.StepikSectionResponseData;

import org.core.exception.exceptions.StepikSectionIntegrationException;
import org.core.repository.ModelRepository;
import org.core.service.crud.ModelService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UpdateStepikSectionService {

    private final ModelService modelService;
    private final StepikSectionService stepikSectionService;
    private final ModelRepository modelRepository;

    @Transactional
    public StepikSectionResponseData performStepikPositionShift(Model model, Long courseId, Integer newPosition) {
        if (model.getStepikSectionId() == null) {
            throw new StepikSectionIntegrationException("Model must have stepikSectionId for position shift");
        }

        List<ModelResponseDTO> modelsByCourse = modelService.getCourseModelsByCourseId(courseId).stream()
                .filter(m -> m.getStepikSectionId() != null && !model.getId().equals(m.getId()))
                .toList();

        StepikSectionResponseData currentSectionData = stepikSectionService.getSectionByStepikId(model.getStepikSectionId());

        Integer oldPosition = currentSectionData.getPosition();
        if(newPosition < oldPosition){
            modelRepository.incrementPositionsRange(courseId, newPosition, oldPosition - 1);
            shiftStepsDownInStepik(modelsByCourse, newPosition, oldPosition - 1);
            modelService.updateModel(createUpdateDTO(model.getId(), newPosition));
            stepikSectionService.updateSection(model.getStepikSectionId());
        } else if (newPosition > oldPosition) {
            modelRepository.decrementPositionsRange(courseId, oldPosition + 1, newPosition);
            shiftStepsUpInStepik(modelsByCourse, oldPosition + 1, newPosition);
            modelService.updateModel(createUpdateDTO(model.getId(), newPosition));
            stepikSectionService.updateSection(model.getStepikSectionId());
        } else {
            modelService.updateModel(createUpdateDTO(model.getId(), newPosition));
            stepikSectionService.updateSection(model.getStepikSectionId());
        }

        return stepikSectionService.getSectionByStepikId(model.getStepikSectionId());
    }

    private void shiftStepsDownInStepik(List<ModelResponseDTO> models, Integer fromPosition, Integer toPosition) {
        for (ModelResponseDTO modelDTO : models) {
            try {
                StepikSectionResponseData stepikData = stepikSectionService.getSectionByStepikId(modelDTO.getStepikSectionId());
                Integer originalPosition = stepikData.getPosition();

                if (originalPosition >= fromPosition && originalPosition <= toPosition) {

                    Integer newPosition = originalPosition + 1;
                    log.info("Updating model {} position in Stepik from {} to {}",
                            modelDTO.getId(), originalPosition, newPosition);

                    stepikSectionService.updateSection(modelDTO.getStepikSectionId());
                }
            } catch (Exception e) {
                log.warn("Model {} not found in Stepik (modelStepId: {}), skipping: {}",
                        modelDTO.getId(), modelDTO.getStepikSectionId(), e.getMessage());
            }
        }
    }

    private void shiftStepsUpInStepik(List<ModelResponseDTO> models, Integer fromPosition, Integer toPosition) {
        for (ModelResponseDTO modelDTO : models) {
            try {
                StepikSectionResponseData stepikData = stepikSectionService.getSectionByStepikId(modelDTO.getStepikSectionId());
                Integer originalPosition = stepikData.getPosition();

                if (originalPosition >= fromPosition && originalPosition <= toPosition) {

                    Integer newPosition = originalPosition - 1;
                    log.info("Updating model {} position in Stepik from {} to {}",
                            modelDTO.getId(), originalPosition, newPosition);

                    stepikSectionService.updateSection(modelDTO.getStepikSectionId());
                }
            } catch (Exception e) {
                log.warn("Model {} not found in Stepik (modelStepId: {}), skipping: {}",
                        modelDTO.getId(), modelDTO.getStepikSectionId(), e.getMessage());
            }
        }
    }

    @Transactional
    public void performStepikPositionShiftAfterDeletion(Long courseId, Integer deletedPosition) {
        List<ModelResponseDTO> models = modelService.getCourseModelsByCourseId(courseId).stream()
                .filter(m -> m.getStepikSectionId() != null)
                .filter(m -> m.getPosition() > deletedPosition)
                .toList();

        for(ModelResponseDTO modelDTO : models){
            StepikSectionResponseData sectionData = stepikSectionService.getSectionByStepikId(modelDTO.getStepikSectionId());
            Integer currentPosition = modelDTO.getPosition();
            Integer newPosition = currentPosition - 1;

            log.info("Shifting section {} in Stepik from position {} to {}",
                    modelDTO.getId(), currentPosition, newPosition);

            modelService.updateModel(createUpdateDTO(modelDTO.getId(),newPosition));
            stepikSectionService.updateSection(modelDTO.getStepikSectionId());
        }
    }

    private UpdateModelDTO createUpdateDTO(Long modelId, Integer newPosition) {
        UpdateModelDTO updateModelDTO = new UpdateModelDTO();
        updateModelDTO.setModelId(modelId);
        updateModelDTO.setPosition(newPosition);
        return updateModelDTO;
    }

}
