package org.core.dto.stepik.step.enterWord.fillBlanks.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.StepikBlockRequest;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikBlockFillBlanksRequest implements StepikBlockRequest {

    private String text;
    private Object video = null;
    private Object options = null;
    private StepikFillBlanksSourceRequest source;

}
