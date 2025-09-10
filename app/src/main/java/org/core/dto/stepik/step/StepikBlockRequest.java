package org.core.dto.stepik.step;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikBlockRequest {

    private String name = "text";
    private String text;
    private Object video = null;
    private Object options = null;

}
