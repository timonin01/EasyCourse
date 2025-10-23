package org.core.dto.stepik.step.enterWord.math.request;

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
public class StepikMathNumericalTestRequest {

    @JsonProperty("z_re_min")
    private String zReMin;

    @JsonProperty("z_re_max")
    private String zReMax;

    @JsonProperty("z_im_min")
    private String zImMin;

    @JsonProperty("z_im_max")
    private String zImMax;

    @JsonProperty("max_error")
    private String maxError = "1e-06";

    @JsonProperty("integer_only")
    private Boolean integerOnly = false;

}
