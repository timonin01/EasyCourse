package org.core.dto.stepik.step.text;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.StepikBlockRequest;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikBlockTextRequest implements StepikBlockRequest {

    private String name = "text";
    private String text;
    private Object video = null;
    private Object options = null;

}
