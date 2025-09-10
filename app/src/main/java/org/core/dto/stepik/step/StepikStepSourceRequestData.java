package org.core.dto.stepik.step;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikStepSourceRequestData {

    private String lesson;
    private Integer position;
    private StepikBlockRequest block;

    @JsonProperty("is_enabled")
    private boolean isEnabled = true;

    private String status = "ready";

}
