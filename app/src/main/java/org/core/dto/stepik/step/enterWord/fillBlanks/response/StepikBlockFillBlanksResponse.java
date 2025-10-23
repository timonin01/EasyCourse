package org.core.dto.stepik.step.enterWord.fillBlanks.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
public class StepikBlockFillBlanksResponse implements StepikBlockResponse {

    private String text;
    private Object video = null;
    private Object options = null;
    private StepikFillBlanksSourceResponse source;

}
