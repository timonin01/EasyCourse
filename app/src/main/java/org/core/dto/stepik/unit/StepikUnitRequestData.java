package org.core.dto.stepik.unit;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikUnitRequestData {

    private String lesson;
    private String section;
    private Integer position;

}
