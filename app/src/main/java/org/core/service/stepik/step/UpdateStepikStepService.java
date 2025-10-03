package org.core.service.stepik.step;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Step;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.step.UpdateStepDTO;
import org.core.dto.stepik.step.StepikStepSourceResponseData;
import org.core.exception.StepikStepIntegrationException;
import org.core.repository.StepRepository;
import org.core.service.crud.StepService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UpdateStepikStepService {

    private final StepService stepService;
    private final StepikStepService stepikStepService;
    private final StepRepository stepRepository;

    @Transactional
    public StepikStepSourceResponseData performStepikPositionShift(Step step, Long lessonId, Integer newPosition) {
        if (step.getStepikStepId() == null) {
            throw new StepikStepIntegrationException("Step must have stepikStepId for position shift");
        }

        List<StepResponseDTO> stepsByLesson = stepService.getLessonStepsByLessonId(lessonId).stream()
                .filter(s -> s.getStepikStepId() != null)
                .toList();

        StepikStepSourceResponseData currentStepikData;
        try {
            currentStepikData = stepikStepService.getStepikStepById(step.getStepikStepId());
        } catch (Exception e) {
            log.error("Current step {} not found in Stepik (stepikStepId: {}): {}", 
                    step.getId(), step.getStepikStepId(), e.getMessage());
            throw new StepikStepIntegrationException("Current step not found in Stepik: " + e.getMessage());
        }
        Integer oldPosition = currentStepikData.getPosition();
        log.info("Original position from Stepik: {}", oldPosition);

        if (newPosition < oldPosition) {
            stepRepository.incrementPositionsFromTo(lessonId, newPosition, oldPosition - 1);
            shiftStepsDownInStepik(stepsByLesson, newPosition, oldPosition - 1, step.getId());
            stepService.updateStep(createUpdateDTO(step.getId(), newPosition));
            stepikStepService.updateStep(step.getStepikStepId());
        } else if (newPosition > oldPosition) {
            stepRepository.decrementPositionsFromTo(lessonId, oldPosition + 1, newPosition);
            shiftStepsUpInStepik(stepsByLesson, oldPosition + 1, newPosition, step.getId());
            stepService.updateStep(createUpdateDTO(step.getId(), newPosition));
            stepikStepService.updateStep(step.getStepikStepId());
        } else {
            stepService.updateStep(createUpdateDTO(step.getId(), newPosition));
            stepikStepService.updateStep(step.getStepikStepId());
        }
        log.info("Stepik position shift completed for step {} to position {}", step.getId(), newPosition);

        return stepikStepService.getStepikStepById(step.getStepikStepId());
    }


    private void shiftStepsDownInStepik(List<StepResponseDTO> steps, Integer fromPosition, Integer toPosition, Long excludeStepId) {
        log.info("Shifting steps down in Stepik from position {} to {}", fromPosition, toPosition);

        for (StepResponseDTO stepDTO : steps) {
            try {
                StepikStepSourceResponseData stepikData = stepikStepService.getStepikStepById(stepDTO.getStepikStepId());
                Integer originalPosition = stepikData.getPosition();
                
                if (originalPosition >= fromPosition && originalPosition <= toPosition
                        && !stepDTO.getId().equals(excludeStepId)) {

                    Integer newPosition = originalPosition + 1;
                    log.info("Updating step {} position in Stepik from {} to {}",
                            stepDTO.getId(), originalPosition, newPosition);
                    
                    stepikStepService.updateStep(stepDTO.getStepikStepId());
                }
            } catch (Exception e) {
                log.warn("Step {} not found in Stepik (stepikStepId: {}), skipping: {}", 
                        stepDTO.getId(), stepDTO.getStepikStepId(), e.getMessage());
            }
        }
    }

    private void shiftStepsUpInStepik(List<StepResponseDTO> steps, Integer fromPosition, Integer toPosition, Long excludeStepId) {
        log.info("Shifting steps up in Stepik from position {} to {}", fromPosition, toPosition);

        for (StepResponseDTO stepDTO : steps) {
            try {
                StepikStepSourceResponseData stepikData = stepikStepService.getStepikStepById(stepDTO.getStepikStepId());
                Integer originalPosition = stepikData.getPosition();
                
                if (originalPosition >= fromPosition && originalPosition <= toPosition
                        && !stepDTO.getId().equals(excludeStepId)) {

                    Integer newPosition = originalPosition - 1;
                    log.info("Updating step {} position in Stepik from {} to {}",
                            stepDTO.getId(), originalPosition, newPosition);
                    
                    stepikStepService.updateStep(stepDTO.getStepikStepId());
                }
            } catch (Exception e) {
                log.warn("Step {} not found in Stepik (stepikStepId: {}), skipping: {}", 
                        stepDTO.getId(), stepDTO.getStepikStepId(), e.getMessage());
            }
        }
    }

    private UpdateStepDTO createUpdateDTO(Long stepId, Integer position) {
        UpdateStepDTO updateDTO = new UpdateStepDTO();
        updateDTO.setStepId(stepId);
        updateDTO.setPosition(position);
        return updateDTO;
    }
}
