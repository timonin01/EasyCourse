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

    @JsonProperty("is_html_enabled")
    private Boolean isHtmlEnabled = true;

    private List<StepikChoiceOptionRequest> options;

}
