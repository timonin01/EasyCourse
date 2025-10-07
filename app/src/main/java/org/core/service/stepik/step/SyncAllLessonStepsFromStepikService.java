package org.core.service.stepik.step;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.StepType;
import org.core.dto.step.CreateStepDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.step.UpdateStepDTO;
import org.core.dto.stepik.step.StepikBlockResponse;
import org.core.dto.stepik.step.StepikStepSourceResponseData;
import org.core.dto.stepik.step.test.choise.response.StepikBlockChoiceResponse;
import org.core.dto.stepik.step.test.sorting.response.StepikBlockSortingResponse;
import org.core.dto.stepik.step.text.StepikBlockTextResponse;
import org.core.exception.LessonNotFoundException;
import org.core.exception.StepikStepIntegrationException;
import org.core.repository.LessonRepository;
import org.core.service.crud.StepService;
import org.core.service.stepik.step.convereter.ConverterStepikStepBlockResponseToRequest;
import org.core.util.CleanerHtmlTags;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class SyncAllLessonStepsFromStepikService {

    private final ConverterStepikStepBlockResponseToRequest converter;
    private final CleanerHtmlTags cleanerTags;
    private final StepikStepService stepikStepService;
    private final StepService stepService;
    private final LessonRepository lessonRepository;

    public List<StepResponseDTO> syncAllLessonStepsFromStepik(Long lessonId) {
        log.info("Starting sync of all steps for lesson {} from Stepik", lessonId);

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found with ID: " + lessonId));
        if (lesson.getStepikLessonId() == null) {
            throw new StepikStepIntegrationException("Lesson " + lessonId + " is not synced with Stepik (no stepikLessonId)");
        }

        log.info("Lesson {} has stepikLessonId: {}", lessonId, lesson.getStepikLessonId());
        try {
            List<Long> stepikSteps = stepikStepService.getLessonStepIdsFromStepik(lesson.getStepikLessonId());
            List<StepResponseDTO> localSteps = stepService.getLessonStepsByLessonId(lessonId);

            List<StepResponseDTO> syncedSteps = new ArrayList<>();
            for (Long stepId : stepikSteps) {
                try {
                    StepikStepSourceResponseData stepikStepData = stepikStepService.getStepikStepById(stepId);
                    StepResponseDTO syncedStep = syncSingleStepFromStepik(lessonId, stepikStepData, localSteps);
                    syncedSteps.add(syncedStep);
                    log.info("Successfully synced step {} from Stepik", stepId);
                } catch (Exception e) {
                    log.error("Failed to sync step {} from Stepik: {}", stepId, e.getMessage());
                }
            }

            log.info("Successfully synced {}/{} steps for lesson {} from Stepik",
                    syncedSteps.size(), stepikSteps.size(), lessonId);
            return syncedSteps;
        } catch (Exception e) {
            log.error("Error syncing steps for lesson {} from Stepik: {}", lessonId, e.getMessage());
            throw new StepikStepIntegrationException("Failed to sync steps for lesson " + lessonId +
                    " from Stepik: " + e.getMessage());
        }
    }

    private StepResponseDTO syncSingleStepFromStepik(Long lessonId, StepikStepSourceResponseData stepikStep, List<StepResponseDTO> localSteps) {
        Optional<StepResponseDTO> localStep = localSteps.stream()
                .filter(step -> step.getStepikStepId() != null && step.getStepikStepId().equals(stepikStep.getId()))
                .findFirst();

        if (localStep.isPresent()) {
            log.info("Step {} already exists in database, updating it", stepikStep.getId());
            return updateExistingStepFromStepik(localStep.get(), stepikStep);
        } else {
            log.info("Step {} does not exist in database, creating new one", stepikStep.getId());
            return createNewStepFromStepik(lessonId, stepikStep);
        }
    }

    private StepResponseDTO updateExistingStepFromStepik(StepResponseDTO existingStep, StepikStepSourceResponseData stepikStep) {
        UpdateStepDTO updateDTO = new UpdateStepDTO();
        updateDTO.setStepId(existingStep.getId());
        updateDTO.setPosition(stepikStep.getPosition());
        updateDTO.setCost(stepikStep.getCost() != null ? stepikStep.getCost() : 0L);

        if (stepikStep.getBlock() != null) {
            updateDTO.setType(qualifiedStepTypeFromBlock(stepikStep.getBlock()));
            updateDTO.setStepikBlock(converter.convertResponseToRequest(stepikStep.getBlock()));

            if (stepikStep.getBlock() instanceof StepikBlockTextResponse textBlock) {
                updateDTO.setContent(cleanerTags.cleanHtmlTags(textBlock.getText()));
            }
        }

        return stepService.updateStep(updateDTO);
    }

    private StepResponseDTO createNewStepFromStepik(Long lessonId, StepikStepSourceResponseData stepikStep) {
        CreateStepDTO createDTO = new CreateStepDTO();
        createDTO.setLessonId(lessonId);
        createDTO.setCost(stepikStep.getCost() != null ? stepikStep.getCost() : 0L);
        createDTO.setStepikStepId(stepikStep.getId());

        if (stepikStep.getBlock() != null) {
            createDTO.setType(qualifiedStepTypeFromBlock(stepikStep.getBlock()));
            createDTO.setStepikBlock(converter.convertResponseToRequest(stepikStep.getBlock()));

            if (stepikStep.getBlock() instanceof StepikBlockTextResponse textBlock) {
                createDTO.setContent(cleanerTags.cleanHtmlTags(textBlock.getText()));
            }
        } else {
            createDTO.setType(StepType.TEXT);
        }

        StepResponseDTO step = stepService.createStep(createDTO);

        if (!stepikStep.getPosition().equals(step.getPosition())) {
            UpdateStepDTO updateDTO = new UpdateStepDTO();
            updateDTO.setStepId(step.getId());
            updateDTO.setPosition(stepikStep.getPosition());
            step = stepService.updateStep(updateDTO);
        }

        return step;
    }

    private StepType qualifiedStepTypeFromBlock(StepikBlockResponse block) {
        if (block instanceof StepikBlockTextResponse) {
            return StepType.TEXT;
        } else if (block instanceof StepikBlockChoiceResponse) {
            return StepType.CHOICE;
        } else if (block instanceof StepikBlockSortingResponse) {
            return StepType.SORTING;
        } else {
            throw new StepikStepIntegrationException("Unknown StepType in step");
        }
    }
}
