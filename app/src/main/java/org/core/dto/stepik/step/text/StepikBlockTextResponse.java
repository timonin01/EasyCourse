package org.core.dto.stepik.step.text;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.StepikBlockResponse;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikBlockTextResponse implements StepikBlockResponse {

    private String name;
    private String text;
    private Object video;
    private Object options;

}
