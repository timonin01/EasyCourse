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
public class StepikMathNumericalTestRequest {

    private String z_re_min;
    private String z_re_max;
    private String z_im_min;
    private String z_im_max;
    private String max_error;
    private Boolean integer_only;

}
