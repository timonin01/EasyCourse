package org.core.service.stepik.step;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.Step;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.step.UpdateStepDTO;
import org.core.dto.stepik.step.StepikStepSourceResponse;
import org.core.dto.stepik.step.StepikStepSourceResponseData;
import org.core.exception.exceptions.StepikStepIntegrationException;
import org.core.repository.LessonRepository;
import org.core.repository.StepRepository;
import org.core.service.crud.StepService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikStepSyncService {

    private final UpdateStepikStepService updateStepikStepService;
    private final StepikStepService stepikStepService;
    private final StepService stepService;
    private final LessonRepository lessonRepository;

    public StepikStepSourceResponseData syncStepWithStepik(Long stepId) {
        StepResponseDTO stepDTO = stepService.getStepById(stepId);
        Step step = mapToStep(stepDTO);

        StepikStepSourceResponse response = stepikStepService.createStep(step);
        StepikStepSourceResponseData stepData = response.getStepSource();
        
        if (stepData != null) {
            stepService.updateStep(createUpdateDTO(stepId, stepData.getId()));
            log.info("Step {} successfully synced with Stepik step ID: {}", stepId, stepData.getId());
        }
        return stepData;
    }

    public StepikStepSourceResponseData getStepFromStepikByLocalStepId(Long stepId){
        StepResponseDTO stepDTO = stepService.getStepById(stepId);
        if (stepDTO.getStepikStepId() == null) {
            throw new IllegalStateException("Step is not synced with Stepik. Step ID: " + stepId);
        }

        StepikStepSourceResponseData stepikStepSourceResponseData = stepikStepService.getStepikStepById(stepDTO.getStepikStepId());
        if(stepikStepSourceResponseData == null){
            throw new IllegalArgumentException("Failed to upload step from stepik");
        }
        return stepikStepSourceResponseData;
    }

    public StepikStepSourceResponseData updateStepInStepik(Long stepId) {
        StepResponseDTO stepDTO = stepService.getStepById(stepId);
        if (stepDTO.getStepikStepId() == null) {
            throw new IllegalStateException("Step is not synced with Stepik. Step ID: " + stepId);
        }

        StepikStepSourceResponseData stepikData = stepikStepService.getStepikStepById(stepDTO.getStepikStepId());
        Integer currentStepikPosition = stepikData.getPosition();
        Integer currentDbPosition = stepDTO.getPosition();

        if (currentStepikPosition.equals(currentDbPosition)) {
            log.info("Positions match, performing simple update");
            Step step = mapToStep(stepDTO);
            stepikStepService.updateStep(step.getStepikStepId());
            return stepikStepService.getStepikStepById(step.getStepikStepId());
        }
        Step step = mapToStep(stepDTO);
        step.setPosition(currentStepikPosition);

        try {
            return updateStepikStepService.performStepikPositionShift(step, stepDTO.getLessonId(), currentDbPosition);
        } catch (StepikStepIntegrationException e) {
            log.error("Error updating step in Stepik : {}", e.getMessage());
            throw new StepikStepIntegrationException("Failed to update step in Stepik: " + e.getMessage());
        }
    }

    public void deleteStepFromStepik(Long stepId) {
        StepResponseDTO stepDTO = stepService.getStepById(stepId);
        log.info("Step data: ID={}, Type='{}', StepikStepId={}, Position={}",
                stepDTO.getId(), stepDTO.getType(), stepDTO.getStepikStepId(), stepDTO.getPosition());

        if (stepDTO.getStepikStepId() == null) {
            throw new StepikStepIntegrationException("Step is not synced with Stepik. Step ID: " + stepId);
        }
        Long lessonId = stepDTO.getLessonId();
        Integer deletedPosition = stepDTO.getPosition();

        updateStepikStepService.performStepikPositionShiftAfterDeletion(lessonId, deletedPosition);
        stepikStepService.deleteStep(stepDTO.getStepikStepId());

        stepService.updateStepStepikStepId(stepId, null);
        log.info("Step {} successfully deleted from Stepik with step ID: {}", stepId, stepDTO.getStepikStepId());
    }

    private UpdateStepDTO createUpdateDTO(Long stepId, Long stepikStepId) {
        UpdateStepDTO updateDTO = new UpdateStepDTO();
        updateDTO.setStepId(stepId);
        updateDTO.setStepikStepId(stepikStepId);
        return updateDTO;
    }

    private Step mapToStep(StepResponseDTO stepDTO) {
        Step step = new Step();
        step.setId(stepDTO.getId());
        step.setType(stepDTO.getType());
        step.setContent(stepDTO.getContent());
        step.setPosition(stepDTO.getPosition());
        step.setCost(stepDTO.getCost());
        step.setStepikStepId(stepDTO.getStepikStepId());

        Optional<Lesson> lesson = lessonRepository.findById(stepDTO.getLessonId());
        if (lesson.isEmpty()) {
            throw new IllegalStateException("Lesson not found for step ID: " + stepDTO.getId());
        }
        step.setLesson(lesson.get());
        step.setStepikBlockData(stepDTO.getStepikBlockJson());

        return step;
    }
}