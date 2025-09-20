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
public class StepikStepSourceResponseData {

    private Long id;
    private Long lesson;
    private Integer position;
    private StepikBlockResponse block;

    @JsonProperty("is_enabled")
    private boolean isEnabled;

    private String status;

}
