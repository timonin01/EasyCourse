package org.core.dto.step;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.domain.StepType;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.test.choise.request.StepikBlockChoiceRequest;
import org.core.dto.stepik.step.test.matching.request.StepikBlockMatchingRequest;
import org.core.dto.stepik.step.test.sorting.request.StepikBlockSortingRequest;
import org.core.dto.stepik.step.test.table.request.StepikBlockTableRequest;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.core.dto.stepik.step.enterWord.fillBlanks.request.StepikBlockFillBlanksRequest;
import org.core.dto.stepik.step.enterWord.string.request.StepikBlockStringRequest;
import org.core.dto.stepik.step.enterWord.number.request.StepikBlockNumberRequest;
import org.core.dto.stepik.step.enterWord.math.request.StepikBlockMathRequest;
import org.core.dto.stepik.step.enterWord.freeAnswer.request.StepikBlockFreeAnswerRequest;
import org.core.dto.stepik.step.enterWord.randomTasks.request.StepikBlockRandomTasksRequest;
import org.core.dto.stepik.step.code.request.StepikBlockCodeRequest;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateStepDTO {

    @NotNull(message = "LessonId is required")
    private Long lessonId;

    @NotBlank(message = "StepType is required")
    private StepType type;

    private String content;

    private Long cost;

    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "name", include = JsonTypeInfo.As.PROPERTY)
    @JsonSubTypes({
        @JsonSubTypes.Type(value = StepikBlockTextRequest.class, name = "text"),
        @JsonSubTypes.Type(value = StepikBlockChoiceRequest.class, name = "choice"),
        @JsonSubTypes.Type(value = StepikBlockSortingRequest.class, name = "sorting"),
        @JsonSubTypes.Type(value = StepikBlockMatchingRequest.class, name = "matching"),
        @JsonSubTypes.Type(value = StepikBlockTableRequest.class, name = "table"),
        @JsonSubTypes.Type(value = StepikBlockFillBlanksRequest.class, name = "fill-blanks"),
        @JsonSubTypes.Type(value = StepikBlockStringRequest.class, name = "string"),
        @JsonSubTypes.Type(value = StepikBlockNumberRequest.class, name = "number"),
        @JsonSubTypes.Type(value = StepikBlockMathRequest.class, name = "math"),
        @JsonSubTypes.Type(value = StepikBlockFreeAnswerRequest.class, name = "free-answer"),
        @JsonSubTypes.Type(value = StepikBlockRandomTasksRequest.class, name = "random-tasks"),
        @JsonSubTypes.Type(value = StepikBlockCodeRequest.class, name = "code")
    })
    private StepikBlockRequest stepikBlock;

    private Long stepikStepId;
}
