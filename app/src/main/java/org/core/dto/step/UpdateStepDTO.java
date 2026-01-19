package org.core.dto.step;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonSubTypes;
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
import org.core.dto.stepik.step.code.request.StepikBlockCodeRequest;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStepDTO {

    private Long stepId;
    private StepType type;
    private String content;
    private String title;
    private Integer position;
    private Long cost;

    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "name", include = JsonTypeInfo.As.PROPERTY)
    @JsonSubTypes({
        @JsonSubTypes.Type(value = StepikBlockTextRequest.class, name = "text"),
        @JsonSubTypes.Type(value = StepikBlockChoiceRequest.class, name = "choice"),
        @JsonSubTypes.Type(value = StepikBlockSortingRequest.class, name = "sorting"),
        @JsonSubTypes.Type(value = StepikBlockMatchingRequest.class, name = "matching"),
        @JsonSubTypes.Type(value = StepikBlockTableRequest.class, name = "table"),
        @JsonSubTypes.Type(value = StepikBlockCodeRequest.class, name = "code")
    })
    private StepikBlockRequest stepikBlock;

    private Long stepikStepId;
}
