package org.core.dto.stepik.step.enterWord.math;

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
public class StepikMathSourceResponse {

    private String answer;
    @JsonProperty("numerical_test")
    private StepikMathNumericalTestResponse numericalTest;

}
