package org.core.dto.stepik.step.enterWord.fillBlanks;

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
public class StepikFillBlanksComponentResponse {

    private String type;
    private String text;
    private List<StepikFillBlanksOptionResponse> options;

}
