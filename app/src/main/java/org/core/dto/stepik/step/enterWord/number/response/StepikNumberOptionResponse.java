package org.core.dto.stepik.step.enterWord.number.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class StepikNumberOptionResponse {

    private String answer;

    @JsonProperty("max_error")
    private String maxError;

    @JsonProperty("z_re_min")
    private String zReMin;

    @JsonProperty("integer_only")
    private Boolean integerOnly;

}
