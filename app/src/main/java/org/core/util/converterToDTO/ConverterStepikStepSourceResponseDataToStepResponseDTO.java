package org.core.util.converterToDTO;

import lombok.RequiredArgsConstructor;
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
import org.core.util.CleanerHtmlTags;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class ConverterStepikStepSourceResponseDataToStepResponseDTO {

    private final CleanerHtmlTags cleanerTags;

    public StepResponseDTO convert(StepikStepSourceResponseData stepikStep, Long localStepId) {
        if (stepikStep == null) {
            return null;
        }

        StepResponseDTO.StepResponseDTOBuilder builder = StepResponseDTO.builder()
                .id(localStepId)
                .lessonId(stepikStep.getLesson())
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
                builder.content(cleanerTags.cleanHtmlTags(textBlock.getText()));
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

