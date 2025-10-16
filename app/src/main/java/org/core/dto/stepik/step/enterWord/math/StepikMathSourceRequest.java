package org.core.dto.stepik.step.enterWord.math;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikMathSourceRequest {

    private String answer;
    private StepikMathNumericalTestRequest numerical_test;

}
