package org.core.dto.stepik.step.enterWord.freeAnswer.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikFreeAnswerSourceResponse {

    @JsonProperty("is_attachments_enabled")
    private Boolean isAttachmentsEnabled;
    @JsonProperty("is_html_enabled")
    private Boolean isHtmlEnabled;
    @JsonProperty("manual_scoring")
    private Boolean manualScoring;

}
