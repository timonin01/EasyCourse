package org.core.dto.stepik.step.test.choise.request;

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
public class StepikChoiceSourceRequest {

    @JsonProperty("is_multiple_choice")
    private Boolean isMultipleChoice = false;

    @JsonProperty("is_always_correct")
    private Boolean isAlwaysCorrect = false;

    @JsonProperty("sample_size")
    private Integer sampleSize = 4;

    @JsonProperty("preserve_order")
    private Boolean preserveOrder = false;

    @JsonProperty("is_html_enabled")
    private Boolean isHtmlEnabled = true;

    @JsonProperty("is_options_feedback")
    private Boolean isOptionsFeedback = false;

    private List<StepikChoiceOptionRequest> options;

}
