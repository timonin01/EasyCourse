package org.core.dto.stepik.step.enterWord.freeAnswer;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.StepikBlockResponse;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class StepikBlockFreeAnswerResponse implements StepikBlockResponse {

    private String name;
    private String text;
    private Object video;
    private Object options;
    private StepikFreeAnswerSourceResponse source;

}
