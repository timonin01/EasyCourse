package org.core.dto.stepik.step.enterWord.number.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikNumberOptionRequest {

    private String answer;

    @JsonProperty("max_error")
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String maxError;

    @JsonProperty("z_re_min")
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String zReMin = "";

    @JsonProperty("integer_only")
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private Boolean integerOnly = false;

}
