package org.core.dto.step;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.domain.StepType;
import org.core.dto.stepik.step.StepikBlockRequest;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStepDTO {

    private Long stepId;
    private StepType type;
    private String content;
    private String title;
    private Integer position;
    private Long cost;

    private StepikBlockRequest stepikBlock;

    private Long stepikStepId;
}
