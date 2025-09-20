package org.core.dto.stepik.step.choise.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikChoiceOptionRequest {

    @JsonProperty("is_correct")
    private Boolean isCorrect = false;

    private String text;
    private String feedback = "";

}
