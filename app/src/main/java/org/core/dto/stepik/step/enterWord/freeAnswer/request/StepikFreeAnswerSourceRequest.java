package org.core.dto.stepik.step.enterWord.freeAnswer.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikFreeAnswerSourceRequest {

    private Boolean is_attachments_enabled;
    private Boolean is_html_enabled;
    private Boolean manual_scoring;

}
