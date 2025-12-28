package org.core.util;

import lombok.RequiredArgsConstructor;
import org.core.domain.Lesson;
import org.core.domain.StepType;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.stepik.step.StepikBlockResponse;
import org.core.dto.stepik.step.StepikStepSourceResponseData;
import org.core.dto.stepik.step.enterWord.fillBlanks.response.StepikBlockFillBlanksResponse;
import org.core.dto.stepik.step.enterWord.freeAnswer.response.StepikBlockFreeAnswerResponse;
import org.core.dto.stepik.step.enterWord.math.response.StepikBlockMathResponse;
import org.core.dto.stepik.step.enterWord.number.response.StepikBlockNumberResponse;
import org.core.dto.stepik.step.enterWord.randomTasks.response.StepikBlockRandomTasksResponse;
import org.core.dto.stepik.step.enterWord.string.response.StepikBlockStringResponse;
import org.core.dto.stepik.step.test.choise.response.StepikBlockChoiceResponse;
import org.core.dto.stepik.step.test.matching.response.StepikBlockMatchingResponse;
import org.core.dto.stepik.step.test.sorting.response.StepikBlockSortingResponse;
import org.core.dto.stepik.step.test.table.response.StepikBlockTableResponse;
import org.core.dto.stepik.step.text.StepikBlockTextResponse;
import org.core.exception.exceptions.StepikStepIntegrationException;
import org.core.repository.LessonRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class ConverterStepikStepSourceResponseDataToStepikResponseDTO {

    private final LessonRepository lessonRepository;
    private final CleanerHtmlTags cleanerHtmlTags;

    public StepResponseDTO convertStepikStepToResponseDTO(StepikStepSourceResponseData stepikStep) {
        Long stepikLessonId = stepikStep.getLesson();
        if (stepikLessonId == null) {
            throw new StepikStepIntegrationException("Stepik step has no lesson ID");
        }

        Lesson localLesson = lessonRepository.findByStepikLessonId(stepikLessonId);
        if (localLesson == null) {
            throw new StepikStepIntegrationException("Local lesson not found for Stepik lesson ID: " + stepikLessonId);
        }
        Long localLessonId = localLesson.getId();
        StepResponseDTO.StepResponseDTOBuilder builder = StepResponseDTO.builder()
                .lessonId(localLessonId)
                .position(stepikStep.getPosition())
                .cost(stepikStep.getCost() != null ? stepikStep.getCost() : 0L)
                .stepikStepId(stepikStep.getId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now());

        if (stepikStep.getBlock() != null) {
            StepType stepType = qualifiedStepTypeFromBlock(stepikStep.getBlock());
            builder.type(stepType);
            builder.stepikBlock(stepikStep.getBlock());

            if (stepikStep.getBlock() instanceof StepikBlockTextResponse textBlock) {
                builder.content(cleanerHtmlTags.cleanHtmlTags(textBlock.getText()));
            } else {
                builder.content(null);
            }
        } else {
            builder.type(StepType.TEXT);
            builder.content(null);
            builder.stepikBlock(null);
        }

        return builder.build();
    }

    private StepType qualifiedStepTypeFromBlock(StepikBlockResponse block) {
        return switch (block) {
            case StepikBlockTextResponse stepikBlockTextResponse -> StepType.TEXT;
            case StepikBlockChoiceResponse stepikBlockChoiceResponse -> StepType.CHOICE;
            case StepikBlockSortingResponse stepikBlockSortingResponse -> StepType.SORTING;
            case StepikBlockMatchingResponse stepikBlockMatchingResponse -> StepType.MATCHING;
            case StepikBlockTableResponse stepikBlockTableResponse -> StepType.TABLE;
            case StepikBlockFillBlanksResponse stepikBlockFillBlanksResponse -> StepType.FILL_BLANK;
            case StepikBlockStringResponse stepikBlockStringResponse -> StepType.STRING;
            case StepikBlockNumberResponse stepikBlockNumberResponse -> StepType.NUMBER;
            case StepikBlockMathResponse stepikBlockMathResponse -> StepType.MATH;
            case StepikBlockFreeAnswerResponse stepikBlockFreeAnswerResponse -> StepType.FREE_ANSWER;
            case StepikBlockRandomTasksResponse stepikBlockRandomTasksResponse -> StepType.RANDOM_TASKS;
            case null, default -> throw new StepikStepIntegrationException("Unknown StepType in step");
        };
    }
}