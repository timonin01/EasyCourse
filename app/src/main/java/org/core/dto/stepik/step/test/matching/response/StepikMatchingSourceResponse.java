package org.core.dto.stepik.step.test.matching.response;

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
public class StepikMatchingSourceResponse {

    @JsonProperty("preserve_firsts_order")
    private Boolean preserveFirstsOrder;

    @JsonProperty("is_html_enabled")
    private Boolean isHtmlEnabled;

    private List<StepikMatchingPairResponse> pairs;

}

