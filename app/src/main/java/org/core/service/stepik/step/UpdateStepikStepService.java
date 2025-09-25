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
import org.core.exception.StepikStepIntegrationException;
import org.core.repository.LessonRepository;
import org.core.service.crud.StepService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UpdateStepikStepService {

    private final StepService stepService;
    private final StepikStepService stepikStepService;
    private final LessonRepository lessonRepository;

    public StepikStepSourceResponseData performStepikPositionShift(Step step, Long lessonId) {
        log.info("Performing Stepik position shift for step {} to position {}", step.getId(), step.getPosition());

        if (step.getStepikStepId() == null) {
            throw new StepikStepIntegrationException("Step must have stepikStepId for position shift");
        }

        List<StepResponseDTO> stepikSteps = stepService.getLessonStepsByLessonId(lessonId).stream()
                .filter(s -> s.getStepikStepId() != null)
                .sorted((s1, s2) -> Integer.compare(s1.getPosition(), s2.getPosition()))
                .toList();

        StepResponseDTO currentStepDTO = stepikSteps.stream()
                .filter(s -> s.getId().equals(step.getId()))
                .findFirst()
                .orElse(null);
        if (currentStepDTO == null) {
            throw new StepikStepIntegrationException("Current step not found in lesson steps");
        }

        Integer oldPosition = currentStepDTO.getPosition();
        Integer newPosition = step.getPosition();

        log.info("Position change: old={}, new={}", oldPosition, newPosition);

        if (newPosition < oldPosition) {
            shiftStepsDownInDatabase(stepikSteps, newPosition, oldPosition - 1, step.getId());
            stepService.updateStep(createUpdateDTO(step.getId(), newPosition));
            shiftStepsDownInStepik(stepikSteps, newPosition, oldPosition - 1, step.getId());
        } else if (newPosition > oldPosition) {
            shiftStepsUpInDatabase(stepikSteps, oldPosition + 1, newPosition, step.getId());
            stepService.updateStep(createUpdateDTO(step.getId(), newPosition));
            shiftStepsUpInStepik(stepikSteps, oldPosition + 1, newPosition, step.getId());
        } else {
            stepService.updateStep(createUpdateDTO(step.getId(), newPosition));
        }
        
        StepikStepSourceResponse response = stepikStepService.updateStep(step.getStepikStepId());

        log.info("Stepik position shift completed for step {} to position {}", step.getId(), newPosition);
        return response.getStepSource();
    }

    private void shiftStepsDownInDatabase(List<StepResponseDTO> steps, Integer fromPosition, Integer toPosition, Long excludeStepId) {
        log.info("Shifting steps down in database from position {} to {}", fromPosition, toPosition);

        for (StepResponseDTO stepDTO : steps) {
            if (stepDTO.getPosition() >= fromPosition && stepDTO.getPosition() <= toPosition
                    && !stepDTO.getId().equals(excludeStepId)) {

                Integer newPosition = stepDTO.getPosition() + 1;
                log.info("Updating step {} position in database from {} to {}",
                        stepDTO.getId(), stepDTO.getPosition(), newPosition);

                stepService.updateStep(createUpdateDTO(stepDTO.getId(), newPosition));
            }
        }
    }

    private void shiftStepsUpInDatabase(List<StepResponseDTO> steps, Integer fromPosition, Integer toPosition, Long excludeStepId) {
        log.info("Shifting steps up in database from position {} to {}", fromPosition, toPosition);

        for (StepResponseDTO stepDTO : steps) {
            if (stepDTO.getPosition() >= fromPosition && stepDTO.getPosition() <= toPosition
                    && !stepDTO.getId().equals(excludeStepId)) {

                Integer newPosition = stepDTO.getPosition() - 1;
                log.info("Updating step {} position in database from {} to {}",
                        stepDTO.getId(), stepDTO.getPosition(), newPosition);

                stepService.updateStep(createUpdateDTO(stepDTO.getId(), newPosition));
            }
        }
    }

    private void shiftStepsDownInStepik(List<StepResponseDTO> steps, Integer fromPosition, Integer toPosition, Long excludeStepId) {
        log.info("Shifting steps down in Stepik from position {} to {}", fromPosition, toPosition);

        for (StepResponseDTO stepDTO : steps) {
            if (stepDTO.getPosition() >= fromPosition && stepDTO.getPosition() <= toPosition
                    && !stepDTO.getId().equals(excludeStepId)) {

                Integer newPosition = stepDTO.getPosition() + 1;
                log.info("Updating step {} position in Stepik from {} to {}",
                        stepDTO.getId(), stepDTO.getPosition(), newPosition);

                try {
                    stepikStepService.updateStep(stepDTO.getStepikStepId());
                } catch (Exception e) {
                    log.error("Failed to update step {} in Stepik: {}", stepDTO.getId(), e.getMessage());
                    throw new StepikStepIntegrationException("Failed to update step " + stepDTO.getId() + " in Stepik: " + e.getMessage());
                }
            }
        }
    }

    private void shiftStepsUpInStepik(List<StepResponseDTO> steps, Integer fromPosition, Integer toPosition, Long excludeStepId) {
        log.info("Shifting steps up in Stepik from position {} to {}", fromPosition, toPosition);

        for (StepResponseDTO stepDTO : steps) {
            if (stepDTO.getPosition() >= fromPosition && stepDTO.getPosition() <= toPosition
                    && !stepDTO.getId().equals(excludeStepId)) {

                Integer newPosition = stepDTO.getPosition() - 1;
                log.info("Updating step {} position in Stepik from {} to {}",
                        stepDTO.getId(), stepDTO.getPosition(), newPosition);

                try {
                    stepikStepService.updateStep(stepDTO.getStepikStepId());
                } catch (Exception e) {
                    log.error("Failed to update step {} in Stepik: {}", stepDTO.getId(), e.getMessage());
                    throw new StepikStepIntegrationException("Failed to update step " + stepDTO.getId() + " in Stepik: " + e.getMessage());
                }
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
