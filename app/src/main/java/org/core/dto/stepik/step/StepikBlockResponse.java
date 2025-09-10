package org.core.dto.stepik.step;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikBlockResponse {

    private String name;
    private String text;
    private Object video;
    private Object options;

}
