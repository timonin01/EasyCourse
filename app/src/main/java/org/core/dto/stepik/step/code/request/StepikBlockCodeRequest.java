package org.core.dto.stepik.step.code.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.StepikBlockRequest;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikBlockCodeRequest implements StepikBlockRequest {

    private String text;
    private Object video = null;
    private Object options = null;

    @JsonProperty("source")
    private StepikCodeSourceRequest sourceRequest;

}
