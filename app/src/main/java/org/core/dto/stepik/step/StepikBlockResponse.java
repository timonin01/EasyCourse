package org.core.dto.stepik.step;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import org.core.dto.stepik.step.text.StepikBlockTextResponse;
import org.core.dto.stepik.step.test.choise.response.StepikBlockChoiceResponse;

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "name"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = StepikBlockTextResponse.class, name = "text"),
    @JsonSubTypes.Type(value = StepikBlockChoiceResponse.class, name = "choice")
})
public interface StepikBlockResponse {
}