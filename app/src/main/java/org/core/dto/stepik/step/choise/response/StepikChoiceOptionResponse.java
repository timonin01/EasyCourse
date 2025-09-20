package org.core.dto.stepik.step.choise.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikChoiceOptionResponse {

    @JsonProperty("is_correct")
    private Boolean isCorrect;

    private String text;
    private String feedback;

}
