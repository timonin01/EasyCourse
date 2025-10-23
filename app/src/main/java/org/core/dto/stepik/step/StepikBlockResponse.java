package org.core.dto.stepik.step;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import org.core.dto.stepik.step.text.StepikBlockTextResponse;
import org.core.dto.stepik.step.test.choise.response.StepikBlockChoiceResponse;
import org.core.dto.stepik.step.test.matching.response.StepikBlockMatchingResponse;
import org.core.dto.stepik.step.test.sorting.response.StepikBlockSortingResponse;
import org.core.dto.stepik.step.test.table.response.StepikBlockTableResponse;
import org.core.dto.stepik.step.enterWord.fillBlanks.response.StepikBlockFillBlanksResponse;
import org.core.dto.stepik.step.enterWord.string.response.StepikBlockStringResponse;
import org.core.dto.stepik.step.enterWord.number.response.StepikBlockNumberResponse;
import org.core.dto.stepik.step.enterWord.math.response.StepikBlockMathResponse;
import org.core.dto.stepik.step.enterWord.freeAnswer.response.StepikBlockFreeAnswerResponse;
import org.core.dto.stepik.step.enterWord.randomTasks.response.StepikBlockRandomTasksResponse;

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "name"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = StepikBlockTextResponse.class, name = "text"),
        @JsonSubTypes.Type(value = StepikBlockChoiceResponse.class, name = "choice"),
        @JsonSubTypes.Type(value = StepikBlockSortingResponse.class, name = "sorting"),
        @JsonSubTypes.Type(value = StepikBlockMatchingResponse.class, name = "matching"),
        @JsonSubTypes.Type(value = StepikBlockTableResponse.class, name = "table"),
        @JsonSubTypes.Type(value = StepikBlockFillBlanksResponse.class, name = "fill-blanks"),
        @JsonSubTypes.Type(value = StepikBlockStringResponse.class, name = "string"),
        @JsonSubTypes.Type(value = StepikBlockNumberResponse.class, name = "number"),
        @JsonSubTypes.Type(value = StepikBlockMathResponse.class, name = "math"),
        @JsonSubTypes.Type(value = StepikBlockFreeAnswerResponse.class, name = "free-answer"),
        @JsonSubTypes.Type(value = StepikBlockRandomTasksResponse.class, name = "random-tasks")
})
public interface StepikBlockResponse {
}