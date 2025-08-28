package org.core.dto.step;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.domain.StepType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStepDTO {

    private Long id;
    private StepType type;
    private String content;
    private String title;
    private Integer position;

}
