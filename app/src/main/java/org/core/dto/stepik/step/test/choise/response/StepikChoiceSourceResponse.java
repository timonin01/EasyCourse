package org.core.dto.stepik.step.test.choise.response;

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
public class StepikChoiceSourceResponse {

    @JsonProperty("is_multiple_choice")
    private Boolean isMultipleChoice;

    @JsonProperty("is_always_correct")
    private Boolean isAlwaysCorrect;

    @JsonProperty("sample_size")
    private Integer sampleSize;

    @JsonProperty("preserve_order")
    private Boolean preserveOrder;

    @JsonProperty("is_html_enabled")
    private Boolean isHtmlEnabled;

    @JsonProperty("is_options_feedback")
    private Boolean isOptionsFeedback;

    private List<StepikChoiceOptionResponse> options;

}
