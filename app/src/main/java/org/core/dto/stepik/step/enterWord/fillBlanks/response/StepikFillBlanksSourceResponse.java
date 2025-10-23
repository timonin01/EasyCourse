package org.core.dto.stepik.step.enterWord.fillBlanks.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikFillBlanksSourceResponse {

    private List<StepikFillBlanksComponentResponse> components;
    private Boolean is_case_sensitive;
    private Boolean is_detailed_feedback;
    private Boolean is_partially_correct;

}
