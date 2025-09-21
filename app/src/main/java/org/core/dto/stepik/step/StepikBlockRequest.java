package org.core.dto.stepik.step;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.core.dto.stepik.step.choise.request.StepikBlockChoiceRequest;

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "name"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = StepikBlockTextRequest.class, name = "text"),
    @JsonSubTypes.Type(value = StepikBlockChoiceRequest.class, name = "choice")
})
public interface StepikBlockRequest {
}
