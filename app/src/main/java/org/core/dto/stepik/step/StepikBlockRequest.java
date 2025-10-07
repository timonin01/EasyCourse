package org.core.dto.stepik.step;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.core.dto.stepik.step.test.choise.request.StepikBlockChoiceRequest;
import org.core.dto.stepik.step.test.matching.request.StepikBlockMatchingRequest;
import org.core.dto.stepik.step.test.sorting.request.StepikBlockSortingRequest;

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "name"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = StepikBlockTextRequest.class, name = "text"),
        @JsonSubTypes.Type(value = StepikBlockChoiceRequest.class, name = "choice"),
        @JsonSubTypes.Type(value = StepikBlockSortingRequest.class, name = "sorting"),
        @JsonSubTypes.Type(value = StepikBlockMatchingRequest.class, name = "matching")
})
public interface StepikBlockRequest {
}
