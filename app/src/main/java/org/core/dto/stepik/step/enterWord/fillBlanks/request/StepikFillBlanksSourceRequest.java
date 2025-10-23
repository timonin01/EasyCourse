package org.core.dto.stepik.step.enterWord.fillBlanks.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public class StepikFillBlanksSourceRequest {

    private List<StepikFillBlanksComponentRequest> components;

    @JsonProperty("is_case_sensitive")
    private Boolean isCaseSensitive = false;

    @JsonProperty("is_detailed_feedback")
    private Boolean isDetailedFeedback = false;

    @JsonProperty("is_partially_correct")
    private Boolean isPartiallyCorrect = false;

}
