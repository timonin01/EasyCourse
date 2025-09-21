package org.core.dto.stepik.step;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class StepikStepSourceResponse {

    @JsonProperty("step-sources")
    private List<StepikStepSourceResponseData> stepSources;

    public StepikStepSourceResponseData getStepSource() {
        return stepSources != null && !stepSources.isEmpty() ? stepSources.get(0) : null;
    }

}
