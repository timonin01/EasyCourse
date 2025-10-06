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
                .filter(s -> s.getStepikStepId() != null && !s.getId().equals(step.getId()))
                .toList();

        StepikStepSourceResponseData currentStepikData = stepikStepService.getStepikStepById(step.getStepikStepId());;

        Integer oldPosition = currentStepikData.getPosition();
        if (newPosition < oldPosition) {
            stepRepository.incrementPositionsFromTo(lessonId, newPosition, oldPosition - 1);
            shiftStepsDownInStepik(stepsByLesson, newPosition, oldPosition - 1);
            stepService.updateStep(createUpdateDTO(step.getId(), newPosition));
            stepikStepService.updateStep(step.getStepikStepId());
        } else if (newPosition > oldPosition) {
            stepRepository.decrementPositionsFromTo(lessonId, oldPosition + 1, newPosition);
            shiftStepsUpInStepik(stepsByLesson, oldPosition + 1, newPosition);
            stepService.updateStep(createUpdateDTO(step.getId(), newPosition));
            stepikStepService.updateStep(step.getStepikStepId());
        } else {
            stepService.updateStep(createUpdateDTO(step.getId(), newPosition));
            stepikStepService.updateStep(step.getStepikStepId());
        }

        return stepikStepService.getStepikStepById(step.getStepikStepId());
    }


    private void shiftStepsDownInStepik(List<StepResponseDTO> steps, Integer fromPosition, Integer toPosition) {
        for (StepResponseDTO stepDTO : steps) {
            try {
                StepikStepSourceResponseData stepikData = stepikStepService.getStepikStepById(stepDTO.getStepikStepId());
                Integer originalPosition = stepikData.getPosition();
                
                if (originalPosition >= fromPosition && originalPosition <= toPosition) {

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

    private void shiftStepsUpInStepik(List<StepResponseDTO> steps, Integer fromPosition, Integer toPosition) {
        for (StepResponseDTO stepDTO : steps) {
            try {
                StepikStepSourceResponseData stepikData = stepikStepService.getStepikStepById(stepDTO.getStepikStepId());
                Integer originalPosition = stepikData.getPosition();
                
                if (originalPosition >= fromPosition && originalPosition <= toPosition) {

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

    @Transactional
    public void performStepikPositionShiftAfterDeletion(Long lessonId, Integer deletedPosition) {
        List<StepResponseDTO> stepsByLesson = stepService.getLessonStepsByLessonId(lessonId).stream()
                .filter(s -> s.getStepikStepId() != null)
                .filter(s -> s.getPosition() > deletedPosition)
                .toList();

        for (StepResponseDTO stepDTO : stepsByLesson) {
            StepikStepSourceResponseData stepikData = stepikStepService.getStepikStepById(stepDTO.getStepikStepId());
            Integer currentPosition = stepikData.getPosition();
            Integer newPosition = currentPosition - 1;

            log.info("Shifting step {} in Stepik from position {} to {}",
                    stepDTO.getId(), currentPosition, newPosition);

            stepService.updateStep(createUpdateDTO(stepDTO.getId(), newPosition));
            stepikStepService.updateStep(stepDTO.getStepikStepId());
        }
    }

    private UpdateStepDTO createUpdateDTO(Long stepId, Integer position) {
        UpdateStepDTO updateDTO = new UpdateStepDTO();
        updateDTO.setStepId(stepId);
        updateDTO.setPosition(position);
        return updateDTO;
    }
}
